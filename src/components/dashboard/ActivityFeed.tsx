import { ArrowDownToLine, ArrowUpFromLine, KeyRound, CheckCircle2, XCircle, Loader2, ExternalLink, History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import type { ActivityItem } from "@/store/slices/activitySlice";
import { formatRelativeTime, truncateHash } from "@/lib/format";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<ActivityItem["kind"], typeof ArrowDownToLine> = {
  deposit: ArrowDownToLine,
  withdraw: ArrowUpFromLine,
  onboarding: KeyRound,
};

function StatusIcon({ status }: { status: ActivityItem["status"] }) {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-cyan-400" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-rose-500" />;
  return <Loader2 className="h-4 w-4 animate-spin text-violet-400" />;
}

export function ActivityFeed() {
  const items = useAppSelector((s) => s.activity.items);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-mist" /> Activity
          </CardTitle>
          <CardDescription>Every signature and transaction from this session.</CardDescription>
        </div>
      </CardHeader>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-xs text-mist">
          Nothing yet — connect a wallet to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                  item.status === "error"
                    ? "border-rose-500/20 bg-rose-500/[0.03]"
                    : "border-line bg-white/[0.02]"
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.05]">
                  <Icon className="h-4 w-4 text-mist" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-white">{item.title}</p>
                  <p className="truncate text-xs text-mist">
                    {formatRelativeTime(item.timestamp)}
                    {item.detail && !item.detail.startsWith("0x") ? ` · ${item.detail}` : ""}
                  </p>
                </div>
                <StatusIcon status={item.status} />
                {item.explorerUrl && (
                  <a
                    href={item.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 text-xs text-cyan-400 hover:underline"
                  >
                    {item.txHash && truncateHash(item.txHash, 4)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
