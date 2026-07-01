import { Wallet2, LineChart, RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { useOrderlyBalance } from "@/hooks/useOrderlyBalance";
import { useOrderlySession } from "@/providers/OrderlySessionContext";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

function BalanceTile({
  icon: Icon,
  label,
  value,
  sublabel,
  loading,
  accent,
}: {
  icon: typeof Wallet2;
  label: string;
  value: string;
  sublabel: string;
  loading?: boolean;
  accent: "violet" | "cyan";
}) {
  return (
    <div className="glass-tight relative flex-1 overflow-hidden p-5">
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-40",
          accent === "violet" ? "bg-violet-500" : "bg-cyan-500"
        )}
      />
      <div className="relative flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-mist">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="relative mt-2 flex items-baseline gap-2">
        {loading ? (
          <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
        ) : (
          <span className="font-display text-3xl font-semibold tabular text-white">{value}</span>
        )}
      </div>
      <p className="relative mt-1 text-xs text-mist">{sublabel}</p>
    </div>
  );
}

export function BalanceOverview() {
  const { isConnected } = useAccount();
  const { session } = useOrderlySession();
  const { data: usdcBalance, isLoading: walletLoading, refetch: refetchWallet } = useUsdcBalance();
  const { data: orderlyBalance, isLoading: orderlyLoading, refetch: refetchOrderly } = useOrderlyBalance();

  if (!isConnected) return null;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">Balances</h3>
        <button
          onClick={() => {
            refetchWallet();
            refetchOrderly();
          }}
          className="rounded-md p-1.5 text-mist transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Refresh balances"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <BalanceTile
          icon={Wallet2}
          label="Wallet"
          value={usdcBalance ? formatUsd(Number(usdcBalance.formatted)) : formatUsd(0)}
          sublabel="USDC on-chain, available to deposit"
          loading={walletLoading}
          accent="violet"
        />
        <BalanceTile
          icon={LineChart}
          label="Orderly account"
          value={session ? formatUsd(orderlyBalance ?? 0) : "—"}
          sublabel={session ? "Available margin, ready to trade" : "Finish onboarding to view"}
          loading={session ? orderlyLoading : false}
          accent="cyan"
        />
      </div>
    </Card>
  );
}
