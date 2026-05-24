import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const fireworksProvider = createOpenAICompatibleProvider({
  id: "fireworks",
  displayName: "Fireworks AI",
  baseUrl: "https://api.fireworks.ai/inference/v1",
});
