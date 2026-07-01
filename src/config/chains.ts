import { arbitrumSepolia, baseSepolia } from "viem/chains";
import type { Chain } from "viem";

/**
 * Orderly currently anchors its Vault (Asset Layer) contracts on a handful of
 * EVM testnets. We support the two most commonly used ones for the omnichain
 * flow. Arbitrum Sepolia is the primary/default chain used throughout the app.
 *
 * Source: https://orderly.network/docs/build-on-omnichain/addresses (fetched live)
 */
export const SUPPORTED_CHAINS = [arbitrumSepolia, baseSepolia] as const satisfies readonly Chain[];

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]["id"];

export const DEFAULT_CHAIN = arbitrumSepolia;

export const CHAIN_METADATA: Record<
  SupportedChainId,
  { label: string; faucetUrl: string; explorer: string }
> = {
  [arbitrumSepolia.id]: {
    label: "Arbitrum Sepolia",
    faucetUrl: "https://faucet.circle.com/",
    explorer: "https://sepolia.arbiscan.io",
  },
  [baseSepolia.id]: {
    label: "Base Sepolia",
    faucetUrl: "https://faucet.circle.com/",
    explorer: "https://sepolia.basescan.org",
  },
};

export function isSupportedChainId(chainId: number | undefined): chainId is SupportedChainId {
  if (!chainId) return false;
  return SUPPORTED_CHAINS.some((c) => c.id === chainId);
}
