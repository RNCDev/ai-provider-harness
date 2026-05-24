import type { ChatChunk, ChatRequest, HarnessConfig, InferenceSettings, ProviderId } from "@aph/harness";

export interface ProviderInfo {
  id: ProviderId;
  displayName: string;
  models: { id: string; displayName: string; capabilities: Record<string, boolean> }[];
}
export interface ModelsResponse { providers: ProviderInfo[] }

export interface Transport {
  listModels(): Promise<ModelsResponse>;
  getConfig(): Promise<HarnessConfig>;
  putConfig(cfg: HarnessConfig): Promise<HarnessConfig>;
  keyStatus(providerId: ProviderId): Promise<{ hasKey: boolean }>;
  putKey(providerId: ProviderId, key: string): Promise<{ hasKey: true }>;
  deleteKey(providerId: ProviderId): Promise<{ hasKey: false }>;
  validateKey(providerId: ProviderId): Promise<{ ok: boolean; message?: string }>;
  chat(providerId: ProviderId, req: ChatRequest): AsyncIterable<ChatChunk>;
}

export type SettingsByModel = Record<string, InferenceSettings>;
