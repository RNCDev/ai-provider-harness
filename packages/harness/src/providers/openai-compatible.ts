import type { ChatChunk, ChatRequest, ModelDescriptor, Provider } from "../types.js";
import { parseSseLines } from "./base.js";

export interface OpenAICompatibleConfig {
  id: string;
  displayName: string;
  baseUrl: string;
  authHeader?: (key: string) => Record<string, string>;
  extraHeaders?: Record<string, string>;
  validatePath?: string;
}

export function createOpenAICompatibleProvider(cfg: OpenAICompatibleConfig): Provider {
  const auth = cfg.authHeader ?? ((k) => ({ Authorization: `Bearer ${k}` }));
  return {
    id: cfg.id,
    displayName: cfg.displayName,
    async listModels(): Promise<ModelDescriptor[]> { return []; },
    async validateKey(key) {
      const res = await fetch(`${cfg.baseUrl}${cfg.validatePath ?? "/models"}`, {
        headers: { ...auth(key), ...cfg.extraHeaders },
      });
      return res.ok ? { ok: true } : { ok: false, message: `status ${res.status}` };
    },
    async *chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk> {
      const toolCallMap = new Map<number, { id: string; name: string; arguments: string }>();
      const body = {
        model: req.modelId,
        messages: req.messages.map(({ role, content, name, toolCallId }) => ({
          role, content,
          ...(name && { name }),
          ...(toolCallId && { tool_call_id: toolCallId }),
        })),
        stream: true,
        ...(req.settings?.temperature !== undefined && { temperature: req.settings.temperature }),
        ...(req.settings?.maxTokens !== undefined && { max_tokens: req.settings.maxTokens }),
        ...(req.settings?.topP !== undefined && { top_p: req.settings.topP }),
        ...(req.settings?.stop && { stop: req.settings.stop }),
        ...(req.tools && { tools: req.tools }),
        ...(req.toolChoice && { tool_choice: req.toolChoice }),
      };
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { ...auth(key), ...cfg.extraHeaders, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        yield { type: "error", error: `${cfg.id} http ${res.status}: ${await res.text()}` };
        return;
      }
      for await (const line of parseSseLines(res.body)) {
        if (line === "[DONE]") return;
        try {
          const evt = JSON.parse(line) as {
            error?: { message?: string };
            choices?: { delta?: { content?: string; tool_calls?: Array<{ index: number; id?: string; function?: { name?: string; arguments?: string } }> }; finish_reason?: string | null }[];
          };
          if (evt.error) {
            yield { type: "error", error: `${cfg.id} error: ${evt.error.message ?? "unknown"}` };
            return;
          }
          const choice = evt.choices?.[0];
          if (choice?.delta?.content) yield { type: "text", text: choice.delta.content };
          if (choice?.delta && "tool_calls" in choice.delta) {
            const toolCallsArr = choice.delta.tool_calls;
            if (Array.isArray(toolCallsArr)) {
              for (const d of toolCallsArr) {
                const existing = toolCallMap.get(d.index) ?? { id: "", name: "", arguments: "" };
                toolCallMap.set(d.index, {
                  id: existing.id || d.id || "",
                  name: existing.name || d.function?.name || "",
                  arguments: existing.arguments + (d.function?.arguments ?? ""),
                });
              }
            }
          }
          if (choice?.finish_reason && choice.finish_reason !== "null") {
            for (const [, tc] of toolCallMap) {
              yield { type: "tool_call", toolCall: { id: tc.id, name: tc.name, arguments: tc.arguments } };
            }
            yield { type: "finish", finishReason: choice.finish_reason };
          }
        } catch { /* ignore non-JSON heartbeats */ }
      }
    },
  };
}
