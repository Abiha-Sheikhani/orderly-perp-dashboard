import { CheckCircle2, Circle, Loader2, KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrderlyOnboarding } from "@/hooks/useOrderlyOnboarding";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "register", label: "Register Orderly account", icon: ShieldCheck },
  { key: "key", label: "Delegate a trading key", icon: KeyRound },
] as const;

export function OnboardingCard() {
  const { status, isOnboarding, startOnboarding } = useOrderlyOnboarding();
  const errorMessage = useAppSelector((s) => s.orderly.error);

  if (status === "ready" || status === "disconnected") return null;

  const registerDone = !["checking", "needs_registration", "registering"].includes(status);
  const keyDone: boolean = (status as string) === "ready";
  const currentlyRegistering = status === "registering";
  const currentlyAddingKey = status === "adding_key";

  return (
    <Card className="border-violet-500/20">
      <CardHeader>
        <div>
          <CardTitle>Set up your trading account</CardTitle>
          <CardDescription>Two signatures, no gas — this only touches Orderly's off-chain API.</CardDescription>
        </div>
      </CardHeader>

      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => {
          const done = i === 0 ? registerDone : keyDone;
          const active = i === 0 ? currentlyRegistering : currentlyAddingKey;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                done
                  ? "border-cyan-500/25 bg-cyan-500/5"
                  : active
                    ? "border-violet-500/30 bg-violet-500/5"
                    : "border-line bg-white/[0.02]"
              )}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-400" />
              ) : active ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-400" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-mist" />
              )}
              <Icon className="h-4 w-4 shrink-0 text-mist" />
              <span className={cn("text-sm", done ? "text-white" : "text-mist")}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {status === "error" && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage ?? "Something went wrong. Please try again."}</span>
        </div>
      )}

      <Button
        className="mt-5 w-full"
        loading={isOnboarding}
        onClick={startOnboarding}
        disabled={status === "checking"}
      >
        {status === "checking"
          ? "Checking account…"
          : status === "needs_registration" || status === "registering"
            ? "Sign to register"
            : "Sign to delegate key"}
      </Button>
    </Card>
  );
}
