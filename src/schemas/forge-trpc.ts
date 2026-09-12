import { z } from "zod";

/**
 * Validates the body of a Forge tRPC request.
 * See: https://github.com/toolsplus/forge-trpc
 */
export const ForgeTrpcRequestSchema = z.object({
  // The type of the tRPC procedure
  type: z.enum(["query", "mutation", "subscription"]),

  // The dot-separated path of the tRPC procedure
  path: z.string(),

  // (Optional) The input data of the tRPC procedure
  input: z.unknown().optional(),

  // Whether the call was part of a tRPC batch request
  isBatchCall: z.boolean(),
});

/**
 * Represents the type of the body of a Forge tRPC request.
 * See: https://github.com/toolsplus/forge-trpc
 */
export type ForgeTrpcRequest = z.infer<typeof ForgeTrpcRequestSchema>;

/**
 * Validates the body of a successful Forge tRPC response.
 * See: https://github.com/toolsplus/forge-trpc
 */
const ForgeTrpcSuccessResponseSchema = z.object({
  // The result of the tRPC procedure
  result: z.object({
    // (Optional) The result data of the tRPC procedure
    data: z.unknown().optional(),
  }),
});

/**
 * Validates the body of a failed Forge tRPC response.
 * See: https://github.com/toolsplus/forge-trpc
 */
const ForgeTrpcErrorResponseSchema = z.object({
  // The error of the tRPC procedure
  error: z.unknown(),
});

/**
 * Validates the body of a Forge tRPC response.
 * See: https://github.com/toolsplus/forge-trpc
 */
export const ForgeTrpcResponseSchema = z.union([ForgeTrpcErrorResponseSchema, ForgeTrpcSuccessResponseSchema]);

/**
 * Represents the type of the body of a Forge tRPC response.
 * See: https://github.com/toolsplus/forge-trpc
 */
export type ForgeTrpcResponse = z.infer<typeof ForgeTrpcResponseSchema>;
