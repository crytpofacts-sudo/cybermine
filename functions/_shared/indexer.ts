/*
 * Event Indexer — scans Joined(user, referrer) events from the staking contract.
 *
 * Uses Cloudflare KV for storage:
 *   meta:userCount                          -> string integer
 *   meta:lastProcessedBlock:<chainId>       -> string integer
 *   meta:lastSyncTime:<chainId>             -> string integer (unix ms)
 *   isUser:<chainId>:<addressLower>         -> "1"
 *   referrals:<chainId>:<referrerLower>     -> JSON string[] of referee addresses
 *
 * Throttled to at most once per 60 seconds per chain.
 */

import { type NetworkConfig } from "./config";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BLOCKS_PER_BATCH = 5000;
const SYNC_THROTTLE_MS = 60_000; // 1 minute

interface Env {
  REF_INDEX: KVNamespace;
  [key: string]: unknown;
}

// ─── RPC helper ──────────────────────────────────────────────────

async function rpcCall(rpcUrls: string[], method: string, params: unknown[]): Promise<unknown> {
  let lastError: Error | null = null;
  for (const url of rpcUrls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      const json = (await res.json()) as { result?: unknown; error?: { message: string } };
      if (json.error) throw new Error(json.error.message);
      return json.result;
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw lastError || new Error("All RPCs failed");
}

function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

function padAddress(hex: string): string {
  // Event log topics encode addresses as 32-byte left-padded hex
  return "0x" + hex.slice(-40).toLowerCase();
}

// ─── Sync logic ──────────────────────────────────────────────────

export async function syncEvents(kv: KVNamespace, network: NetworkConfig): Promise<{ synced: boolean; userCount: number }> {
  const chainId = network.chainId;

  // Throttle: check last sync time
  const lastSyncStr = await kv.get(`meta:lastSyncTime:${chainId}`);
  const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
  const now = Date.now();

  if (now - lastSync < SYNC_THROTTLE_MS) {
    const userCountStr = await kv.get("meta:userCount") || "0";
    return { synced: false, userCount: parseInt(userCountStr, 10) };
  }

  // Get current block
  const currentBlockHex = (await rpcCall(network.rpcUrls, "eth_blockNumber", [])) as string;
  const currentBlock = hexToNumber(currentBlockHex);

  // Get last processed block
  const lastBlockStr = await kv.get(`meta:lastProcessedBlock:${chainId}`);
  let fromBlock = lastBlockStr ? parseInt(lastBlockStr, 10) + 1 : network.deploymentBlock;

  // Get current user count
  const userCountStr = await kv.get("meta:userCount") || "0";
  let userCount = parseInt(userCountStr, 10);

  // Process in batches
  let processed = false;
  while (fromBlock <= currentBlock) {
    const toBlock = Math.min(fromBlock + BLOCKS_PER_BATCH - 1, currentBlock);

    const logs = (await rpcCall(network.rpcUrls, "eth_getLogs", [
      {
        address: network.stakingAddress,
        topics: [network.joinedEventTopic],
        fromBlock: "0x" + fromBlock.toString(16),
        toBlock: "0x" + toBlock.toString(16),
      },
    ])) as Array<{ topics: string[]; transactionHash: string; blockNumber: string }>;

    for (const log of logs) {
      // Joined(address indexed user, address indexed referrer)
      if (log.topics.length < 3) continue;

      const user = padAddress(log.topics[1]);
      const referrer = padAddress(log.topics[2]);

      // Check if user is already indexed
      const isUserKey = `isUser:${chainId}:${user}`;
      const existing = await kv.get(isUserKey);

      if (!existing) {
        // New user
        await kv.put(isUserKey, "1");
        userCount++;
        processed = true;

        // If referrer is not zero address, add to referral list
        if (referrer !== ZERO_ADDRESS) {
          const refKey = `referrals:${chainId}:${referrer}`;
          const existingRefs = await kv.get(refKey);
          let refs: string[] = [];
          if (existingRefs) {
            try {
              refs = JSON.parse(existingRefs);
            } catch {
              refs = [];
            }
          }
          if (!refs.includes(user)) {
            refs.push(user);
            await kv.put(refKey, JSON.stringify(refs));
          }
        }
      }
    }

    fromBlock = toBlock + 1;
  }

  // Update metadata
  await kv.put("meta:userCount", userCount.toString());
  await kv.put(`meta:lastProcessedBlock:${chainId}`, currentBlock.toString());
  await kv.put(`meta:lastSyncTime:${chainId}`, now.toString());

  return { synced: true, userCount };
}

// ─── Read helpers ────────────────────────────────────────────────

export async function getUserCount(kv: KVNamespace): Promise<number> {
  const str = await kv.get("meta:userCount");
  return str ? parseInt(str, 10) : 0;
}

export async function getReferrals(
  kv: KVNamespace,
  chainId: number,
  referrer: string,
  page: number,
  pageSize: number,
): Promise<{ referees: string[]; total: number }> {
  const refKey = `referrals:${chainId}:${referrer.toLowerCase()}`;
  const data = await kv.get(refKey);

  if (!data) return { referees: [], total: 0 };

  let all: string[];
  try {
    all = JSON.parse(data);
  } catch {
    return { referees: [], total: 0 };
  }

  const total = all.length;
  const start = (page - 1) * pageSize;
  const referees = all.slice(start, start + pageSize);

  return { referees, total };
}
