/*
 * eventCache.ts — Reusable event log fetching + localStorage caching utility
 *
 * Provides progressive block scanning with caching so we don't re-scan
 * the entire chain on every page load. Stores results in localStorage
 * keyed by (chainId + contractAddress + eventName + optional filterKey).
 *
 * Used by:
 *   - HeroSection: count unique Joined events → total miners
 *   - Mine page: fetch Claimed events for connected wallet → claim history
 *   - Referrals page: fetch Joined events where referrer == wallet → referred list
 */

import { Contract, JsonRpcProvider, type EventLog, type Log } from "ethers";
import { ACTIVE_CHAIN } from "@/config/contracts";
import { STAKING_ABI } from "@/config/stakingAbi";

// ─── Types ────────────────────────────────────────────────────────

export interface CachedEventData<T> {
  lastBlock: number;
  items: T[];
}

// ─── localStorage helpers ─────────────────────────────────────────

function cacheKey(eventName: string, filterKey: string): string {
  return `cybermine_${ACTIVE_CHAIN.chainId}_${eventName}_${filterKey}`;
}

function loadCache<T>(eventName: string, filterKey: string): CachedEventData<T> | null {
  try {
    const raw = localStorage.getItem(cacheKey(eventName, filterKey));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCache<T>(eventName: string, filterKey: string, data: CachedEventData<T>): void {
  try {
    localStorage.setItem(cacheKey(eventName, filterKey), JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// ─── Core: fetch logs in chunks with progressive scanning ─────────

const CHUNK_SIZE = 50_000; // blocks per RPC call
const MAX_SCAN_BLOCKS = 2_000_000; // max blocks to scan from current

/**
 * getProvider — create a JsonRpcProvider using the first available RPC
 */
export function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(ACTIVE_CHAIN.rpcUrl);
}

/**
 * getStakingContract — read-only staking contract instance
 */
export function getStakingContract(provider?: JsonRpcProvider): Contract {
  const p = provider || getProvider();
  return new Contract(ACTIVE_CHAIN.staking, STAKING_ABI, p);
}

/**
 * fetchEventsProgressively — fetch event logs in chunks, starting from
 * the cached lastBlock (if any), up to the current block.
 *
 * @param eventName - The event name (e.g., "Joined", "Claimed")
 * @param filterKey - A unique key for this specific filter (e.g., "all" or wallet address)
 * @param buildFilter - A function that returns the ethers filter for the event
 * @param parseEvent - A function that parses a raw log into the desired shape
 * @param maxBlocks - Maximum blocks to scan (default: MAX_SCAN_BLOCKS)
 * @returns The accumulated items (cached + new)
 */
export async function fetchEventsProgressively<T>(
  eventName: string,
  filterKey: string,
  buildFilter: (contract: Contract) => any,
  parseEvent: (log: EventLog | Log) => T | null,
  maxBlocks: number = MAX_SCAN_BLOCKS,
): Promise<CachedEventData<T>> {
  const provider = getProvider();
  const staking = getStakingContract(provider);
  const currentBlock = await provider.getBlockNumber();

  // Load cache
  const cached = loadCache<T>(eventName, filterKey);
  const startBlock = cached ? cached.lastBlock + 1 : Math.max(0, currentBlock - maxBlocks);
  const existingItems = cached ? cached.items : [];

  // If we're already up to date, return cached
  if (startBlock > currentBlock) {
    return { lastBlock: currentBlock, items: existingItems };
  }

  // Fetch in chunks
  const filter = buildFilter(staking);
  const newItems: T[] = [];

  for (let from = startBlock; from <= currentBlock; from += CHUNK_SIZE) {
    const to = Math.min(from + CHUNK_SIZE - 1, currentBlock);
    try {
      const logs = await staking.queryFilter(filter, from, to);
      for (const log of logs) {
        const parsed = parseEvent(log);
        if (parsed) newItems.push(parsed);
      }
    } catch (err) {
      console.warn(`Failed to fetch ${eventName} events for blocks ${from}-${to}:`, err);
      // Continue with next chunk — partial results are better than none
    }
  }

  const allItems = [...existingItems, ...newItems];
  const result: CachedEventData<T> = { lastBlock: currentBlock, items: allItems };

  // Save to cache
  saveCache(eventName, filterKey, result);

  return result;
}

// ─── Pre-built fetchers ───────────────────────────────────────────

/** Joined event data */
export interface JoinedEvent {
  user: string;
  referrer: string;
  blockNumber: number;
  txHash: string;
}

/** Fetch all Joined events (for total miners count) */
export async function fetchJoinedEvents(): Promise<JoinedEvent[]> {
  const result = await fetchEventsProgressively<JoinedEvent>(
    "Joined",
    "all",
    (contract) => contract.filters.Joined(),
    (log) => {
      const el = log as EventLog;
      if (!el.args) return null;
      return {
        user: el.args[0] as string,
        referrer: el.args[1] as string,
        blockNumber: el.blockNumber,
        txHash: el.transactionHash,
      };
    },
  );
  return result.items;
}

/** Fetch Joined events where referrer == given address */
export async function fetchReferredMembers(referrerAddress: string): Promise<JoinedEvent[]> {
  const result = await fetchEventsProgressively<JoinedEvent>(
    "Joined_ref",
    referrerAddress.toLowerCase(),
    (contract) => contract.filters.Joined(null, referrerAddress),
    (log) => {
      const el = log as EventLog;
      if (!el.args) return null;
      return {
        user: el.args[0] as string,
        referrer: el.args[1] as string,
        blockNumber: el.blockNumber,
        txHash: el.transactionHash,
      };
    },
  );
  return result.items;
}

/** Claimed event data */
export interface ClaimedEvent {
  user: string;
  reward: bigint;
  baseWeightFp: bigint;
  referralBonusUsedFp: bigint;
  totalBaseWeightFp: bigint;
  remainingSupply: bigint;
  blockNumber: number;
  txHash: string;
}

/** Fetch Claimed events for a specific user */
export async function fetchClaimHistory(userAddress: string): Promise<ClaimedEvent[]> {
  const result = await fetchEventsProgressively<ClaimedEvent>(
    "Claimed",
    userAddress.toLowerCase(),
    (contract) => contract.filters.Claimed(userAddress),
    (log) => {
      const el = log as EventLog;
      if (!el.args) return null;
      return {
        user: el.args[0] as string,
        reward: BigInt(el.args[1]),
        baseWeightFp: BigInt(el.args[2]),
        referralBonusUsedFp: BigInt(el.args[3]),
        totalBaseWeightFp: BigInt(el.args[4]),
        remainingSupply: BigInt(el.args[5]),
        blockNumber: el.blockNumber,
        txHash: el.transactionHash,
      };
    },
  );
  // Return newest first
  return [...result.items].reverse();
}
