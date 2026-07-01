import { OFF_CHAIN_VERIFYING_CONTRACT, LEDGER_CONTRACT_TESTNET } from "@/config/orderly";
import type { Address } from "viem";

/**
 * Full EIP-712 message-type set used by Orderly Network, verbatim from:
 * https://orderly.network/docs/build-on-evm/user-flows/wallet-authentication
 */
export const ORDERLY_EIP712_TYPES = {
  Registration: [
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "timestamp", type: "uint64" },
    { name: "registrationNonce", type: "uint256" },
  ],
  AddOrderlyKey: [
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "orderlyKey", type: "string" },
    { name: "scope", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "expiration", type: "uint64" },
  ],
  Withdraw: [
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "receiver", type: "address" },
    { name: "token", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "withdrawNonce", type: "uint64" },
    { name: "timestamp", type: "uint64" },
  ],
} as const;

/** Registration + AddOrderlyKey are verified off-chain by Orderly's API. */
export function offChainDomain(chainId: number) {
  return {
    name: "Orderly",
    version: "1",
    chainId,
    verifyingContract: OFF_CHAIN_VERIFYING_CONTRACT,
  } as const;
}

/** Withdraw + SettlePnl are verified on-chain by the Ledger contract (testnet). */
export function onChainDomain(chainId: number) {
  return {
    name: "Orderly",
    version: "1",
    chainId,
    verifyingContract: LEDGER_CONTRACT_TESTNET,
  } as const;
}

export interface RegistrationMessage {
  brokerId: string;
  chainId: number;
  timestamp: number;
  registrationNonce: number;
}

export function buildRegistrationTypedData(message: RegistrationMessage) {
  return {
    domain: offChainDomain(message.chainId),
    types: { Registration: ORDERLY_EIP712_TYPES.Registration },
    primaryType: "Registration" as const,
    message: {
      brokerId: message.brokerId,
      chainId: BigInt(message.chainId),
      timestamp: BigInt(message.timestamp),
      registrationNonce: BigInt(message.registrationNonce),
    },
  };
}

export interface AddOrderlyKeyMessage {
  brokerId: string;
  chainId: number;
  orderlyKey: string;
  scope: string;
  timestamp: number;
  expiration: number;
}

export function buildAddOrderlyKeyTypedData(message: AddOrderlyKeyMessage) {
  return {
    domain: offChainDomain(message.chainId),
    types: { AddOrderlyKey: ORDERLY_EIP712_TYPES.AddOrderlyKey },
    primaryType: "AddOrderlyKey" as const,
    message: {
      brokerId: message.brokerId,
      chainId: BigInt(message.chainId),
      orderlyKey: message.orderlyKey,
      scope: message.scope,
      timestamp: BigInt(message.timestamp),
      expiration: BigInt(message.expiration),
    },
  };
}

export interface WithdrawMessage {
  brokerId: string;
  chainId: number;
  receiver: Address;
  token: string;
  amount: string;
  withdrawNonce: number;
  timestamp: number;
}

export function buildWithdrawTypedData(message: WithdrawMessage) {
  return {
    domain: onChainDomain(message.chainId),
    types: { Withdraw: ORDERLY_EIP712_TYPES.Withdraw },
    primaryType: "Withdraw" as const,
    message: {
      brokerId: message.brokerId,
      chainId: BigInt(message.chainId),
      receiver: message.receiver,
      token: message.token,
      amount: BigInt(message.amount),
      withdrawNonce: BigInt(message.withdrawNonce),
      timestamp: BigInt(message.timestamp),
    },
  };
}
