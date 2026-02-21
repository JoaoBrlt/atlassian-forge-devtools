import { Browser } from "#imports";
import {
  AtlassianInvokeExtensionFunctionResponse,
  AtlassianInvokeExtensionFunctionResponseSchema,
  AtlassianInvokeExtensionRemoteResponse,
  AtlassianInvokeExtensionRemoteResponseSchema,
  AtlassianInvokeExtensionRequest,
  AtlassianInvokeExtensionRequestSchema,
  AtlassianRequestHarEntrySchema,
} from "@/schemas/atlassian";
import {
  AtlassianEntry,
  AtlassianFunctionResponse,
  AtlassianRemoteResponse,
  AtlassianRequest,
  AtlassianResponse,
} from "@/types/atlassian";
import { base64ToString, isBlank, isNotBlank } from "@/utils/string-utils";
import { Entry } from "har-format";

/**
 * Parses a HAR entry into an Atlassian HAR entry (if the request is an Atlassian Forge extension invocation).
 * @param entry the HAR entry to parse
 * @return the Atlassian HAR entry, or null if the entry is not an Atlassian Forge extension invocation
 * @throws Error if unable to parse the request or response from a valid Atlassian Forge extension invocation
 */
export async function parseHarEntry(entry: Entry | Browser.devtools.network.Request): Promise<AtlassianEntry | null> {
  if (!isAtlassianRequest(entry)) {
    return null;
  }
  const parsedRequest = parseRequest(entry);
  const responseBody = await getResponseBody(entry);
  if (isBlank(responseBody)) {
    throw new Error("Missing response body");
  }
  const parsedResponse = parseResponse(entry, parsedRequest, responseBody);
  return buildAtlassianEntry(entry, parsedRequest, parsedResponse, responseBody);
}

/**
 * Indicates whether a given HAR entry is an Atlassian Forge extension invocation.
 * @param entry the HAR entry to check
 * @return true if the HAR entry is an Atlassian Forge extension invocation, false otherwise
 */
function isAtlassianRequest(entry: Entry | Browser.devtools.network.Request) {
  return AtlassianRequestHarEntrySchema.safeParse(entry).success;
}

/**
 * Parses the Atlassian request from an Atlassian Forge extension invocation.
 * @param entry the HAR entry of the Atlassian Forge extension invocation
 * @return the parsed Atlassian request
 * @throws Error if unable to parse the Atlassian request from the HAR entry
 */
function parseRequest(entry: Entry | Browser.devtools.network.Request): AtlassianRequest {
  // Get the request body
  const body = entry.request.postData?.text;
  if (isBlank(body)) {
    throw new Error("Missing request body");
  }

  // Parse the request body
  let parsedRequest: unknown;
  try {
    parsedRequest = JSON.parse(body);
  } catch (error) {
    throw new Error("Failed to parse the request body", { cause: error });
  }

  // Validate the request body
  let validatedRequest: AtlassianInvokeExtensionRequest;
  try {
    validatedRequest = AtlassianInvokeExtensionRequestSchema.parse(parsedRequest);
  } catch (error) {
    throw new Error("Failed to validate the request body", { cause: error });
  }

  // Get the request payload
  const payload = validatedRequest.variables.input.payload;

  // Function invocation
  if ("functionKey" in payload.call) {
    return {
      type: "invoke",
      functionKey: payload.call.functionKey,
      body: payload.call.payload,
      context: parseRequestContext(validatedRequest),
    };
  }

  // Remote invocation
  return {
    type: "invokeRemote",
    method: payload.call.method,
    path: payload.call.path,
    headers: payload.call.headers ?? undefined,
    body: payload.call.body,
    context: parseRequestContext(validatedRequest),
  };
}

/**
 * Parses the Forge invocation context from an Atlassian Forge extension invocation.
 * @param request the raw Atlassian request
 * @return the parsed Forge invocation context
 */
function parseRequestContext(request: AtlassianInvokeExtensionRequest) {
  const extensionId = request.variables.input.extensionId;
  const payload = request.variables.input.payload;
  return {
    siteUrl: payload.context?.siteUrl ?? undefined,
    cloudId: payload.context?.cloudId ?? undefined,
    appVersion: payload.context?.appVersion ?? undefined,
    environmentType: payload.context?.environmentType ?? undefined,
    environmentId: payload.context?.environmentId ?? undefined,
    extensionType: payload.context?.extension?.type ?? undefined,
    extensionId: extensionId ?? undefined,
    moduleKey: payload.context?.moduleKey ?? undefined,
    localId: payload.context?.localId ?? undefined,
  };
}

/**
 * Retrieves the response body of an HAR entry.
 * @param entry the HAR entry to process
 * @return the response body of the HAR entry, or null if the response body is not available
 */
async function getResponseBody(entry: Entry | Browser.devtools.network.Request): Promise<string | null> {
  const raw = await getRawResponseBody(entry);
  if (raw == null) {
    return null;
  }
  if (raw.content == null) {
    return null;
  }
  if (raw.encoding === "base64") {
    return base64ToString(raw.content);
  }
  return raw.content;
}

/**
 * Retrieves the raw response body of an HAR entry.
 * @param entry the HAR entry to process
 * @return the raw response body of the HAR entry, or null if the raw response body is not available
 */
async function getRawResponseBody(
  entry: Entry | Browser.devtools.network.Request,
): Promise<{ content?: string; encoding?: string } | null> {
  // Response body is already present
  if (isNotBlank(entry.response.content.text)) {
    return {
      content: entry.response.content.text,
      encoding: entry.response.content.encoding,
    };
  }

  // Manually fetch the response body
  if ("getContent" in entry && typeof entry.getContent === "function") {
    return await new Promise<{ content?: string; encoding?: string }>((resolve) => {
      entry.getContent((content, encoding) => {
        resolve({ content, encoding });
      });
    });
  }

  return null;
}

/**
 * Parses the Atlassian response from an Atlassian Forge extension invocation.
 * @param entry the HAR entry of the Atlassian Forge extension invocation
 * @param parsedRequest the parsed Atlassian request
 * @param responseBody the response body of the HAR entry
 * @return the parsed Atlassian response
 * @throws Error if unable to parse the Atlassian response from the HAR entry
 */
function parseResponse(
  entry: Entry | Browser.devtools.network.Request,
  parsedRequest: AtlassianRequest,
  responseBody: string,
): AtlassianResponse {
  switch (parsedRequest.type) {
    case "invoke":
      return parseFunctionResponse(entry, responseBody);
    case "invokeRemote":
      return parseRemoteResponse(entry, responseBody);
  }
}

/**
 * Parses the Atlassian response from an Atlassian Forge extension function invocation (function call).
 * @param entry the HAR entry of the Atlassian Forge extension function invocation
 * @param responseBody the response body of the HAR entry
 * @return the parsed Atlassian response
 * @throws Error if unable to parse the Atlassian response from the HAR entry
 */
function parseFunctionResponse(
  entry: Entry | Browser.devtools.network.Request,
  responseBody: string,
): AtlassianFunctionResponse {
  // Parse the response body
  let parsedResponse: unknown;
  try {
    parsedResponse = JSON.parse(responseBody);
  } catch (error) {
    throw new Error("Failed to parse the response body", { cause: error });
  }

  // Validate the response body
  let validatedResponse: AtlassianInvokeExtensionFunctionResponse;
  try {
    validatedResponse = AtlassianInvokeExtensionFunctionResponseSchema.parse(parsedResponse);
  } catch (error) {
    throw new Error("Failed to validate the response body", { cause: error });
  }

  // Failed invocation
  if (!validatedResponse.data.invokeExtension.success) {
    const errors = validatedResponse.data.invokeExtension.errors;
    return {
      type: "invoke",
      success: false,
      errors:
        errors?.map((error) => ({
          status: error.extensions.statusCode,
          type: error.extensions.errorType,
          message: error.message,
        })) ?? [],
      transferredSize: entry.response._transferSize ?? entry.response.content.size,
      size: entry.response.content.size,
      duration: entry.time,
    };
  }

  // Get the response payload
  const response = validatedResponse.data.invokeExtension.response;

  // Missing response payload
  if (response == null) {
    return {
      type: "invoke",
      success: false,
      errors: [
        {
          status: 500,
          type: "MISSING_RESPONSE",
          message: "Missing response from Forge invocation.",
        },
      ],
      transferredSize: entry.response._transferSize ?? entry.response.content.size,
      size: entry.response.content.size,
      duration: entry.time,
    };
  }

  // Successful invocation
  return {
    type: "invoke",
    success: true,
    body: response.body,
    transferredSize: entry.response._transferSize ?? entry.response.content.size,
    size: entry.response.content.size,
    duration: entry.time,
  };
}

/**
 * Parses the Atlassian response from an Atlassian Forge extension function invocation (remote call).
 * @param entry the HAR entry of the Atlassian Forge extension function invocation
 * @param responseBody the response body of the HAR entry
 * @return the parsed Atlassian response
 * @throws Error if unable to parse the Atlassian response from the HAR entry
 */
function parseRemoteResponse(
  entry: Entry | Browser.devtools.network.Request,
  responseBody: string,
): AtlassianRemoteResponse {
  // Parse the response body
  let parsedResponse: unknown;
  try {
    parsedResponse = JSON.parse(responseBody);
  } catch (error) {
    throw new Error("Failed to parse the response body", { cause: error });
  }

  // Validate the response body
  let validatedResponse: AtlassianInvokeExtensionRemoteResponse;
  try {
    validatedResponse = AtlassianInvokeExtensionRemoteResponseSchema.parse(parsedResponse);
  } catch (error) {
    throw new Error("Failed to validate the response body", { cause: error });
  }

  // Failed invocation
  if (!validatedResponse.data.invokeExtension.success) {
    const errors = validatedResponse.data.invokeExtension.errors;
    return {
      type: "invokeRemote",
      success: false,
      errors:
        errors?.map((error) => ({
          status: error.extensions.statusCode,
          type: error.extensions.errorType,
          message: error.message,
        })) ?? [],
      transferredSize: entry.response._transferSize ?? entry.response.content.size,
      size: entry.response.content.size,
      duration: entry.time,
    };
  }

  // Get the response payload
  const response = validatedResponse.data.invokeExtension.response;

  // Missing response payload
  if (response == null) {
    return {
      type: "invokeRemote",
      success: false,
      errors: [
        {
          status: 500,
          type: "MISSING_RESPONSE",
          message: "Missing response from Forge invocation.",
        },
      ],
      transferredSize: entry.response._transferSize ?? entry.response.content.size,
      size: entry.response.content.size,
      duration: entry.time,
    };
  }

  // Failed request
  if (!response.body.success) {
    // Missing error payload
    const errorPayload = response.body.error;
    if (errorPayload == null) {
      return {
        type: "invokeRemote",
        success: false,
        errors: [
          {
            status: 500,
            type: "MISSING_RESPONSE_ERROR_PAYLOAD",
            message: "Missing response error payload from Forge invocation.",
          },
        ],
        transferredSize: entry.response._transferSize ?? entry.response.content.size,
        size: entry.response.content.size,
        duration: entry.time,
      };
    }

    // Error response
    return {
      type: "invokeRemote",
      success: true,
      status: errorPayload.status,
      headers: errorPayload.headers != null ? concatenateHeaders(errorPayload.headers) : undefined,
      body: errorPayload.body,
      transferredSize: entry.response._transferSize ?? entry.response.content.size,
      size: entry.response.content.size,
      duration: entry.time,
    };
  }

  // Missing success payload
  const successPayload = response.body.payload;
  if (successPayload == null) {
    return {
      type: "invokeRemote",
      success: false,
      errors: [
        {
          status: 500,
          type: "MISSING_RESPONSE_SUCCESS_PAYLOAD",
          message: "Missing response success payload from Forge invocation.",
        },
      ],
      transferredSize: entry.response._transferSize ?? entry.response.content.size,
      size: entry.response.content.size,
      duration: entry.time,
    };
  }

  // Successful response
  return {
    type: "invokeRemote",
    success: true,
    status: successPayload.status,
    headers: successPayload.headers != null ? concatenateHeaders(successPayload.headers) : undefined,
    body: successPayload.body,
    transferredSize: entry.response._transferSize ?? entry.response.content.size,
    size: entry.response.content.size,
    duration: entry.time,
  };
}

/**
 * Concatenates multi-value headers into single-value headers.
 * @param headers the headers to convert
 * @return the converted headers
 */
function concatenateHeaders(headers: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([key, values]) => [key, values.join(", ")]));
}

/**
 * Builds an Atlassian HAR entry from an HAR entry.
 * @param entry the HAR entry
 * @param parsedRequest the parsed Atlassian request
 * @param parsedResponse the parsed Atlassian response
 * @param responseBody the response body of the HAR entry
 * @return the Atlassian HAR entry
 */
function buildAtlassianEntry(
  entry: Entry | Browser.devtools.network.Request,
  parsedRequest: AtlassianRequest,
  parsedResponse: AtlassianResponse,
  responseBody: string,
) {
  // Build the HAR entry
  const parsedEntry: AtlassianEntry = {
    ...entry,
    parsedRequest,
    parsedResponse,
  };

  // Set the response body of the HAR entry
  parsedEntry.response = {
    ...entry.response,
    content: {
      ...entry.response.content,
      text: responseBody,
    },
  };

  return parsedEntry;
}
