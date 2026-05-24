import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const openrouterProvider = createOpenAICompatibleProvider({
  id: "openrouter",
  displayName: "OpenRouter",
  baseUrl: "https://openrouter.ai/api/v1",
  extraHeaders: { "HTTP-Referer": "https://aph.dev", "X-Title": "AI Provider Harness" },
});
