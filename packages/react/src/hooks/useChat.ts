import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@aph/harness";
import { useTransport } from "../context/HarnessProvider.js";
import { useSelection } from "./useSelection.js";
import { useSettings } from "./useSettings.js";

export function useChat() {
  const t = useTransport();
  const { selection, loading } = useSelection();
  const { settings } = useSettings(selection?.modelId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<boolean>(false);

  const send = useCallback(async (text: string) => {
    if (!selection) return;
    abortRef.current = false;
    setError(null);
    setStatus("streaming");
    const userMsg: ChatMessage = { role: "user", content: text };
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    // Capture the current messages ref to build the history synchronously
    let capturedHistory: ChatMessage[] = [];
    setMessages((m) => {
      capturedHistory = [...m, userMsg];
      return [...m, userMsg, assistantMsg];
    });
    let acc = "";
    try {
      for await (const c of t.chat(selection.providerId, { modelId: selection.modelId, messages: capturedHistory, settings })) {
        if (abortRef.current) break;
        if (c.type === "text" && c.text) {
          acc += c.text;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        } else if (c.type === "error") {
          setError(c.error);
          setStatus("error");
          return;
        }
      }
      setStatus("idle");
    } catch (e) {
      setError(String((e as Error).message ?? e));
      setStatus("error");
    }
  }, [t, selection, settings]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setMessages([]);
    setStatus("idle");
    setError(null);
  }, []);

  return { ready: !loading && !!selection, status, messages, error, send, reset };
}
