import { useEffect, useState } from "react";
import { useTransport } from "../context/HarnessProvider.js";
import type { ProviderInfo } from "../context/types.js";

export type UseProvidersResult =
  | { status: "loading"; providers: ProviderInfo[]; error: null }
  | { status: "ready"; providers: ProviderInfo[]; error: null }
  | { status: "error"; providers: ProviderInfo[]; error: Error };

export function useProviders(): UseProvidersResult & { refresh: () => void } {
  const t = useTransport();
  const [state, set] = useState<UseProvidersResult>({ status: "loading", providers: [], error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    set((s) => ({ ...s, status: "loading", error: null } as UseProvidersResult));
    t.listModels()
      .then((r) => { if (!cancelled) set({ status: "ready", providers: r.providers, error: null }); })
      .catch((e: Error) => { if (!cancelled) set({ status: "error", providers: [], error: e }); });
    return () => { cancelled = true; };
  }, [t, tick]);
  return { ...state, refresh: () => setTick((n) => n + 1) };
}
