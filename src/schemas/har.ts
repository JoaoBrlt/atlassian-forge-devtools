import { z } from "zod";

/**
 * Minimal validation schema for a HAR file.
 */
export const MinimalHarSchema = z.object({
  log: z.object({
    entries: z.array(z.unknown()),
  }),
});
