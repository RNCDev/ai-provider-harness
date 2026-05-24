import express from "express";
import { createHarness, aphExpress } from "@aph/harness/server";
import { defaultProviders, MemoryStorageAdapter } from "@aph/harness";

const app = express();
app.use(express.json());

const harness = createHarness({
  storage: new MemoryStorageAdapter(),
  providers: defaultProviders,
  identify: (req) => (req as express.Request).header("x-user") ?? "demo",
});

app.use("/aph", aphExpress(harness));

const port = Number(process.env["PORT"] ?? 3001);
app.listen(port, () => console.log(`aph express demo listening on http://localhost:${port}`));
