import { z } from "zod";

/**
 * Validates the body of a tRPC procedure call.
 */
export const TrpcCallSchema = z.object({
  // The kind of tRPC procedure being called
  type: z.enum(["query", "mutation"]),

  // The dot-separated router path of the tRPC procedure
  path: z.string(),

  // Whether the call was part of a tRPC batch request
  isBatchCall: z.boolean(),
});

export type TrpcCall = z.infer<typeof TrpcCallSchema>;
