import { useAccount } from "wagmi";
import { Hero } from "@/components/dashboard/Hero";
import { OnboardingCard } from "@/components/dashboard/OnboardingCard";
import { BalanceOverview } from "@/components/dashboard/BalanceOverview";
import { AccountStatusCard } from "@/components/dashboard/AccountStatusCard";
import { TransferPanel } from "@/components/dashboard/TransferPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export function Dashboard() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <Hero />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <BalanceOverview />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <OnboardingCard />
          <AccountStatusCard />
          <ActivityFeed />
        </div>
        <div>
          <TransferPanel />
        </div>
      </div>
    </main>
  );
}
