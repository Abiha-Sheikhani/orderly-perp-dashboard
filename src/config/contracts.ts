import { arbitrumSepolia, baseSepolia } from "viem/chains";
import type { Address } from "viem";
import type { SupportedChainId } from "./chains";

interface ChainContracts {
  usdc: Address;
  vault: Address;
  usdcDecimals: number;
}

/**
 * Verified Orderly Vault + testnet USDC addresses.
 * Source: https://orderly.network/docs/build-on-omnichain/addresses
 */
export const CONTRACTS: Record<SupportedChainId, ChainContracts> = {
  [arbitrumSepolia.id]: {
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    vault: "0x0EaC556c0C2321BA25b9DC01e4e3c95aD5CDCd2f",
    usdcDecimals: 6,
  },
  [baseSepolia.id]: {
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    vault: "0xdc7348975aE9334DbdcB944DDa9163Ba8406a0ec",
    usdcDecimals: 6,
  },
};

export function getContracts(chainId: SupportedChainId): ChainContracts {
  return CONTRACTS[chainId];
}
