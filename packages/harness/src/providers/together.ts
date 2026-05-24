import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const togetherProvider = createOpenAICompatibleProvider({
  id: "together",
  displayName: "Together AI",
  baseUrl: "https://api.together.xyz/v1",
});
