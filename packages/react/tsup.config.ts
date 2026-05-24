import { defineConfig } from "tsup";
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "@aph/harness"],
  sourcemap: true,
  target: "es2022",
});
