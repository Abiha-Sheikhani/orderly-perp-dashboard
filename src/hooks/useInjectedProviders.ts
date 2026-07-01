import { useEffect, useState } from "react";

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963AnnounceEvent extends CustomEvent {
  detail: { info: EIP6963ProviderInfo; provider: unknown };
}

/**
 * Listens for EIP-6963 `eip6963:announceProvider` events so the connect
 * dialog can show each installed wallet's *real* name/icon (MetaMask, Trust
 * Wallet, Rabby, ...) instead of a generic "Injected Wallet" entry. wagmi's
 * `multiInjectedProviderDiscovery` uses the exact same browser event under
 * the hood to build its connector list — this hook just mirrors it for the
 * UI layer so we can render matching icons without reaching into wagmi
 * internals.
 */
export function useInjectedProviders() {
  const [providers, setProviders] = useState<EIP6963ProviderInfo[]>([]);

  useEffect(() => {
    function onAnnounce(event: Event) {
      const { detail } = event as EIP6963AnnounceEvent;
      setProviders((prev) => {
        if (prev.some((p) => p.uuid === detail.info.uuid)) return prev;
        return [...prev, detail.info];
      });
    }

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, []);

  return providers;
}
