import type { Provider } from "../types.js";
import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { GoogleProvider } from "./google.js";
import { openrouterProvider } from "./openrouter.js";
import { togetherProvider } from "./together.js";
import { fireworksProvider } from "./fireworks.js";
import { groqProvider } from "./groq.js";
import { cerebrasProvider } from "./cerebras.js";
import { ollamaProvider } from "./ollama.js";

export const defaultProviders: Record<string, Provider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  google: new GoogleProvider(),
  openrouter: openrouterProvider,
  together: togetherProvider,
  fireworks: fireworksProvider,
  groq: groqProvider,
  cerebras: cerebrasProvider,
  ollama: ollamaProvider,
};

export class ProviderRegistry {
  constructor(private map: Record<string, Provider>) {
    for (const [key, provider] of Object.entries(map)) {
      if (key !== provider.id) {
        throw new Error(`ProviderRegistry: key "${key}" does not match provider.id "${provider.id}"`);
      }
    }
  }
  get(id: string): Provider | undefined { return this.map[id]; }
  ids(): string[] { return Object.keys(this.map); }
  all(): Provider[] { return Object.values(this.map); }
}
