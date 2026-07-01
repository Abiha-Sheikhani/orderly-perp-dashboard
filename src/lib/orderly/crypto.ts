import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";

export interface OrderlyKeyPair {
  /** Raw 32-byte ed25519 public key. */
  publicKey: Uint8Array;
  /** Raw 32-byte ed25519 private seed. Never sent to any server — signs requests locally. */
  secretKey: Uint8Array;
  /** Orderly's wire format for the public key, e.g. "ed25519:9f...". */
  orderlyKey: string;
}

/**
 * Generates a fresh Orderly API key pair (ed25519). This key gets delegated
 * to Orderly via a signed `AddOrderlyKey` EIP-712 message and is then used to
 * authenticate all subsequent private REST/WS requests — the wallet itself is
 * never needed again until the key expires or a new device onboards.
 */
export function generateOrderlyKeyPair(): OrderlyKeyPair {
  const secretKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(secretKey);
  return {
    publicKey,
    secretKey,
    orderlyKey: `ed25519:${bs58.encode(publicKey)}`,
  };
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Signs a canonical Orderly REST request string with the account's ed25519
 * Orderly Key, per Orderly's API-authentication spec:
 *   message = `${timestamp}${method}${path}${body ?? ""}`
 * Returns a base64url-encoded signature suitable for the `orderly-signature`
 * header.
 */
export function signOrderlyRequest(
  secretKey: Uint8Array,
  params: { timestamp: number; method: string; path: string; body?: string }
): string {
  const message = `${params.timestamp}${params.method.toUpperCase()}${params.path}${params.body ?? ""}`;
  const bytes = new TextEncoder().encode(message);
  const signature = ed25519.sign(bytes, secretKey);
  return base64UrlEncode(signature);
}

/** Serializes a key pair for local persistence (base64, never leaves the browser). */
export function serializeKeyPair(kp: OrderlyKeyPair): { publicKeyB64: string; secretKeyB64: string } {
  return {
    publicKeyB64: bytesToBase64(kp.publicKey),
    secretKeyB64: bytesToBase64(kp.secretKey),
  };
}

export function deserializeKeyPair(publicKeyB64: string, secretKeyB64: string): OrderlyKeyPair {
  const publicKey = base64ToBytes(publicKeyB64);
  const secretKey = base64ToBytes(secretKeyB64);
  return { publicKey, secretKey, orderlyKey: `ed25519:${bs58.encode(publicKey)}` };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
