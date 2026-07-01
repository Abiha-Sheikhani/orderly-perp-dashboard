# Orderbook — Perpetuals Trading Dashboard on Orderly Network (Testnet)

A minimal, hand-built onboarding + collateral dashboard for [Orderly Network](https://orderly.network),
built directly against Orderly's public REST API and smart contracts — **no Orderly SDK, no wallet-connection
library (RainbowKit/ConnectKit/Web3Modal), no UI kit.** Every signature, every contract call, and every
wallet connector is wired by hand so the flow is fully auditable.

<br/>

## What it does

| Feature | Status |
|---|---|
| Connect an EVM wallet (MetaMask, Trust, Coinbase, any WalletConnect v2 wallet incl. mobile) | done |
| Register an Orderly account (`Registration` EIP-712 signature) | done |
| Delegate a trading key (`AddOrderlyKey` EIP-712 signature, ed25519 key generated client-side) | done |
| View wallet USDC balance and Orderly custody balance, live | done |
| Deposit USDC into Orderly's Vault contract (ERC-20 approve then `Vault.deposit`) | done |
| Withdraw USDC (`Withdraw` EIP-712 signature, Orderly operator settles on-chain) | done |
| Activity log of every signature/tx this session | done |
| Glassmorphism UI, fully responsive | done |

Testnet only. Supports **Arbitrum Sepolia** (default) and **Base Sepolia** — switch networks from the
account menu once connected.

<br/>

## Stack

- **React 18 + TypeScript + Vite**
- **Redux Toolkit** — onboarding status, activity log, and UI (toasts/dialogs) state
- **wagmi v2 + viem** — chain state, contract reads/writes, tx receipts
- **Tailwind CSS + Radix UI primitives** (hand-assembled shadcn-style components: `Button`, `Card`,
  `Dialog`, `Tabs`, `Badge`, `Progress`, `Label`)
- **usehooks-ts** — `useCopyToClipboard`, `useDebounceValue`
- **@noble/curves** (ed25519) + **bs58** — Orderly Key generation/signing, done by hand
- **qrcode** — renders the WalletConnect pairing QR ourselves (no `@walletconnect/modal`)

<br/>

## Getting started

```bash
npm install
cp .env.example .env.local   # add a WalletConnect project id (optional but recommended)
npm run dev
```

Open the printed local URL, connect a wallet on **Arbitrum Sepolia**, and get testnet USDC from the
[Circle faucet](https://faucet.circle.com/) linked in the Deposit tab. You'll also need a small amount of
Sepolia ETH for gas — any public faucet works (e.g. the Arbitrum bridge or Alchemy's faucet).

```bash
npm run build      # production build (tsc -b && vite build) — verified clean
npm run typecheck  # tsc only
npm run preview    # preview the production build locally
```

<br/>

## Architecture

```
src/
  config/            chain list, contract addresses, Orderly API/EIP-712 constants
  abi/                minimal ERC-20 + Vault ABIs
  lib/
    orderly/          crypto.ts (ed25519), eip712.ts (typed-data builders),
                       identifiers.ts (account_id/brokerHash/tokenHash), api.ts (REST client),
                       keystore.ts (local key persistence)
    wagmi/config.ts    custom multi-wallet wagmi config (see below)
  providers/          OrderlySessionContext — holds the live ed25519 key pair in memory
  store/              Redux slices: orderly (onboarding status), activity (tx/signature log), ui
  hooks/              useOrderlyOnboarding, useDeposit, useWithdraw, useUsdcBalance, useOrderlyBalance,
                       useWalletConnectUri, useInjectedProviders
  components/
    wallet/            ConnectWalletDialog, AccountMenu, QrCode
    dashboard/         Hero, OnboardingCard, BalanceOverview, TransferPanel, AccountStatusCard, ActivityFeed
    layout/            Header, BackgroundFX
    ui/                hand-built primitives (button, card, dialog, tabs, toaster, ...)
```

### Wallet connection — no wallet library

`wagmi`'s `multiInjectedProviderDiscovery` (core, on by default) listens for `eip6963:announceProvider`
events and turns every installed extension — MetaMask, Trust Wallet, Rabby, Coinbase extension, etc. —
into its own connector automatically, each with its real name/icon. On top of that we explicitly configure:

- `coinbaseWallet()` — covers Coinbase Smart Wallet / mobile deep-link, which doesn't always announce via
  EIP-6963.
- `walletConnect({ showQrModal: false })` — WalletConnect v2 for any mobile wallet. We deliberately disable
  the built-in QR modal and instead subscribe to the connector's `display_uri` event
  (`useWalletConnectUri`) and render our own QR code with the `qrcode` package — the only WalletConnect UI
  code in this app is ours.

`ConnectWalletDialog` renders whatever `useConnectors()` returns, so the wallet list is never hardcoded.

### Orderly onboarding — no Orderly SDK

Two EIP-712 signatures, both defined from scratch in `lib/orderly/eip712.ts` against Orderly's published
domain/types:

1. **`Registration`** — signed once per (wallet, broker). Sent to `POST /v1/register_account`.
2. **`AddOrderlyKey`** — delegates a fresh ed25519 key pair (generated locally with `@noble/curves`,
   never leaves the browser) that then authenticates all private REST calls via Orderly's
   `orderly-timestamp` / `orderly-account-id` / `orderly-key` / `orderly-signature` header scheme
   (`lib/orderly/crypto.ts#signOrderlyRequest`). Sent to `POST /v1/orderly_key`.

The resulting key pair is kept in a React context (`OrderlySessionContext`) rather than Redux, since it
holds a raw `Uint8Array` private key and shouldn't be serialized through Redux DevTools. It's also cached
in `localStorage`, scoped per `(chainId, brokerId, address)`, so returning users skip straight to "ready."

`account_id` is computed **client-side** (`keccak256(abi.encodePacked(address, brokerHash))`) so the UI
never blocks on an API round-trip to know its own account id — the value returned by
`register_account`/`get_account` is still treated as the source of truth when available.

### Deposit

Standard two-step ERC-20 flow via `wagmi/actions` (`readContract`/`writeContract`/`waitForTransactionReceipt`,
used directly instead of the declarative hooks so the multi-step sequence — check allowance, approve,
quote fee, deposit, wait for receipt — reads as one linear function):

1. `allowance(owner, vault)` — skip approval if already sufficient.
2. `approve(vault, amount)`, wait for confirmation.
3. `Vault.getDepositFee(...)` — some deployments charge a small cross-chain messaging fee.
4. `Vault.deposit({ accountId, brokerHash, tokenHash, tokenAmount })`, paying the fee as `msg.value`.

### Withdraw

Withdrawals on Orderly are **authorized off-chain, settled on-chain by Orderly's operator** — the user
never pays gas to withdraw:

1. `GET /v1/withdraw_nonce` (ed25519-authenticated).
2. Sign a `Withdraw` EIP-712 message (verified on-chain by the Ledger contract, hence the different
   `verifyingContract` from Registration/AddOrderlyKey).
3. `POST /v1/withdraw_request` with the signature.
4. Poll `GET /v1/asset/history` until the matching row reports `COMPLETED` with a `tx_id`, then link straight
   to the block explorer.

<br/>

## Design notes (glassmorphism)

Palette: near-black void background, frosted glass panels (`backdrop-blur` + hairline gradient border +
inner sheen), violet-to-cyan gradient for primary actions, rose-to-amber for destructive ones. Two type
families: **Space Grotesk** for headings/numbers, **Inter** for UI copy, **JetBrains Mono** for
addresses/hashes. The signature background element is a slow-drifting mesh of blurred gradient orbs behind
a faint orderbook-style grid — meant to feel like a trading terminal, not a generic dashboard template.

<br/>

## Honest trade-offs & assumptions

This was built by reading Orderly's public documentation and reconstructing what wasn't fully spelled out
— worth being upfront about the gaps rather than papering over them:

- **Broker ID** — defaults to Orderly's own public reference broker `woofi_pro` so the app works out of the
  box. Override with `VITE_ORDERLY_BROKER_ID`; a production deployment needs its own id from Orderly.
- **Vault ABI** — the `deposit`/`getDepositFee` function signatures are reconstructed from Orderly's
  `AccountDepositTo`/`AccountWithdraw` event definitions and public contract-evm-abi repo, not pulled from
  a live ABI file. They match the documented event fields but should be diffed against
  `contract-evm-abi` (or the verified source on the block explorer) before trusting them beyond testnet.
- **REST endpoint paths** (`/v1/register_account`, `/v1/orderly_key`, `/v1/get_account`,
  `/v1/withdraw_request`, `/v1/asset/history`, etc.) follow Orderly's documented and widely-referenced v1
  API shape. If Orderly has since renamed/versioned any of them, `lib/orderly/api.ts` is the single place
  to update — every call is centralized there.
- **Key storage** — the delegated ed25519 secret lives in `localStorage`, base64-encoded, scoped per
  wallet+broker+chain. It only ever grants `read,trading` scope (never withdrawal — that always requires a
  fresh wallet signature), but `localStorage` is still readable by any script on the origin. A production
  build should move this to IndexedDB with a non-extractable `CryptoKey`, or avoid persisting it at all.
- **No order placement / positions UI** — the brief scoped this to onboarding + collateral movement, so
  order entry, the order book, and position management aren't implemented.

<br/>

## A note on testing

This was built and verified with `tsc -b` (clean) and `vite build` (clean production bundle) without
wallet extensions or live testnet funds available in the build environment, so the signing flows are
correct **by construction** against Orderly's documented EIP-712 schemas but haven't been exercised against
a live MetaMask popup end-to-end. If something doesn't match Orderly's current API exactly,
`lib/orderly/api.ts` and `lib/orderly/eip712.ts` are intentionally the only two files you'd need to patch.
