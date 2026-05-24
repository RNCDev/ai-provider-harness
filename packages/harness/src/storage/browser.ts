import type { HarnessConfig, OwnerId, ProviderId, StorageAdapter } from "../types.js";

const CFG_PREFIX = "aph:cfg:";
const DB_NAME = "aph";
const STORE = "keys";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export class BrowserStorageAdapter implements StorageAdapter {
  private k(o: OwnerId, p: ProviderId) {
    return `${o}::${p}`;
  }
  async getConfig(o: OwnerId): Promise<HarnessConfig> {
    const raw = localStorage.getItem(CFG_PREFIX + o);
    return raw ? (JSON.parse(raw) as HarnessConfig) : {};
  }
  async setConfig(o: OwnerId, c: HarnessConfig) {
    localStorage.setItem(CFG_PREFIX + o, JSON.stringify(c));
  }
  async getKey(o: OwnerId, p: ProviderId) {
    const v = await tx<string | undefined>("readonly", (s) => s.get(this.k(o, p)) as IDBRequest<string | undefined>);
    return v ?? null;
  }
  async setKey(o: OwnerId, p: ProviderId, v: string) {
    await tx("readwrite", (s) => s.put(v, this.k(o, p)));
  }
  async hasKey(o: OwnerId, p: ProviderId) {
    return (await this.getKey(o, p)) !== null;
  }
  async deleteKey(o: OwnerId, p: ProviderId) {
    await tx("readwrite", (s) => s.delete(this.k(o, p)));
  }
}
