/**
 * Orderly Network — testnet configuration.
 *
 * brokerId: every builder needs a registered broker id to earn fee rebates and
 * to be a valid counterparty in the `Registration`/`AddOrderlyKey`/`Withdraw`
 * EIP-712 payloads. Orderly hands these out on request (Discord / builder
 * onboarding form). For this assessment we default to the well-known public
 * broker id `woofi_pro` (Orderly's own reference broker, safe to use for
 * read/testnet flows) so the app works out of the box — override it with
 * VITE_ORDERLY_BROKER_ID once you have your own.
 *
 * All values below were pulled live from Orderly's docs on 2026-07-01:
 * https://orderly.network/docs/build-on-omnichain/addresses
 * https://orderly.network/docs/build-on-evm/user-flows/wallet-authentication
 */
export const ORDERLY_BROKER_ID: string = import.meta.env.VITE_ORDERLY_BROKER_ID || "woofi_pro";

export const ORDERLY_API_BASE = "https://testnet-api.orderly.org";
export const ORDERLY_WS_PUBLIC = "wss://testnet-ws.orderly.org/ws/stream";
export const ORDERLY_WS_PRIVATE = "wss://testnet-ws-private.orderly.org/v2/ws/private/stream";

/** Orderly's dedicated L2 settlement chain id (used only as metadata / explorer links). */
export const ORDERLY_L2_CHAIN_ID = 291;

/**
 * `Registration` and `AddOrderlyKey` EIP-712 messages are verified entirely
 * off-chain by Orderly's API, so the spec uses this well-known sentinel
 * address as `verifyingContract` rather than a real deployed contract.
 */
export const OFF_CHAIN_VERIFYING_CONTRACT = "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as const;

/**
 * `Withdraw` and `SettlePnl` messages are verified by the Ledger contract on
 * Orderly's L2 settlement chain, so `verifyingContract` must be its address.
 */
export const LEDGER_CONTRACT_TESTNET = "0x1826B75e2ef249173FC735149AE4B8e9ea10abff" as const;

export const ORDERLY_TOKEN_SYMBOL = "USDC";

export const FAUCET_LINKS = {
  usdc: "https://faucet.circle.com/",
  testUsdcOrderly: "https://testnet-operator.orderly.org/faucet/usdc",
};
