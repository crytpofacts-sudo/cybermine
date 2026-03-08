/*
 * GET /api/referrals?referrer=0x...&page=1&pageSize=20
 *
 * Returns:
 * {
 *   "referrer": "0x...",
 *   "chainId": <number>,
 *   "page": <number>,
 *   "pageSize": <number>,
 *   "total": <number>,
 *   "referees": ["0x...", ...]
 * }
 *
 * Triggers an on-demand sync (throttled to 1/min) before returning data.
 * Requires KV namespace binding: REF_INDEX
 * Requires env var: ACTIVE_CHAIN_ID (defaults to 97)
 */

import { getNetworkConfig } from "../_shared/config";
import { syncEvents, getReferrals } from "../_shared/indexer";

interface Env {
  REF_INDEX: KVNamespace;
  ACTIVE_CHAIN_ID?: string;
  [key: string]: unknown;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);

  const referrer = url.searchParams.get("referrer");
  if (!referrer || !/^0x[a-fA-F0-9]{40}$/.test(referrer)) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid 'referrer' query parameter" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)));

  try {
    const network = getNetworkConfig(env as unknown as Record<string, string | undefined>);

    // Trigger on-demand sync (throttled internally)
    await syncEvents(env.REF_INDEX, network);

    const { referees, total } = await getReferrals(
      env.REF_INDEX,
      network.chainId,
      referrer,
      page,
      pageSize,
    );

    return new Response(
      JSON.stringify({
        referrer: referrer.toLowerCase(),
        chainId: network.chainId,
        page,
        pageSize,
        total,
        referees,
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
