export type OwnerId = string;
export type ProviderId = string;
export type ModelId = string;

export interface InferenceSettings {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  stop?: string[];
}

export interface Selection {
  providerId: ProviderId;
  modelId: ModelId;
}

export interface HarnessConfig {
  selection?: Selection;
  settings?: Record<ModelId, InferenceSettings>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ChatRequest {
  modelId: ModelId;
  messages: ChatMessage[];
  settings?: InferenceSettings;
  tools?: unknown;
  toolChoice?: unknown;
  stream?: boolean;
}

export interface ChatChunk {
  type: "text" | "tool_call" | "finish" | "error";
  text?: string;
  toolCall?: ToolCall;
  finishReason?: string;
  error?: string;
}

export interface ModelDescriptor {
  id: ModelId;
  providerId: ProviderId;
  displayName: string;
  contextWindow?: number;
  maxOutput?: number;
  capabilities: {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
    reasoning: boolean;
  };
}

export interface Provider {
  id: ProviderId;
  displayName: string;
  listModels(): Promise<ModelDescriptor[]>;
  chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk>;
  validateKey(key: string): Promise<{ ok: boolean; message?: string }>;
}

export interface StorageAdapter {
  getConfig(ownerId: OwnerId): Promise<HarnessConfig>;
  setConfig(ownerId: OwnerId, config: HarnessConfig): Promise<void>;
  getKey(ownerId: OwnerId, providerId: ProviderId): Promise<string | null>;
  setKey(ownerId: OwnerId, providerId: ProviderId, key: string): Promise<void>;
  hasKey(ownerId: OwnerId, providerId: ProviderId): Promise<boolean>;
  deleteKey(ownerId: OwnerId, providerId: ProviderId): Promise<void>;
}
