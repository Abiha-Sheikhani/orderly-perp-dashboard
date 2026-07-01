import { useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { ArrowDownToLine, ArrowUpFromLine, Droplets, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/primitives";
import { useAccount } from "wagmi";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { useOrderlyBalance } from "@/hooks/useOrderlyBalance";
import { useOrderlySession } from "@/providers/OrderlySessionContext";
import { useDeposit } from "@/hooks/useDeposit";
import { useWithdraw } from "@/hooks/useWithdraw";
import { getContracts } from "@/config/contracts";
import { CHAIN_METADATA, isSupportedChainId } from "@/config/chains";
import { FAUCET_LINKS } from "@/config/orderly";
import { safeParseUnits, truncateHash } from "@/lib/format";
import { cn } from "@/lib/utils";

const DEPOSIT_STEP_LABEL: Record<string, string> = {
  approving: "Confirm USDC approval in your wallet…",
  confirming_approval: "Waiting for approval to confirm on-chain…",
  depositing: "Confirm deposit in your wallet…",
  confirming_deposit: "Waiting for deposit to confirm on-chain…",
  done: "Deposit confirmed",
};

const WITHDRAW_STEP_LABEL: Record<string, string> = {
  signing: "Sign the withdrawal request in your wallet…",
  submitting: "Submitting signed request to Orderly…",
  settling: "Waiting for the operator to settle on-chain…",
  done: "Withdrawal settled",
};

function AmountField({
  value,
  onChange,
  max,
  maxLabel,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: string;
  maxLabel: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label>Amount</Label>
        {max && (
          <button
            type="button"
            onClick={() => onChange(max)}
            className="text-[11px] font-medium text-cyan-400 hover:underline"
          >
            {maxLabel}: {max}
          </button>
        )}
      </div>
      <div className="glass-tight flex items-center gap-2 px-3 py-2.5">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="0.00"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-lg text-white outline-none placeholder:text-mist/50 disabled:opacity-50"
        />
        <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-mist">USDC</span>
      </div>
    </div>
  );
}

function DepositTab() {
  const { chainId } = useAccount();
  const { data: usdcBalance, refetch } = useUsdcBalance();
  const { step, error, txHash, deposit, reset } = useDeposit();
  const [amount, setAmount] = useState("");
  const [debouncedAmount] = useDebounceValue(amount, 300);

  const decimals = isSupportedChainId(chainId) ? getContracts(chainId).usdcDecimals : 6;
  const parsedAmount = useMemo(() => safeParseUnits(debouncedAmount, decimals), [debouncedAmount, decimals]);
  const isBusy = !["idle", "done", "error"].includes(step);
  const explorer = isSupportedChainId(chainId) ? CHAIN_METADATA[chainId].explorer : undefined;

  async function handleSubmit() {
    if (!parsedAmount || parsedAmount === 0n) return;
    await deposit(parsedAmount);
    refetch();
  }

  return (
    <div className="flex flex-col gap-4">
      <AmountField
        value={amount}
        onChange={(v) => {
          setAmount(v);
          if (step !== "idle") reset();
        }}
        max={usdcBalance ? Number(usdcBalance.formatted).toFixed(2) : undefined}
        maxLabel="Wallet balance"
        disabled={isBusy}
      />

      <a
        href={FAUCET_LINKS.usdc}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 self-start text-xs text-mist hover:text-cyan-400 transition-colors"
      >
        <Droplets className="h-3.5 w-3.5" /> Need testnet USDC? Use the Circle faucet
        <ExternalLink className="h-3 w-3" />
      </a>

      {isBusy && (
        <div className="flex items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-500/5 px-3 py-2 text-xs text-violet-300">
          <span className="h-1.5 w-1.5 shrink-0 animate-ping rounded-full bg-violet-400" />
          {DEPOSIT_STEP_LABEL[step] ?? "Processing…"}
        </div>
      )}

      {step === "done" && (
        <div className="flex items-center justify-between rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Deposit confirmed
          </span>
          {txHash && explorer && (
            <a
              href={`${explorer}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 underline decoration-dotted"
            >
              {truncateHash(txHash)} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
          {error}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        loading={isBusy}
        disabled={!parsedAmount || parsedAmount === 0n}
        className="w-full"
      >
        <ArrowDownToLine className="h-4 w-4" /> Deposit to Orderly
      </Button>
    </div>
  );
}

function WithdrawTab() {
  const { session } = useOrderlySession();
  const { data: orderlyBalance, refetch } = useOrderlyBalance();
  const { step, error, txHash, withdraw, reset } = useWithdraw();
  const [amount, setAmount] = useState("");
  const { chainId } = useAccount();
  const isBusy = !["idle", "done", "error"].includes(step);
  const explorer = isSupportedChainId(chainId) ? CHAIN_METADATA[chainId].explorer : undefined;

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) return;
    await withdraw(amount);
    refetch();
  }

  if (!session) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-xs text-mist">
        Finish onboarding above to unlock withdrawals.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AmountField
        value={amount}
        onChange={(v) => {
          setAmount(v);
          if (step !== "idle") reset();
        }}
        max={orderlyBalance !== undefined ? orderlyBalance.toFixed(2) : undefined}
        maxLabel="Available"
        disabled={isBusy}
      />

      <p className="text-xs text-mist">
        Withdrawals are authorized with a single EIP-712 signature — no gas from you. Orderly's operator
        settles the transfer on-chain; this can take a minute or two on testnet.
      </p>

      {isBusy && (
        <div className="flex items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-500/5 px-3 py-2 text-xs text-violet-300">
          <span className="h-1.5 w-1.5 shrink-0 animate-ping rounded-full bg-violet-400" />
          {WITHDRAW_STEP_LABEL[step] ?? "Processing…"}
        </div>
      )}

      {step === "done" && (
        <div className="flex items-center justify-between rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> {txHash ? "Withdrawal settled" : "Withdrawal accepted"}
          </span>
          {txHash && explorer && (
            <a
              href={`${explorer}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 underline decoration-dotted"
            >
              {truncateHash(txHash)} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
          {error}
        </p>
      )}

      <Button
        variant="danger"
        onClick={handleSubmit}
        loading={isBusy}
        disabled={!amount || Number(amount) <= 0}
        className="w-full"
      >
        <ArrowUpFromLine className="h-4 w-4" /> Withdraw to wallet
      </Button>
    </div>
  );
}

export function TransferPanel() {
  return (
    <Card className={cn("h-fit")}>
      <CardHeader>
        <div>
          <CardTitle>Move funds</CardTitle>
          <CardDescription>Collateral moves between your wallet and Orderly's Vault contract.</CardDescription>
        </div>
      </CardHeader>
      <Tabs defaultValue="deposit">
        <TabsList className="w-full">
          <TabsTrigger value="deposit" className="flex-1">
            Deposit
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="flex-1">
            Withdraw
          </TabsTrigger>
        </TabsList>
        <TabsContent value="deposit">
          <DepositTab />
        </TabsContent>
        <TabsContent value="withdraw">
          <WithdrawTab />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
