import { createContext, useContext, useState, type ReactNode } from "react";
import type { OrderlyKeyPair } from "@/lib/orderly/crypto";

export interface OrderlySession {
  keyPair: OrderlyKeyPair;
  accountId: string;
  scope: string;
  expiration: number;
}

interface OrderlySessionContextValue {
  session: OrderlySession | null;
  setSession: (session: OrderlySession | null) => void;
}

const OrderlySessionContext = createContext<OrderlySessionContextValue | null>(null);

export function OrderlySessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<OrderlySession | null>(null);
  return (
    <OrderlySessionContext.Provider value={{ session, setSession }}>{children}</OrderlySessionContext.Provider>
  );
}

export function useOrderlySession() {
  const ctx = useContext(OrderlySessionContext);
  if (!ctx) throw new Error("useOrderlySession must be used within OrderlySessionProvider");
  return ctx;
}
