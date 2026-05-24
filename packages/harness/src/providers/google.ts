import type { ChatChunk, ChatRequest, ModelDescriptor, Provider } from "../types.js";
import { parseSseLines } from "./base.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GoogleProvider implements Provider {
  readonly id = "google";
  readonly displayName = "Google";
  constructor(private opts: { baseUrl?: string } = {}) {}

  async listModels(): Promise<ModelDescriptor[]> {
    return [];
  }

  async validateKey(key: string) {
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/models`, {
      headers: { "x-goog-api-key": key },
    });
    return res.ok ? { ok: true as const } : { ok: false as const, message: `status ${res.status}` };
  }

  async *chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk> {
    const systemInstr = req.messages.find((m) => m.role === "system")?.content;
    const contents = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const body = {
      contents,
      ...(systemInstr && { systemInstruction: { parts: [{ text: systemInstr }] } }),
      generationConfig: {
        ...(req.settings?.temperature !== undefined && { temperature: req.settings.temperature }),
        ...(req.settings?.maxTokens !== undefined && { maxOutputTokens: req.settings.maxTokens }),
        ...(req.settings?.topP !== undefined && { topP: req.settings.topP }),
        ...(req.settings?.stop && { stopSequences: req.settings.stop }),
      },
      ...(req.tools ? { tools: req.tools as object[] } : {}),
    };
    const url = `${this.opts.baseUrl ?? BASE}/models/${encodeURIComponent(req.modelId)}:streamGenerateContent?alt=sse`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      yield { type: "error" as const, error: `google http ${res.status}: ${await res.text()}` };
      return;
    }
    for await (const line of parseSseLines(res.body)) {
      try {
        const evt = JSON.parse(line) as {
          candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        };
        if ((evt as { error?: unknown }).error) {
          const errMsg = (evt as { error: { message?: string } }).error.message ?? "unknown error";
          yield { type: "error" as const, error: `google error: ${errMsg}` };
          return;
        }
        const cand = evt.candidates?.[0];
        const parts = cand?.content?.parts ?? [];
        for (const p of parts) {
          const part = p as { text?: string; functionCall?: { name?: string; args?: unknown } };
          if (part.text) {
            yield { type: "text" as const, text: part.text };
          }
          if (part.functionCall) {
            yield {
              type: "tool_call" as const,
              toolCall: {
                id: `${req.modelId}-fc`,
                name: part.functionCall.name ?? "",
                arguments: JSON.stringify(part.functionCall.args ?? {}),
              },
            };
          }
        }
        if (cand?.finishReason) yield { type: "finish" as const, finishReason: cand.finishReason };
      } catch {
        // ignore
      }
    }
  }
}
