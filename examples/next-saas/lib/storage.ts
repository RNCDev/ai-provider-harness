import { MemoryStorageAdapter } from "@aph/harness";
declare global { var __aphStorage: MemoryStorageAdapter | undefined; }
export const storage =
  globalThis.__aphStorage ?? (globalThis.__aphStorage = new MemoryStorageAdapter());
