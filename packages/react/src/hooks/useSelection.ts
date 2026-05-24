import { useCallback, useEffect, useState } from "react";
import type { Selection } from "@aph/harness";
import { useTransport } from "../context/HarnessProvider.js";

export function useSelection() {
  const t = useTransport();
  const [selection, setSel] = useState<Selection | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    t.getConfig().then((cfg) => { if (!cancel) { setSel(cfg.selection); setLoading(false); } });
    return () => { cancel = true; };
  }, [t]);
  const setSelection = useCallback(async (s: Selection) => {
    const cfg = await t.getConfig();
    await t.putConfig({ ...cfg, selection: s });
    setSel(s);
  }, [t]);
  return { selection, loading, setSelection };
}
