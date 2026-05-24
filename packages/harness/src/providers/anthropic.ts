import type { ChatChunk, ChatRequest, ModelDescriptor, Provider } from "../types.js";
import { parseSseLines } from "./base.js";

const BASE = "https://api.anthropic.com/v1";

export class AnthropicProvider implements Provider {
  readonly id = "anthropic";
  readonly displayName = "Anthropic";
  constructor(private opts: { baseUrl?: string } = {}) {}

  async listModels(): Promise<ModelDescriptor[]> {
    return [];
  }

  async validateKey(key: string) {
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    return res.ok ? { ok: true as const } : { ok: false as const, message: `status ${res.status}` };
  }

  async *chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk> {
    if (req.settings?.maxTokens === undefined) {
      yield { type: "error" as const, error: "Anthropic requires settings.maxTokens" };
      return;
    }
    const system = req.messages.find((m) => m.role === "system")?.content;
    const messages = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));
    const body = {
      model: req.modelId,
      max_tokens: req.settings.maxTokens,
      stream: true,
      ...(system && { system }),
      ...(req.settings.temperature !== undefined && { temperature: req.settings.temperature }),
      ...(req.settings.topP !== undefined && { top_p: req.settings.topP }),
      ...(req.settings.stop && { stop_sequences: req.settings.stop }),
      ...(req.tools && { tools: req.tools }),
      messages,
    };
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      yield { type: "error" as const, error: `anthropic http ${res.status}: ${await res.text()}` };
      return;
    }
    for await (const line of parseSseLines(res.body)) {
      try {
        const evt = JSON.parse(line) as {
          type?: string;
          delta?: { type?: string; text?: string; stop_reason?: string };
        };
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta" && evt.delta.text) {
          yield { type: "text" as const, text: evt.delta.text };
        } else if (evt.type === "message_delta" && evt.delta?.stop_reason) {
          yield { type: "finish" as const, finishReason: evt.delta.stop_reason };
        }
      } catch {
        // ignore
      }
    }
  }
}
