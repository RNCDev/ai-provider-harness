import { expectTypeOf, test } from "vitest";
import type { Provider, StorageAdapter, ChatChunk } from "../src/types.js";

test("Provider.chat returns AsyncIterable<ChatChunk>", () => {
  expectTypeOf<ReturnType<Provider["chat"]>>().toEqualTypeOf<AsyncIterable<ChatChunk>>();
});

test("StorageAdapter.hasKey returns Promise<boolean>", () => {
  expectTypeOf<ReturnType<StorageAdapter["hasKey"]>>().toEqualTypeOf<Promise<boolean>>();
});
