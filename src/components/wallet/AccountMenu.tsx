import { useState } from "react";
import { useAccount, useDisconnect, useSwitchChain, useBalance } from "wagmi";
import { useCopyToClipboard } from "usehooks-ts";
import { ChevronDown, Copy, Check, LogOut, ArrowLeftRight } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { truncateAddress } from "@/lib/format";
import { CHAIN_METADATA, SUPPORTED_CHAINS, isSupportedChainId } from "@/config/chains";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function AccountMenu() {
  const { address, chain, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: nativeBalance } = useBalance({ address });
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const supported = isSupportedChainId(chainId);

  function copyAddress() {
    copyToClipboard(address!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button className="glass-tight flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.07]">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              supported ? "bg-cyan-400 animate-pulseRing" : "bg-amber-500"
            )}
          />
          <span className="hidden sm:inline text-mist">{chain?.name ?? "Unknown network"}</span>
          <span className="font-mono">{truncateAddress(address)}</span>
          <ChevronDown className="h-3.5 w-3.5 text-mist" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50" />
        <DialogPrimitive.Content className="fixed right-4 top-16 z-50 w-72 glass p-4 shadow-glass focus:outline-none">
          <DialogPrimitive.Title className="sr-only">Account menu</DialogPrimitive.Title>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-white">{truncateAddress(address, 6)}</p>
              <p className="text-xs text-mist mt-0.5">
                {nativeBalance ? `${Number(nativeBalance.formatted).toFixed(4)} ${nativeBalance.symbol}` : "—"}
              </p>
            </div>
            <button
              onClick={copyAddress}
              className="rounded-md p-2 text-mist hover:bg-white/[0.06] hover:text-white transition-colors"
              aria-label="Copy address"
            >
              {copied ? <Check className="h-4 w-4 text-cyan-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {!supported && (
            <Badge variant="warning" className="mt-3">
              Unsupported network — switch below
            </Badge>
          )}

          <div className="mt-4 flex flex-col gap-1.5">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-mist">
              <ArrowLeftRight className="h-3 w-3" /> Switch network
            </p>
            {SUPPORTED_CHAINS.map((c) => (
              <button
                key={c.id}
                disabled={isSwitching}
                onClick={() => switchChain({ chainId: c.id })}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-50",
                  c.id === chainId
                    ? "border-violet-500/40 bg-violet-500/10 text-white"
                    : "border-line text-mist hover:bg-white/[0.05] hover:text-white"
                )}
              >
                {CHAIN_METADATA[c.id].label}
                {c.id === chainId && <Check className="h-3.5 w-3.5 text-violet-400" />}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => disconnect()}>
            <LogOut className="h-3.5 w-3.5" /> Disconnect
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
