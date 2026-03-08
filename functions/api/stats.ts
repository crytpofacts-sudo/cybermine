/*
 * GET /api/stats
 *
 * Returns:
 * {
 *   "chainId": <number>,
 *   "totalUsers": <number>,
 *   "updatedAt": <unix_ms>
 * }
 *
 * Triggers an on-demand sync (throttled to 1/min) before returning data.
 * Requires KV namespace binding: REF_INDEX
 * Requires env var: ACTIVE_CHAIN_ID (defaults to 97)
 */

import { getNetworkConfig } from "../_shared/config";
import { syncEvents } from "../_shared/indexer";

interface Env {
  REF_INDEX: KVNamespace;
  ACTIVE_CHAIN_ID?: string;
  [key: string]: unknown;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const network = getNetworkConfig(env as unknown as Record<string, string | undefined>);

    // Trigger on-demand sync (throttled internally)
    const { userCount } = await syncEvents(env.REF_INDEX, network);

    return new Response(
      JSON.stringify({
        chainId: network.chainId,
        totalUsers: userCount,
        updatedAt: Date.now(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=30",
        },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
};
