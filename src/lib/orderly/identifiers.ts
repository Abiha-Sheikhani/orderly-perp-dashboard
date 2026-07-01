import { encodePacked, keccak256, type Address, type Hex } from "viem";

/** keccak256("USDC"-style ascii token symbol), used by the Vault contract to key allowed tokens. */
export function getTokenHash(symbol: string): Hex {
  return keccak256(encodePacked(["string"], [symbol]));
}

/** keccak256(brokerId), used both on-chain and in EIP-712 payload derivations. */
export function getBrokerHash(brokerId: string): Hex {
  return keccak256(encodePacked(["string"], [brokerId]));
}

/**
 * Orderly's account_id is fully deterministic from the wallet address + the
 * broker it registered under:
 *   account_id = keccak256(abi.encodePacked(userAddress, brokerHash))
 * This lets the UI compute it locally instead of waiting on an API round
 * trip, while the value returned by POST /v1/register_account is still
 * treated as the source of truth once available.
 */
export function computeAccountId(address: Address, brokerId: string): Hex {
  const brokerHash = getBrokerHash(brokerId);
  return keccak256(encodePacked(["address", "bytes32"], [address, brokerHash]));
}
