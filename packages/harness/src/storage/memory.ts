import type { HarnessConfig, OwnerId, ProviderId, StorageAdapter } from "../types.js";

export class MemoryStorageAdapter implements StorageAdapter {
  private configs = new Map<OwnerId, HarnessConfig>();
  private keys = new Map<string, string>();
  private k(o: OwnerId, p: ProviderId) {
    return `${o}::${p}`;
  }
  async getConfig(o: OwnerId) {
    return this.configs.get(o) ?? {};
  }
  async setConfig(o: OwnerId, c: HarnessConfig) {
    this.configs.set(o, c);
  }
  async getKey(o: OwnerId, p: ProviderId) {
    return this.keys.get(this.k(o, p)) ?? null;
  }
  async setKey(o: OwnerId, p: ProviderId, v: string) {
    this.keys.set(this.k(o, p), v);
  }
  async hasKey(o: OwnerId, p: ProviderId) {
    return this.keys.has(this.k(o, p));
  }
  async deleteKey(o: OwnerId, p: ProviderId) {
    this.keys.delete(this.k(o, p));
  }
}
