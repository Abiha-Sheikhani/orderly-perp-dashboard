import type { Address } from "viem";
import { deserializeKeyPair, serializeKeyPair, type OrderlyKeyPair } from "./crypto";

interface StoredKeyRecord {
  publicKeyB64: string;
  secretKeyB64: string;
  accountId: string;
  expiration: number;
  scope: string;
}

function storageKey(address: Address, brokerId: string, chainId: number): string {
  return `orderly:key:${chainId}:${brokerId}:${address.toLowerCase()}`;
}

/**
 * NOTE: localStorage is used here for demo simplicity (this key only grants
 * trading/read scope, never withdrawal — withdrawals always require a fresh
 * wallet EIP-712 signature). A production build should prefer IndexedDB with
 * a non-extractable CryptoKey, or re-derive the key each session.
 */
export function saveOrderlyKey(
  address: Address,
  brokerId: string,
  chainId: number,
  keyPair: OrderlyKeyPair,
  accountId: string,
  expiration: number,
  scope: string
) {
  const { publicKeyB64, secretKeyB64 } = serializeKeyPair(keyPair);
  const record: StoredKeyRecord = { publicKeyB64, secretKeyB64, accountId, expiration, scope };
  localStorage.setItem(storageKey(address, brokerId, chainId), JSON.stringify(record));
}

export function loadOrderlyKey(
  address: Address,
  brokerId: string,
  chainId: number
): { keyPair: OrderlyKeyPair; accountId: string; expiration: number; scope: string } | null {
  const raw = localStorage.getItem(storageKey(address, brokerId, chainId));
  if (!raw) return null;
  try {
    const record = JSON.parse(raw) as StoredKeyRecord;
    if (record.expiration * 1000 < Date.now()) {
      clearOrderlyKey(address, brokerId, chainId);
      return null;
    }
    return {
      keyPair: deserializeKeyPair(record.publicKeyB64, record.secretKeyB64),
      accountId: record.accountId,
      expiration: record.expiration,
      scope: record.scope,
    };
  } catch {
    return null;
  }
}

export function clearOrderlyKey(address: Address, brokerId: string, chainId: number) {
  localStorage.removeItem(storageKey(address, brokerId, chainId));
}
