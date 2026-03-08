/*
 * WalletConnect v2 — EthereumProvider helper
 *
 * Initialises a WalletConnect EthereumProvider for BSC.
 * Set VITE_WC_PROJECT_ID in your Cloudflare Pages environment variables.
 * Get a free project ID at https://cloud.walletconnect.com
 *
 * Falls back to a public test project ID if not set.
 */
import EthereumProvider from "@walletconnect/ethereum-provider";
import { ACTIVE_CHAIN } from "@/config/contracts";

// Read from env, fall back to a public test project ID
const WC_PROJECT_ID =
  (import.meta as any).env?.VITE_WC_PROJECT_ID ||
  "b56e18d47c72ab683b10814fe9495694"; // public test ID — replace in production

let wcProviderInstance: InstanceType<typeof EthereumProvider> | null = null;

export async function getWalletConnectProvider(): Promise<InstanceType<typeof EthereumProvider>> {
  if (wcProviderInstance) {
    // If already connected, reuse
    if (wcProviderInstance.connected) return wcProviderInstance;
    // Otherwise, clean up and create fresh
    try { await wcProviderInstance.disconnect(); } catch { /* ignore */ }
    wcProviderInstance = null;
  }

  const provider = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [ACTIVE_CHAIN.chainId],
    showQrModal: true,
    optionalChains: [56, 97], // BSC Mainnet + Testnet
    rpcMap: {
      56: "https://bsc-dataseed.binance.org/",
      97: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    },
    metadata: {
      name: "CyberMine",
      description: "Mining for the People — Stake LP, Earn $MINE",
      url: typeof window !== "undefined" ? window.location.origin : "https://cybermine.io",
      icons: ["https://cybermine.io/favicon.ico"],
    },
  });

  wcProviderInstance = provider;
  return provider;
}

export function getWcInstance() {
  return wcProviderInstance;
}

export async function disconnectWalletConnect() {
  if (wcProviderInstance) {
    try { await wcProviderInstance.disconnect(); } catch { /* ignore */ }
    wcProviderInstance = null;
  }
}
