import { useEffect, useState } from "react";
import { useConnectors } from "wagmi";

/**
 * WalletConnect's connector is configured with `showQrModal: false` (see
 * lib/wagmi/config.ts). Instead of pulling in `@walletconnect/modal`, we
 * subscribe directly to the connector's `message` emitter for the
 * `display_uri` event and render our own QR code + deep link — this is the
 * "custom" part of "WalletConnect v2 required, must work on mobile wallets".
 */
export function useWalletConnectUri() {
  const connectors = useConnectors();
  const wcConnector = connectors.find((c) => c.type === "walletConnect");
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!wcConnector) return;

    const handler = (payload: { type: string; data?: unknown }) => {
      if (payload.type === "display_uri" && typeof payload.data === "string") {
        setUri(payload.data);
      }
    };

    wcConnector.emitter.on("message", handler);
    return () => {
      wcConnector.emitter.off("message", handler);
    };
  }, [wcConnector]);

  return { uri, wcConnector, resetUri: () => setUri(null) };
}
