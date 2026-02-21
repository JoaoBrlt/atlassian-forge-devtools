import { z } from "zod";

/**
 * Validates the HAR entry of an Atlassian Forge extension invocation.
 */
export const AtlassianRequestHarEntrySchema = z.object({
  request: z.object({
    method: z.literal("POST"),
    url: z.url().refine((url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.pathname.includes("/gateway/api/graphql");
      } catch {
        return false;
      }
    }),
    postData: z.object({
      text: z
        .string()
        .transform((str, ctx) => {
          try {
            return JSON.parse(str) as unknown;
          } catch {
            ctx.addIssue({ code: "custom", message: "Invalid JSON" });
            return z.NEVER;
          }
        })
        .pipe(
          z.object({
            operationName: z.enum(["forge_ui_invokeExtension", "useInvokeExtensionRelayMutation"]),
          }),
        ),
    }),
  }),
});

/**
 * Validates the call payload of an Atlassian Forge function invocation request.
 */
const AtlassianInvokeExtensionFunctionRequestPayloadSchema = z.object({
  // The key of the Forge function
  functionKey: z.string(),

  // (Optional) The payload of the Forge function
  payload: z.unknown(),
});

/**
 * Validates the call payload of an Atlassian Forge remote invocation request.
 */
const AtlassianInvokeExtensionRemoteRequestPayloadSchema = z.object({
  // The HTTP request method
  method: z.string(),

  // The HTTP request path
  path: z.string(),

  // (Optional) The HTTP request headers
  headers: z.record(z.string(), z.string()).optional().nullable(),

  // (Optional) The HTTP request body
  body: z.unknown(),
});

/**
 * Validates the payload of an Atlassian Forge extension invocation request.
 */
const AtlassianInvokeExtensionRequestPayloadSchema = z.object({
  // The invocation call
  call: z.union([
    AtlassianInvokeExtensionFunctionRequestPayloadSchema,
    AtlassianInvokeExtensionRemoteRequestPayloadSchema,
  ]),

  // (Optional) The invocation context
  context: z
    .object({
      // (Optional) The cloud identifier of the Atlassian site
      cloudId: z.string().optional().nullable(),

      // (Optional) The base URL of the Atlassian site
      siteUrl: z.string().optional().nullable(),

      // (Optional) The version of the Forge app
      appVersion: z.string().optional().nullable(),

      // (Optional) The type of the Forge environment
      environmentType: z.string().optional().nullable(),

      // (Optional) The identifier of the Forge environment
      environmentId: z.string().optional().nullable(),

      // (Optional) The key of the Forge module
      moduleKey: z.string().optional().nullable(),

      // (Optional) The details of the Forge module
      extension: z
        .object({
          // (Optional) The type of the Forge module
          type: z.string().optional().nullable(),
        })
        .optional()
        .nullable(),

      // (Optional) The local identifier of the Forge module
      localId: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

/**
 * Validates an Atlassian Forge extension invocation request.
 */
export const AtlassianInvokeExtensionRequestSchema = z.object({
  // The GraphQL operation name
  operationName: z.string(),

  // The GraphQL variables
  variables: z.object({
    // The input variables
    input: z.object({
      // (Optional) The identifier of the Forge module
      extensionId: z.string().optional().nullable(),

      // The invocation payload
      payload: AtlassianInvokeExtensionRequestPayloadSchema,
    }),
  }),
});

export type AtlassianInvokeExtensionRequest = z.infer<typeof AtlassianInvokeExtensionRequestSchema>;

/**
 * Validates a mutation error of an Atlassian Forge extension invocation response.
 */
const AtlassianInvokeExtensionResponseErrorSchema = z.object({
  // The error message
  message: z.string(),

  // The error extensions
  extensions: z.object({
    // The error type
    errorType: z.string(),

    // The error code
    statusCode: z.number(),
  }),
});

/**
 * Validates the response body of an Atlassian Forge function invocation.
 */
const AtlassianInvokeExtensionFunctionResponseBodySchema = z.unknown();

/**
 * Validates the response body of an Atlassian Forge remote invocation.
 */
const AtlassianInvokeExtensionRemoteResponseBodySchema = z.object({
  // Whether the HTTP request was successful
  success: z.boolean(),

  // (Optional) The success payload
  payload: z
    .object({
      // The HTTP response status
      status: z.number(),

      // (Optional) The HTTP response headers
      headers: z.record(z.string(), z.array(z.string())).optional().nullable(),

      // (Optional) The HTTP response body
      body: z.unknown(),
    })
    .optional()
    .nullable(),

  // (Optional) The error payload
  error: z
    .object({
      // The HTTP response status
      status: z.number(),

      // The HTTP response headers
      headers: z.record(z.string(), z.array(z.string())),

      // (Optional) The HTTP response body
      body: z.unknown(),
    })
    .optional()
    .nullable(),
});

/**
 * Validates an Atlassian Forge function invocation response.
 */
export const AtlassianInvokeExtensionFunctionResponseSchema = z.object({
  // The GraphQL response
  data: z.object({
    // The invocation result
    invokeExtension: z.object({
      // Whether the Forge invocation was successful
      success: z.boolean(),

      // (Optional) The invocation errors
      errors: z.array(AtlassianInvokeExtensionResponseErrorSchema).optional().nullable(),

      // (Optional) The invocation response
      response: z
        .object({
          body: AtlassianInvokeExtensionFunctionResponseBodySchema,
        })
        .optional()
        .nullable(),
    }),
  }),
});

export type AtlassianInvokeExtensionFunctionResponse = z.infer<typeof AtlassianInvokeExtensionFunctionResponseSchema>;

/**
 * Validates an Atlassian Forge remote invocation response.
 */
export const AtlassianInvokeExtensionRemoteResponseSchema = z.object({
  // The GraphQL response
  data: z.object({
    // The invocation result
    invokeExtension: z.object({
      // Whether the Forge invocation was successful
      success: z.boolean(),

      // (Optional) The invocation errors
      errors: z.array(AtlassianInvokeExtensionResponseErrorSchema).optional().nullable(),

      // (Optional) The invocation response
      response: z
        .object({
          body: AtlassianInvokeExtensionRemoteResponseBodySchema,
        })
        .optional()
        .nullable(),
    }),
  }),
});

export type AtlassianInvokeExtensionRemoteResponse = z.infer<typeof AtlassianInvokeExtensionRemoteResponseSchema>;
