import type { ChatChunk, ChatRequest, ModelDescriptor, Provider } from "../types.js";
import { parseSseLines } from "./base.js";

const BASE = "https://api.openai.com/v1";

export interface OpenAIProviderOptions {
  baseUrl?: string;
  listModels?: () => Promise<ModelDescriptor[]>;
}

export class OpenAIProvider implements Provider {
  readonly id = "openai";
  readonly displayName = "OpenAI";
  constructor(private opts: OpenAIProviderOptions = {}) {}

  async listModels(): Promise<ModelDescriptor[]> {
    if (this.opts.listModels) return this.opts.listModels();
    return [];
  }

  async validateKey(key: string) {
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    return res.ok ? { ok: true as const } : { ok: false as const, message: `status ${res.status}` };
  }

  async *chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk> {
    const body = {
      model: req.modelId,
      messages: req.messages.map(({ role, content, name, toolCallId }) => ({
        role,
        content,
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
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      yield { type: "error" as const, error: `openai http ${res.status}: ${await res.text()}` };
      return;
    }
    for await (const line of parseSseLines(res.body)) {
      if (line === "[DONE]") return;
      try {
        const evt = JSON.parse(line) as {
          choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
        };
        const choice = evt.choices?.[0];
        if (choice?.delta?.content) yield { type: "text" as const, text: choice.delta.content };
        if (choice?.finish_reason) yield { type: "finish" as const, finishReason: choice.finish_reason };
      } catch {
        // ignore non-JSON heartbeats
      }
    }
  }
}
