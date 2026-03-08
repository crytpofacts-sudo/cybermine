/*
 * CyberMine — Contract Configuration
 * 
 * Supports BSC Testnet (97) and BSC Mainnet (56).
 * To switch to mainnet, update ACTIVE_CHAIN_ID and deploy mainnet addresses.
 */

export type ChainConfig = {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  rpcUrls: string[]; // fallback list for resilience
  blockExplorer: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  staking: string;
  mineToken: string;
  lpToken: string;
  isTestnet: boolean;
};

export const BSC_TESTNET: ChainConfig = {
  chainId: 97,
  chainIdHex: "0x61",
  name: "BSC Testnet",
  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  rpcUrls: [
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
    "https://data-seed-prebsc-2-s1.binance.org:8545/",
    "https://bsc-testnet-rpc.publicnode.com",
  ],
  blockExplorer: "https://testnet.bscscan.com",
  nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
  staking: "0xBa75A1CDAD9E5fF1218561f039b80D465A37723e",
  mineToken: "0x40325c4F37F577111faFC4f31AB7979026626680",
  lpToken: "0xc742d03dc150956940f4ffDFA477f36926a2dBc4",
  isTestnet: true,
};

export const BSC_MAINNET: ChainConfig = {
  chainId: 56,
  chainIdHex: "0x38",
  name: "BSC Mainnet",
  rpcUrl: "https://bsc-dataseed.binance.org/",
  rpcUrls: [
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.defibit.io/",
    "https://bsc-dataseed1.ninicoin.io/",
  ],
  blockExplorer: "https://bscscan.com",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  // Replace with mainnet addresses when deployed
  staking: "",
  mineToken: "",
  lpToken: "",
  isTestnet: false,
};

// ─── ACTIVE NETWORK ────────────────────────────────────────────
// Single switch: change this one line to BSC_MAINNET when ready for production.
// The Cloudflare Pages Functions also need ACTIVE_CHAIN_ID=56 in env vars.
export const ACTIVE_CHAIN = BSC_TESTNET;

// ─── Chain map for lookup ──────────────────────────────────────
export const CHAINS: Record<number, ChainConfig> = {
  [BSC_TESTNET.chainId]: BSC_TESTNET,
  [BSC_MAINNET.chainId]: BSC_MAINNET,
};

// ─── Explorer helpers ──────────────────────────────────────────
export function txUrl(hash: string, chain = ACTIVE_CHAIN): string {
  return `${chain.blockExplorer}/tx/${hash}`;
}

export function addressUrl(addr: string, chain = ACTIVE_CHAIN): string {
  return `${chain.blockExplorer}/address/${addr}`;
}
