import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ["test/storage.browser.test.ts", "jsdom"],
    ],
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
    setupFiles: ["test/setup.browser.ts"],
    include: ["test/**/*.{test,test-d}.ts"],
    typecheck: {
      enabled: true,
      include: ["test/**/*.test-d.ts"],
    },
  },
});
