import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "server/index": "src/server/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  target: "es2022",
});
