import { useEffect, useState } from "react";
import { useConnect, useConnectors, useAccount } from "wagmi";
import type { Connector } from "wagmi";
import { ArrowLeft, Wallet, ScanLine, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "./QrCode";
import { useWalletConnectUri } from "@/hooks/useWalletConnectUri";
import { useInjectedProviders } from "@/hooks/useInjectedProviders";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setConnectDialogOpen } from "@/store/slices/uiSlice";
import { cn } from "@/lib/utils";

const NO_ICON_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a92a6' stroke-width='1.5'%3E%3Crect x='2' y='6' width='20' height='13' rx='2'/%3E%3Cpath d='M17 12h.01'/%3E%3C/svg%3E";

function ConnectorRow({ connector, onSelect }: { connector: Connector; onSelect: (c: Connector) => void }) {
  const [icon, setIcon] = useState<string | undefined>(
    typeof connector.icon === "string" ? connector.icon : undefined
  );

  return (
    <button
      onClick={() => onSelect(connector)}
      className="flex w-full items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-4 py-3 text-left transition-all hover:border-violet-500/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <img
        src={icon ?? NO_ICON_FALLBACK}
        onError={() => setIcon(NO_ICON_FALLBACK)}
        alt=""
        className="h-8 w-8 rounded-md bg-white/5 object-contain p-1"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{connector.name}</p>
      </div>
    </button>
  );
}

export function ConnectWalletDialog() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.connectDialogOpen);
  const connectors = useConnectors();
  const { connect, status, error, reset } = useConnect();
  const { isConnected } = useAccount();
  const { uri, resetUri } = useWalletConnectUri();
  const detectedInjected = useInjectedProviders();
  const [showingQr, setShowingQr] = useState(false);

  const injectedConnectors = connectors.filter((c) => c.type !== "walletConnect" && c.type !== "coinbaseWalletSDK");
  const coinbaseConnector = connectors.find((c) => c.type === "coinbaseWalletSDK");
  const walletConnectConnector = connectors.find((c) => c.type === "walletConnect");

  useEffect(() => {
    if (isConnected) {
      dispatch(setConnectDialogOpen(false));
      setShowingQr(false);
      resetUri();
      reset();
    }
  }, [isConnected, dispatch, resetUri, reset]);

  function handleSelect(connector: Connector) {
    if (connector.type === "walletConnect") {
      setShowingQr(true);
    }
    connect({ connector });
  }

  function handleOpenChange(next: boolean) {
    dispatch(setConnectDialogOpen(next));
    if (!next) {
      setShowingQr(false);
      resetUri();
      reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          {showingQr ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowingQr(false);
                  resetUri();
                  reset();
                }}
                className="rounded p-1 text-mist hover:text-white"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <DialogTitle>Scan with a mobile wallet</DialogTitle>
            </div>
          ) : (
            <>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-violet-400" /> Connect a wallet
              </DialogTitle>
              <DialogDescription>
                EVM wallets only — this connects to Orderly Network on testnet.
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {showingQr ? (
          <div className="flex flex-col items-center gap-4 py-2">
            {uri ? (
              <QrCode value={uri} />
            ) : (
              <div className="flex h-[240px] w-[240px] items-center justify-center rounded-xl border border-line bg-white/[0.02]">
                <ScanLine className="h-8 w-8 animate-pulse text-violet-400" />
              </div>
            )}
            <p className="text-center text-xs text-mist">
              Open Trust Wallet, MetaMask Mobile, or any WalletConnect v2 wallet, then scan this code to
              pair. Signing requests will appear on your phone.
            </p>
            {uri && (
              <a
                href={uri}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
              >
                Open in installed wallet <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {injectedConnectors.length > 0 ? (
                injectedConnectors.map((connector) => (
                  <ConnectorRow key={connector.uid} connector={connector} onSelect={handleSelect} />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-line px-4 py-4 text-center text-xs text-mist">
                  No browser extension wallet detected.{" "}
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    Install MetaMask
                  </a>{" "}
                  or use WalletConnect below.
                </div>
              )}

              {coinbaseConnector && <ConnectorRow connector={coinbaseConnector} onSelect={handleSelect} />}
              {walletConnectConnector && (
                <ConnectorRow connector={walletConnectConnector} onSelect={handleSelect} />
              )}
            </div>

            {status === "pending" && !showingQr && (
              <p className="text-center text-xs text-violet-400 animate-pulse">
                Confirm the connection in your wallet…
              </p>
            )}
            {error && (
              <p className="rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
                {error.message}
              </p>
            )}
            <p
              className={cn(
                "text-center text-[11px] text-mist",
                detectedInjected.length === 0 && "opacity-60"
              )}
            >
              {detectedInjected.length} injected wallet{detectedInjected.length === 1 ? "" : "s"} detected in
              this browser · No wallet-connection library used
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
