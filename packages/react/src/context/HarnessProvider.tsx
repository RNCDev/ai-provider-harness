import { createContext, useContext, type ReactNode } from "react";
import type { Transport } from "./types.js";

const Ctx = createContext<Transport | null>(null);

export interface HarnessProviderProps {
  transport: Transport;
  children: ReactNode;
}

export function HarnessProvider({ transport, children }: HarnessProviderProps) {
  return <Ctx.Provider value={transport}>{children}</Ctx.Provider>;
}

export function useTransport(): Transport {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTransport must be used within <HarnessProvider>");
  return v;
}
