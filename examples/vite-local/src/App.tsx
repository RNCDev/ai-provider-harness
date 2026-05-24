import { BrowserTransport } from "@aph/react";
import {
  MemoryStorageAdapter,
  BrowserStorageAdapter,
  Catalog,
  openrouterProvider,
  togetherProvider,
  fireworksProvider,
  groqProvider,
  cerebrasProvider,
  ollamaProvider,
} from "@aph/harness";
import { OpenAIProvider, AnthropicProvider, GoogleProvider } from "@aph/harness";
import { SettingsPanel } from "./components/SettingsPanel";

const storage =
  typeof window !== "undefined" ? new BrowserStorageAdapter() : new MemoryStorageAdapter();
const transport = new BrowserTransport({
  ownerId: "demo",
  storage,
  providers: {
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
    google: new GoogleProvider(),
    openrouter: openrouterProvider,
    together: togetherProvider,
    fireworks: fireworksProvider,
    groq: groqProvider,
    cerebras: cerebrasProvider,
    ollama: ollamaProvider,
  },
  catalog: new Catalog(),
});

export function App() {
  return <SettingsPanel transport={transport} />;
}
