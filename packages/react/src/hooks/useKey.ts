import { useCallback, useEffect, useState } from "react";
import type { ProviderId } from "@aph/harness";
import { useTransport } from "../context/HarnessProvider.js";

export function useKey(providerId: ProviderId | undefined) {
  const t = useTransport();
  const [hasKey, set] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    if (!providerId) { setLoading(false); return; }
    t.keyStatus(providerId).then((r) => { if (!cancel) { set(r.hasKey); setLoading(false); } });
    return () => { cancel = true; };
  }, [t, providerId]);
  const setKey = useCallback(async (key: string) => {
    if (!providerId) return;
    await t.putKey(providerId, key);
    set(true);
  }, [t, providerId]);
  const deleteKey = useCallback(async () => {
    if (!providerId) return;
    await t.deleteKey(providerId);
    set(false);
  }, [t, providerId]);
  const validate = useCallback(
    () => providerId ? t.validateKey(providerId) : Promise.resolve({ ok: false, message: "no provider" }),
    [t, providerId],
  );
  return { hasKey, loading, setKey, deleteKey, validate };
}
