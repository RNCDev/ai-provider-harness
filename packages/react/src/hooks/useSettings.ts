import { useCallback, useEffect, useState } from "react";
import type { InferenceSettings } from "@aph/harness";
import { useTransport } from "../context/HarnessProvider.js";

export function useSettings(modelId: string | undefined) {
  const t = useTransport();
  const [settings, set] = useState<InferenceSettings>({});
  useEffect(() => {
    let cancel = false;
    if (!modelId) return;
    t.getConfig().then((cfg) => { if (!cancel) set(cfg.settings?.[modelId] ?? {}); });
    return () => { cancel = true; };
  }, [t, modelId]);
  const update = useCallback(async (patch: Partial<InferenceSettings>) => {
    if (!modelId) return;
    const cfg = await t.getConfig();
    const existing = cfg.settings?.[modelId] ?? {};
    const merged = { ...existing, ...patch };
    await t.putConfig({ ...cfg, settings: { ...(cfg.settings ?? {}), [modelId]: merged } });
    set(merged);
  }, [t, modelId]);
  return { settings, update };
}
