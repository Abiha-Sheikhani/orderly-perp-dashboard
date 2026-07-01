import { useAccount } from "wagmi";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { AccountMenu } from "@/components/wallet/AccountMenu";
import { useAppDispatch } from "@/store/hooks";
import { setConnectDialogOpen } from "@/store/slices/uiSlice";

export function Header() {
  const { isConnected } = useAccount();
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-void/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-grad-primary shadow-glow-violet">
            <Zap className="h-4 w-4 text-white" fill="white" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-white">Orderbook</span>
          <Badge variant="violet" className="hidden sm:inline-flex">
            Orderly Testnet
          </Badge>
        </div>

        {isConnected ? (
          <AccountMenu />
        ) : (
          <Button onClick={() => dispatch(setConnectDialogOpen(true))}>Connect Wallet</Button>
        )}
      </div>
    </header>
  );
}
