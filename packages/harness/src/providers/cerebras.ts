import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const cerebrasProvider = createOpenAICompatibleProvider({
  id: "cerebras",
  displayName: "Cerebras",
  baseUrl: "https://api.cerebras.ai/v1",
});
