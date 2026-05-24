import { useProviders } from "./useProviders.js";
import type { ProviderInfo } from "../context/types.js";

export function useModels(providerId: string | undefined): { status: string; models: ProviderInfo["models"] } {
  const { status, providers } = useProviders();
  const models = providerId ? (providers.find((p) => p.id === providerId)?.models ?? []) : [];
  return { status, models };
}
