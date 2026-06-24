import { z } from "zod";

export const analysisSchema = z.object({
  summary: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
});
