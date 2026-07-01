import { useAccount } from "wagmi";
import { ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { useOrderlySession } from "@/providers/OrderlySessionContext";
import { ORDERLY_BROKER_ID } from "@/config/orderly";
import { CHAIN_METADATA, isSupportedChainId } from "@/config/chains";
import { truncateHash } from "@/lib/format";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-xs text-mist">{label}</span>
      <span className="truncate font-mono text-xs text-white">{value}</span>
    </div>
  );
}

export function AccountStatusCard() {
  const { chainId } = useAccount();
  const { session } = useOrderlySession();

  if (!session) return null;

  const expiresAt = new Date(session.expiration * 1000);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" /> Trading session
          </CardTitle>
          <CardDescription>Signed locally — your wallet is never re-prompted for reads/trades.</CardDescription>
        </div>
        <Badge variant="success">Active</Badge>
      </CardHeader>
      <div className="divide-y divide-line">
        <Row label="Broker ID" value={ORDERLY_BROKER_ID} />
        <Row label="Account ID" value={truncateHash(session.accountId, 8)} />
        <Row label="Orderly Key" value={truncateHash(session.keyPair.orderlyKey.replace("ed25519:", ""), 8)} />
        <Row label="Scope" value={session.scope} />
        <Row label="Network" value={isSupportedChainId(chainId) ? CHAIN_METADATA[chainId].label : "—"} />
        <Row label="Key expires" value={expiresAt.toLocaleDateString()} />
      </div>
    </Card>
  );
}
