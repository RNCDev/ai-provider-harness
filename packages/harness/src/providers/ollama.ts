import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export function createOllamaProvider(baseUrl = process.env["OLLAMA_BASE_URL"] ?? "http://localhost:11434") {
  return createOpenAICompatibleProvider({
    id: "ollama",
    displayName: "Ollama",
    baseUrl: `${baseUrl.replace(/\/$/, "")}/v1`,
    authHeader: () => ({}),
  });
}

export const ollamaProvider = createOllamaProvider();
