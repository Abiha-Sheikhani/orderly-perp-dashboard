import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store/store";
import { wagmiConfig } from "@/lib/wagmi/config";
import { OrderlySessionProvider } from "@/providers/OrderlySessionContext";
import { BackgroundFX } from "@/components/layout/BackgroundFX";
import { Header } from "@/components/layout/Header";
import { ConnectWalletDialog } from "@/components/wallet/ConnectWalletDialog";
import { Toaster } from "@/components/ui/toaster";
import { Dashboard } from "@/pages/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <ReduxProvider store={store}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <OrderlySessionProvider>
            <BackgroundFX />
            <Header />
            <Dashboard />
            <ConnectWalletDialog />
            <Toaster />
          </OrderlySessionProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ReduxProvider>
  );
}
