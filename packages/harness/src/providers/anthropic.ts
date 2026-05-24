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
      ...(req.tools ? { tools: req.tools as object[] } : {}),
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
    let currentToolUse: { id: string; name: string; arguments: string } | null = null;
    for await (const line of parseSseLines(res.body)) {
      try {
        const evt = JSON.parse(line) as {
          type?: string;
          delta?: { type?: string; text?: string; stop_reason?: string };
        };
        if (evt.type === "error") {
          yield { type: "error" as const, error: `anthropic error: ${(evt as { error?: { message?: string } }).error?.message ?? "unknown"}` };
          return;
        }
        if (evt.type === "content_block_start") {
          const block = (evt as { content_block?: { type?: string; id?: string; name?: string } }).content_block;
          if (block?.type === "tool_use") {
            currentToolUse = { id: block.id ?? "", name: block.name ?? "", arguments: "" };
          }
        }
        if (evt.type === "content_block_stop" && currentToolUse) {
          yield { type: "tool_call" as const, toolCall: { id: currentToolUse.id, name: currentToolUse.name, arguments: currentToolUse.arguments } };
          currentToolUse = null;
        }
        if (evt.type === "content_block_delta") {
          const delta = (evt as { delta?: { type?: string; text?: string; partial_json?: string } }).delta;
          if (delta?.type === "text_delta" && delta.text) {
            yield { type: "text" as const, text: delta.text };
          }
          if (delta?.type === "input_json_delta" && currentToolUse && delta.partial_json) {
            currentToolUse.arguments += delta.partial_json;
          }
        }
        if (evt.type === "message_delta" && evt.delta?.stop_reason) {
          yield { type: "finish" as const, finishReason: evt.delta.stop_reason };
        }
      } catch {
        // ignore
      }
    }
  }
}
