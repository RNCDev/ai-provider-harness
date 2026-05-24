import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const groqProvider = createOpenAICompatibleProvider({
  id: "groq",
  displayName: "Groq",
  baseUrl: "https://api.groq.com/openai/v1",
});
