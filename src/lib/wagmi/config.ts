import { createConfig, http } from "wagmi";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";
import { arbitrumSepolia, baseSepolia } from "viem/chains";

/**
 * Multi-wallet strategy (built by hand, no RainbowKit / ConnectKit / Web3Modal):
 *
 * 1. `multiInjectedProviderDiscovery: true` (wagmi core default) makes every
 *    EIP-6963-announcing extension — MetaMask, Trust Wallet, Rabby, Brave —
 *    show up as its own connector automatically, each with its real name and
 *    icon, with zero guessing about `window.ethereum` races.
 * 2. `coinbaseWallet()` covers the Coinbase Smart Wallet / extension path,
 *    which does not always announce via EIP-6963 on all platforms.
 * 3. `walletConnect()` is configured with `showQrModal: false` — we render
 *    our own QR/deep-link UI (see `useWalletConnectUri`) instead of pulling
 *    in `@walletconnect/modal`, so the *only* code driving the pairing flow
 *    is ours.
 *
 * This combination covers MetaMask, Trust Wallet, Coinbase Wallet, and any
 * WalletConnect v2–compatible mobile wallet, satisfying the EVM multi-wallet
 * + WalletConnect v2 (mobile) requirement without a wallet-connection library.
 */

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  // eslint-disable-next-line no-console
  console.warn(
    "[wagmi] VITE_WALLETCONNECT_PROJECT_ID is not set — WalletConnect (mobile wallets) will be disabled. " +
      "Get a free project id at https://cloud.reown.com and add it to .env.local."
  );
}

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, baseSepolia],
  multiInjectedProviderDiscovery: true,
  connectors: [
    coinbaseWallet({
      appName: "Orderbook — Perpetuals on Orderly",
      preference: "all",
    }),
    ...(projectId
      ? [
          walletConnect({
            projectId,
            showQrModal: false,
            metadata: {
              name: "Orderbook",
              description: "Perpetuals trading dashboard on Orderly Network testnet",
              url: typeof window !== "undefined" ? window.location.origin : "https://orderly.network",
              icons: ["https://orderly.network/favicon.ico"],
            },
          }),
        ]
      : []),
  ],
  transports: {
    [arbitrumSepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
