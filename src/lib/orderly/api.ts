import { ORDERLY_API_BASE } from "@/config/orderly";
import { signOrderlyRequest, type OrderlyKeyPair } from "./crypto";
import type { Address } from "viem";

export class OrderlyApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: number
  ) {
    super(message);
    this.name = "OrderlyApiError";
  }
}

/** EIP-712 message objects carry bigint fields (uint256/uint64) for signing; convert them to strings for JSON transport. */
function stringifyWithBigInt(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v));
}

interface OrderlyEnvelope<T> {
  success: boolean;
  data: T;
  code?: number;
  message?: string;
}

async function request<T>(
  path: string,
  init?: RequestInit & { authHeaders?: Record<string, string> }
): Promise<T> {
  const res = await fetch(`${ORDERLY_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.authHeaders ?? {}),
      ...(init?.headers ?? {}),
    },
  });

  const json = (await res.json().catch(() => null)) as OrderlyEnvelope<T> | null;

  if (!res.ok || !json || json.success === false) {
    throw new OrderlyApiError(json?.message ?? `Request to ${path} failed (${res.status})`, res.status, json?.code);
  }
  return json.data;
}

/** Builds the standard ed25519-signed auth headers for private endpoints. */
function buildAuthHeaders(params: {
  keyPair: OrderlyKeyPair;
  accountId: string;
  method: "GET" | "POST" | "DELETE" | "PUT";
  path: string;
  body?: string;
}): Record<string, string> {
  const timestamp = Date.now();
  const signature = signOrderlyRequest(params.keyPair.secretKey, {
    timestamp,
    method: params.method,
    path: params.path,
    body: params.body,
  });
  return {
    "orderly-timestamp": String(timestamp),
    "orderly-account-id": params.accountId,
    "orderly-key": params.keyPair.orderlyKey,
    "orderly-signature": signature,
  };
}

// ---------------------------------------------------------------------------
// Public / registration endpoints
// ---------------------------------------------------------------------------

export interface RegistrationNonceResponse {
  registration_nonce: string;
}

export function getRegistrationNonce() {
  return request<RegistrationNonceResponse>("/v1/registration_nonce");
}

export interface RegisterAccountPayload {
  message: unknown;
  signature: `0x${string}`;
  userAddress: Address;
}

export interface RegisterAccountResponse {
  account_id: string;
}

export function registerAccount(payload: RegisterAccountPayload) {
  return request<RegisterAccountResponse>("/v1/register_account", {
    method: "POST",
    body: stringifyWithBigInt(payload),
  });
}

export interface GetAccountResponse {
  account_id: string;
  address: string;
}

/** Returns null if the wallet has no Orderly account under this broker yet. */
export async function getAccount(address: Address, brokerId: string): Promise<GetAccountResponse | null> {
  try {
    return await request<GetAccountResponse>(
      `/v1/get_account?address=${address}&broker_id=${encodeURIComponent(brokerId)}`
    );
  } catch (err) {
    if (err instanceof OrderlyApiError && (err.status === 404 || err.code === -1000)) return null;
    throw err;
  }
}

export interface AddOrderlyKeyPayload {
  message: unknown;
  signature: `0x${string}`;
  userAddress: Address;
}

export function addOrderlyKey(payload: AddOrderlyKeyPayload) {
  return request<{ orderly_key: string }>("/v1/orderly_key", {
    method: "POST",
    body: stringifyWithBigInt(payload),
  });
}

// ---------------------------------------------------------------------------
// Private (ed25519-signed) endpoints
// ---------------------------------------------------------------------------

export interface ClientHolding {
  token: string;
  holding: number;
  frozen: number;
  pending_short: number;
  updated_time: number;
}

export async function getClientHoldings(keyPair: OrderlyKeyPair, accountId: string) {
  const path = "/v1/client/holding";
  const authHeaders = buildAuthHeaders({ keyPair, accountId, method: "GET", path });
  return request<{ holding: ClientHolding[] }>(path, { method: "GET", authHeaders });
}

export interface ClientInfo {
  account_id: string;
  email?: string;
  max_leverage: number;
  taker_fee_rate: number;
  maker_fee_rate: number;
}

export async function getClientInfo(keyPair: OrderlyKeyPair, accountId: string) {
  const path = "/v1/client/info";
  const authHeaders = buildAuthHeaders({ keyPair, accountId, method: "GET", path });
  return request<ClientInfo>(path, { method: "GET", authHeaders });
}

export interface WithdrawNonceResponse {
  withdraw_nonce: number;
}

export async function getWithdrawNonce(keyPair: OrderlyKeyPair, accountId: string) {
  const path = "/v1/withdraw_nonce";
  const authHeaders = buildAuthHeaders({ keyPair, accountId, method: "GET", path });
  return request<WithdrawNonceResponse>(path, { method: "GET", authHeaders });
}

export interface WithdrawRequestPayload {
  message: unknown;
  signature: `0x${string}`;
  userAddress: Address;
  verifyingContract: Address;
}

export interface WithdrawRequestResponse {
  withdraw_id: string;
  status: "NEW" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export async function submitWithdrawRequest(
  keyPair: OrderlyKeyPair,
  accountId: string,
  payload: WithdrawRequestPayload
) {
  const path = "/v1/withdraw_request";
  const body = stringifyWithBigInt(payload);
  const authHeaders = buildAuthHeaders({ keyPair, accountId, method: "POST", path, body });
  return request<WithdrawRequestResponse>(path, { method: "POST", authHeaders, body });
}

export interface AssetHistoryItem {
  id: string;
  side: "DEPOSIT" | "WITHDRAW";
  token: string;
  amount: number;
  status: string;
  tx_id?: string;
  created_time: number;
}

export async function getAssetHistory(keyPair: OrderlyKeyPair, accountId: string) {
  const path = "/v1/asset/history";
  const authHeaders = buildAuthHeaders({ keyPair, accountId, method: "GET", path });
  return request<{ rows: AssetHistoryItem[] }>(path, { method: "GET", authHeaders });
}
