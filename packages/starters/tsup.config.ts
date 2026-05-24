import { defineConfig } from "tsup";
export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  banner: { js: "#!/usr/bin/env node" },
  dts: false,
  clean: true,
  target: "es2022",
});
