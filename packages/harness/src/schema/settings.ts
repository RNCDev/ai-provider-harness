import { z } from "zod";
import type { InferenceSettings } from "../types.js";

export const inferenceSettingsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(200_000).optional(),
  topP: z.number().min(0).max(1).optional(),
  systemPrompt: z.string().max(100_000).optional(),
  stop: z
    .union([z.string(), z.array(z.string()).max(8)])
    .transform((v) => (typeof v === "string" ? [v] : v))
    .optional(),
});

export type ValidateResult =
  | { ok: true; value: InferenceSettings }
  | { ok: false; errors: { path: (string | number)[]; message: string }[] };

export function validateSettings(input: unknown): ValidateResult {
  const r = inferenceSettingsSchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data as InferenceSettings };
  return {
    ok: false,
    errors: r.error.issues.map((i) => ({ path: i.path, message: i.message })),
  };
}
