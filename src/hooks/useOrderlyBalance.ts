import { useQuery } from "@tanstack/react-query";
import { getClientHoldings } from "@/lib/orderly/api";
import { useOrderlySession } from "@/providers/OrderlySessionContext";

export function useOrderlyBalance() {
  const { session } = useOrderlySession();

  return useQuery({
    queryKey: ["orderly-holding", session?.accountId],
    queryFn: async () => {
      if (!session) throw new Error("No active Orderly session");
      const { holding } = await getClientHoldings(session.keyPair, session.accountId);
      const usdc = holding.find((h) => h.token === "USDC");
      return usdc?.holding ?? 0;
    },
    enabled: Boolean(session),
    refetchInterval: 10_000,
    retry: 1,
  });
}
