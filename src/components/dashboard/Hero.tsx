import { Zap, ShieldCheck, ArrowDownToLine, Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { setConnectDialogOpen } from "@/store/slices/uiSlice";

const FEATURES = [
  { icon: Wallet2, title: "Any EVM wallet", desc: "MetaMask, Trust, Coinbase, or scan with WalletConnect." },
  { icon: ShieldCheck, title: "Sign, don't trust", desc: "Every action is an EIP-712 message you can read before signing." },
  { icon: ArrowDownToLine, title: "Real testnet funds", desc: "Deposits and withdrawals settle on Arbitrum/Base Sepolia." },
];

export function Hero() {
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col items-center gap-8 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-grad-primary shadow-glow-violet animate-float">
        <Zap className="h-8 w-8 text-white" fill="white" />
      </div>
      <div className="max-w-xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Trade perps on <span className="text-gradient">Orderly</span>
        </h1>
        <p className="mt-4 text-balance text-mist">
          A minimal, hand-built onboarding + collateral flow for Orderly Network's testnet — no wallet SDKs,
          no trading SDK shortcuts.
        </p>
      </div>
      <Button size="lg" onClick={() => dispatch(setConnectDialogOpen(true))}>
        Connect Wallet
      </Button>
      <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass-tight p-5 text-left">
            <f.icon className="mb-3 h-5 w-5 text-violet-400" />
            <p className="text-sm font-medium text-white">{f.title}</p>
            <p className="mt-1 text-xs text-mist">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
