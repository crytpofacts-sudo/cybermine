/*
 * Shared network configuration for Cloudflare Pages Functions.
 *
 * The active chain is selected via the ACTIVE_CHAIN_ID environment variable
 * (set in Cloudflare Pages dashboard). Defaults to 97 (BSC Testnet).
 */

export interface NetworkConfig {
  chainId: number;
  rpcUrls: string[];
  stakingAddress: string;
  deploymentBlock: number; // Block the staking contract was deployed at
  joinedEventTopic: string; // keccak256("Joined(address,address)")
}

// keccak256("Joined(address,address)")
const JOINED_TOPIC = "0x7702dccda75540ad1dca8d5276c048f4a5c0e4203f6da4be214bfb1901b203ea";

export const NETWORKS: Record<number, NetworkConfig> = {
  97: {
    chainId: 97,
    rpcUrls: [
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
      "https://data-seed-prebsc-2-s1.binance.org:8545/",
      "https://bsc-testnet-rpc.publicnode.com",
    ],
    stakingAddress: "0xBa75A1CDAD9E5fF1218561f039b80D465A37723e",
    deploymentBlock: 48_000_000, // approximate deployment block on testnet
    joinedEventTopic: JOINED_TOPIC,
  },
  56: {
    chainId: 56,
    rpcUrls: [
      "https://bsc-dataseed.binance.org/",
      "https://bsc-dataseed1.defibit.io/",
      "https://bsc-dataseed1.ninicoin.io/",
    ],
    stakingAddress: "", // Replace with mainnet address when deployed
    deploymentBlock: 0,
    joinedEventTopic: JOINED_TOPIC,
  },
};

export function getNetworkConfig(env: Record<string, string | undefined>): NetworkConfig {
  const chainId = parseInt(env.ACTIVE_CHAIN_ID || "97", 10);
  const config = NETWORKS[chainId];
  if (!config) throw new Error(`Unsupported chain ID: ${chainId}`);
  return config;
}
