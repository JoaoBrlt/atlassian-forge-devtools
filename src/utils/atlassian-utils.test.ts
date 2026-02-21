import { Entry } from "har-format";
import { describe, expect, it } from "vitest";
import { parseHarEntry } from "./atlassian-utils";
import { Browser } from "#imports";

function buildFunctionCall(overrides?: Record<string, unknown>) {
  return { functionKey: "my-function", payload: { input: "data" }, ...overrides };
}

function buildRemoteCall(overrides?: Record<string, unknown>) {
  return {
    method: "GET",
    path: "/rest/api/3/issue/PROJ-1",
    headers: { Accept: "application/json" },
    ...overrides,
  };
}

function buildInvocationContext(overrides?: Record<string, unknown>) {
  return {
    siteUrl: "https://example.atlassian.net",
    cloudId: "cloud-abc-123",
    appVersion: "1.0.0",
    environmentType: "PRODUCTION",
    environmentId: "env-xyz-456",
    moduleKey: "my-jira-module",
    extension: { type: "jira:issuePanel" },
    localId: "local-def-789",
    ...overrides,
  };
}

function buildRequestBody(
  call: unknown,
  options?: {
    operationName?: string;
    context?: unknown;
    extensionId?: string | null;
  },
): string {
  return JSON.stringify({
    operationName: options?.operationName ?? "forge_ui_invokeExtension",
    variables: {
      input: {
        extensionId: options?.extensionId !== undefined ? options.extensionId : "ext-abc-001",
        payload: {
          call,
          context: options?.context !== undefined ? options.context : buildInvocationContext(),
        },
      },
    },
  });
}

function buildPartialRequestBody(extra: Record<string, unknown>): string {
  return JSON.stringify({ operationName: "forge_ui_invokeExtension", ...extra });
}

function buildFunctionSuccessResponse(body: unknown = null): string {
  return JSON.stringify({
    data: { invokeExtension: { success: true, response: { body } } },
  });
}

function buildFunctionErrorResponse(
  errors?: Array<{ message: string; extensions: { errorType: string; statusCode: number } }> | null,
): string {
  return JSON.stringify({
    data: { invokeExtension: { success: false, errors: errors ?? null } },
  });
}

function buildFunctionMissingResponsePayload(): string {
  return JSON.stringify({ data: { invokeExtension: { success: true, response: null } } });
}

function buildRemoteForgeErrorResponse(
  errors?: Array<{ message: string; extensions: { errorType: string; statusCode: number } }> | null,
): string {
  return JSON.stringify({
    data: { invokeExtension: { success: false, errors: errors ?? null } },
  });
}

function buildRemoteSuccessResponse(payload: {
  status: number;
  headers?: Record<string, string[]>;
  body?: unknown;
}): string {
  return JSON.stringify({
    data: { invokeExtension: { success: true, response: { body: { success: true, payload } } } },
  });
}

function buildRemoteErrorBodyResponse(error: {
  status: number;
  headers: Record<string, string[]>;
  body?: unknown;
}): string {
  return JSON.stringify({
    data: { invokeExtension: { success: true, response: { body: { success: false, error } } } },
  });
}

function buildRemoteMissingResponsePayload(): string {
  return JSON.stringify({ data: { invokeExtension: { success: true, response: null } } });
}

function buildRemoteMissingErrorPayload(): string {
  return JSON.stringify({
    data: {
      invokeExtension: { success: true, response: { body: { success: false, error: null } } },
    },
  });
}

function buildRemoteMissingSuccessPayload(): string {
  return JSON.stringify({
    data: {
      invokeExtension: { success: true, response: { body: { success: true, payload: null } } },
    },
  });
}

function buildEntry(options?: {
  method?: string;
  url?: string;
  postDataText?: string;
  responseText?: string;
  responseEncoding?: string;
  contentSize?: number;
  transferSize?: number;
  omitTransferSize?: boolean;
  time?: number;
  getContent?: (callback: (content: string, encoding: string) => void) => void;
}): Entry {
  const entry: Entry = {
    startedDateTime: "2024-01-01T00:00:00.000Z",
    time: options?.time ?? 150,
    request: {
      method: options?.method ?? "POST",
      url: options?.url ?? "https://example.atlassian.net/gateway/api/graphql",
      httpVersion: "HTTP/2.0",
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: 0,
      bodySize: 0,
      ...(options?.postDataText !== undefined
        ? { postData: { mimeType: "application/json", text: options.postDataText } }
        : {}),
    },
    response: {
      status: 200,
      statusText: "OK",
      httpVersion: "HTTP/2.0",
      headers: [],
      cookies: [],
      content: {
        size: options?.contentSize ?? 512,
        mimeType: "application/json",
        ...(options?.responseText !== undefined ? { text: options.responseText } : {}),
        ...(options?.responseEncoding !== undefined ? { encoding: options.responseEncoding } : {}),
      },
      redirectURL: "",
      headersSize: 0,
      bodySize: 0,
      ...(options?.omitTransferSize ? {} : { _transferSize: options?.transferSize ?? 256 }),
    },
    cache: {},
    timings: { send: 0, wait: 150, receive: 0 },
  };
  if (options?.getContent !== undefined) {
    (entry as Browser.devtools.network.Request).getContent = options.getContent;
  }
  return entry;
}

function buildFunctionEntry(options?: {
  call?: unknown;
  requestOptions?: Parameters<typeof buildRequestBody>[1];
  responseText?: string;
  responseEncoding?: string;
  contentSize?: number;
  transferSize?: number;
  omitTransferSize?: boolean;
  time?: number;
  getContent?: (callback: (content: string, encoding: string) => void) => void;
}): Entry {
  return buildEntry({
    postDataText: buildRequestBody(options?.call ?? buildFunctionCall(), options?.requestOptions),
    responseText: options?.responseText,
    responseEncoding: options?.responseEncoding,
    contentSize: options?.contentSize,
    transferSize: options?.transferSize,
    omitTransferSize: options?.omitTransferSize,
    time: options?.time,
    getContent: options?.getContent,
  });
}

function buildRemoteEntry(options?: {
  call?: unknown;
  requestOptions?: Parameters<typeof buildRequestBody>[1];
  responseText?: string;
  contentSize?: number;
  transferSize?: number;
  omitTransferSize?: boolean;
  time?: number;
  getContent?: (callback: (content: string, encoding: string) => void) => void;
}): Entry {
  return buildEntry({
    postDataText: buildRequestBody(options?.call ?? buildRemoteCall(), options?.requestOptions),
    responseText: options?.responseText,
    contentSize: options?.contentSize,
    transferSize: options?.transferSize,
    omitTransferSize: options?.omitTransferSize,
    time: options?.time,
    getContent: options?.getContent,
  });
}

describe("parseHarEntry", () => {
  describe("non-Atlassian requests", () => {
    it("should return null if the entry is undefined", async () => {
      await expect(parseHarEntry(undefined as unknown as Entry)).resolves.toBeNull();
    });

    it("should return null if the entry is null", async () => {
      await expect(parseHarEntry(null as unknown as Entry)).resolves.toBeNull();
    });

    it("should return null if the entry is an empty object", async () => {
      await expect(parseHarEntry({} as unknown as Entry)).resolves.toBeNull();
    });

    it("should return null if the request method is not POST", async () => {
      const entry = buildEntry({ method: "GET" });
      await expect(parseHarEntry(entry)).resolves.toBeNull();
    });

    it("should return null if the request URL is not a valid URL", async () => {
      const entry = buildEntry({
        url: "not-a-url",
        postDataText: JSON.stringify({ operationName: "forge_ui_invokeExtension" }),
      });
      await expect(parseHarEntry(entry)).resolves.toBeNull();
    });

    it("should return null if the request URL does not contain /gateway/api/graphql", async () => {
      const entry = buildEntry({
        url: "https://example.com/api/graphql",
        postDataText: JSON.stringify({ operationName: "forge_ui_invokeExtension" }),
      });
      await expect(parseHarEntry(entry)).resolves.toBeNull();
    });

    it("should return null if the request body is missing", async () => {
      const entry = buildEntry();
      await expect(parseHarEntry(entry)).resolves.toBeNull();
    });

    it("should return null if the request body is not valid JSON", async () => {
      const entry = buildEntry({ postDataText: "not-json" });
      await expect(parseHarEntry(entry)).resolves.toBeNull();
    });

    it("should return null if the operation name is missing", async () => {
      const entry = buildEntry({ postDataText: JSON.stringify({ foo: "bar" }) });
      await expect(parseHarEntry(entry)).resolves.toBeNull();
    });

    it("should return null if the operation name is not a Forge invocation", async () => {
      const entry = buildEntry({ postDataText: JSON.stringify({ operationName: "unknownMutation" }) });
      await expect(parseHarEntry(entry)).resolves.toBeNull();
    });
  });

  describe("valid Atlassian requests", () => {
    it("should accept the forge_ui_invokeExtension operation name", async () => {
      const entry = buildFunctionEntry({
        requestOptions: { operationName: "forge_ui_invokeExtension" },
        responseText: buildFunctionSuccessResponse(),
      });
      await expect(parseHarEntry(entry)).resolves.not.toBeNull();
    });

    it("should accept the useInvokeExtensionRelayMutation operation name", async () => {
      const entry = buildFunctionEntry({
        requestOptions: { operationName: "useInvokeExtensionRelayMutation" },
        responseText: buildFunctionSuccessResponse(),
      });
      await expect(parseHarEntry(entry)).resolves.not.toBeNull();
    });
  });

  describe("invalid requests", () => {
    it("should throw when the request body is missing variables", async () => {
      const entry = buildEntry({ postDataText: buildPartialRequestBody({}) });
      await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
    });

    it("should throw when the request body is missing variables.input", async () => {
      const entry = buildEntry({ postDataText: buildPartialRequestBody({ variables: {} }) });
      await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
    });

    it("should throw when the request body is missing variables.input.payload", async () => {
      const entry = buildEntry({
        postDataText: buildPartialRequestBody({ variables: { input: {} } }),
      });
      await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
    });

    it("should throw when the request body is missing variables.input.payload.call", async () => {
      const entry = buildEntry({
        postDataText: buildPartialRequestBody({ variables: { input: { payload: {} } } }),
      });
      await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
    });

    it("should throw when the call object matches neither the function nor the remote schema", async () => {
      const entry = buildEntry({
        postDataText: buildPartialRequestBody({ variables: { input: { payload: { call: {} } } } }),
      });
      await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
    });
  });

  describe("invalid responses", () => {
    it("should throw when the response body is missing", async () => {
      const entry = buildFunctionEntry();
      await expect(parseHarEntry(entry)).rejects.toThrow("Missing response body");
    });

    it("should throw when the response body is an empty string", async () => {
      const entry = buildFunctionEntry({ responseText: "" });
      await expect(parseHarEntry(entry)).rejects.toThrow("Missing response body");
    });

    it("should throw when the response body is a blank string", async () => {
      const entry = buildFunctionEntry({ responseText: "   " });
      await expect(parseHarEntry(entry)).rejects.toThrow("Missing response body");
    });

    it("should throw when the response body is missing and getContent returns undefined", async () => {
      const entry = buildFunctionEntry({
        getContent: (cb) => cb(undefined as unknown as string, ""),
      });
      await expect(parseHarEntry(entry)).rejects.toThrow("Missing response body");
    });

    it("should throw when the response body is missing and getContent returns null", async () => {
      const entry = buildFunctionEntry({
        getContent: (cb) => cb(null as unknown as string, ""),
      });
      await expect(parseHarEntry(entry)).rejects.toThrow("Missing response body");
    });

    it("should throw when the response body is missing and getContent returns an empty string", async () => {
      const entry = buildFunctionEntry({ getContent: (cb) => cb("", "") });
      await expect(parseHarEntry(entry)).rejects.toThrow("Missing response body");
    });

    it("should throw when the response body is missing and getContent returns a blank string", async () => {
      const entry = buildFunctionEntry({ getContent: (cb) => cb("   ", "") });
      await expect(parseHarEntry(entry)).rejects.toThrow("Missing response body");
    });
  });

  describe("response body", () => {
    it("should get the response body using getContent when content.text is missing", async () => {
      const entry = buildFunctionEntry({
        getContent: (cb) => cb(buildFunctionSuccessResponse({ value: 42 }), ""),
      });
      const result = await parseHarEntry(entry);
      expect(result).not.toBeNull();
    });

    it("should prefer content.text over getContent when both are present", async () => {
      const textBody = buildFunctionSuccessResponse({ source: "content.text" });
      const getContentBody = buildFunctionSuccessResponse({ source: "getContent" });
      const entry = buildFunctionEntry({
        responseText: textBody,
        getContent: (cb) => cb(getContentBody, ""),
      });
      const result = await parseHarEntry(entry);
      expect(result).not.toBeNull();
      expect(result!.parsedResponse).toMatchObject({ type: "invoke", success: true, body: { source: "content.text" } });
    });

    it("should decode a base64-encoded response body", async () => {
      const body = { result: "decoded" };
      const responseJson = buildFunctionSuccessResponse(body);
      const entry = buildFunctionEntry({
        responseText: btoa(responseJson),
        responseEncoding: "base64",
      });
      const result = await parseHarEntry(entry);
      expect(result).not.toBeNull();
    });

    it("should decode a base64-encoded response body provided by getContent", async () => {
      const responseJson = buildFunctionSuccessResponse({ decoded: true });
      const entry = buildFunctionEntry({
        getContent: (cb) => cb(btoa(responseJson), "base64"),
      });
      const result = await parseHarEntry(entry);
      expect(result).not.toBeNull();
    });
  });

  describe("function invocations", () => {
    describe("invalid requests", () => {
      it("should throw when the function call has a null function key", async () => {
        const entry = buildFunctionEntry({
          call: buildFunctionCall({ functionKey: null }),
          responseText: buildFunctionSuccessResponse(),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
      });

      it("should throw when the function call has an invalid function key", async () => {
        const entry = buildFunctionEntry({
          call: buildFunctionCall({ functionKey: 42 }),
          responseText: buildFunctionSuccessResponse(),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
      });
    });

    describe("invalid responses", () => {
      it("should throw when the response body is not valid JSON", async () => {
        const entry = buildFunctionEntry({ responseText: "not-json" });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to parse the response body");
      });

      it("should throw when the response body is missing data", async () => {
        const entry = buildFunctionEntry({ responseText: JSON.stringify({}) });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });

      it("should throw when the response body is missing data.invokeExtension", async () => {
        const entry = buildFunctionEntry({ responseText: JSON.stringify({ data: {} }) });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });

      it("should throw when the response body is missing data.invokeExtension.success", async () => {
        const entry = buildFunctionEntry({
          responseText: JSON.stringify({ data: { invokeExtension: {} } }),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });

      it("should throw when data.invokeExtension.success is not a boolean", async () => {
        const entry = buildFunctionEntry({
          responseText: JSON.stringify({ data: { invokeExtension: { success: "yes" } } }),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });
    });

    describe("error responses", () => {
      it("should return a failed response when invokeExtension.success is false with null errors", async () => {
        const entry = buildFunctionEntry({ responseText: buildFunctionErrorResponse(null) });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invoke",
          success: false,
          errors: [],
        });
      });

      it("should return a failed response when invokeExtension.success is false with no errors", async () => {
        const entry = buildFunctionEntry({ responseText: buildFunctionErrorResponse([]) });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invoke",
          success: false,
          errors: [],
        });
      });

      it("should return a failed response when invokeExtension.success is false with an error", async () => {
        const entry = buildFunctionEntry({
          responseText: buildFunctionErrorResponse([
            { message: "Unauthorized", extensions: { errorType: "AUTH_ERROR", statusCode: 401 } },
          ]),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invoke",
          success: false,
          errors: [{ status: 401, type: "AUTH_ERROR", message: "Unauthorized" }],
        });
      });

      it("should return a failed response when invokeExtension.success is false with multiple errors", async () => {
        const entry = buildFunctionEntry({
          responseText: buildFunctionErrorResponse([
            { message: "Not found", extensions: { errorType: "NOT_FOUND", statusCode: 404 } },
            { message: "Forbidden", extensions: { errorType: "FORBIDDEN", statusCode: 403 } },
          ]),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invoke",
          success: false,
          errors: [
            { status: 404, type: "NOT_FOUND", message: "Not found" },
            { status: 403, type: "FORBIDDEN", message: "Forbidden" },
          ],
        });
      });

      it("should return a MISSING_RESPONSE error when invokeExtension.success is true but the response payload is missing", async () => {
        const entry = buildFunctionEntry({ responseText: buildFunctionMissingResponsePayload() });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invoke",
          success: false,
          errors: [
            {
              status: 500,
              type: "MISSING_RESPONSE",
              message: "Missing response from Forge invocation.",
            },
          ],
        });
      });

      it("should include the correct transferredSize, size, and duration in an error response", async () => {
        const entry = buildFunctionEntry({
          responseText: buildFunctionErrorResponse(null),
          transferSize: 48,
          contentSize: 96,
          time: 250,
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invoke",
          success: false,
          transferredSize: 48,
          size: 96,
          duration: 250,
        });
      });
    });

    describe("success responses", () => {
      it("should return a successful response when the function payload is undefined", async () => {
        const entry = buildFunctionEntry({
          responseText: JSON.stringify({ data: { invokeExtension: { success: true, response: {} } } }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({ type: "invoke", success: true });
        expect((result!.parsedResponse as { body?: unknown }).body).toBeUndefined();
      });

      it("should return a successful response when the function payload is null", async () => {
        const entry = buildFunctionEntry({ responseText: buildFunctionSuccessResponse(null) });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({ type: "invoke", success: true, body: null });
      });

      it("should return a successful response when the function payload is a number", async () => {
        const entry = buildFunctionEntry({ responseText: buildFunctionSuccessResponse(99) });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({ type: "invoke", success: true, body: 99 });
      });

      it("should return a successful response when the function payload is a string", async () => {
        const entry = buildFunctionEntry({ responseText: buildFunctionSuccessResponse("hello") });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({ type: "invoke", success: true, body: "hello" });
      });

      it("should return a successful response when the function payload is an object", async () => {
        const body = { id: 42, status: "Done", labels: ["bug"] };
        const entry = buildFunctionEntry({ responseText: buildFunctionSuccessResponse(body) });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({ type: "invoke", success: true, body });
      });

      it("should include the correct transferredSize, size, and duration in a success response", async () => {
        const entry = buildFunctionEntry({
          responseText: buildFunctionSuccessResponse(),
          transferSize: 128,
          contentSize: 256,
          time: 300,
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invoke",
          transferredSize: 128,
          size: 256,
          duration: 300,
        });
      });

      it("should fall back to content.size for transferredSize when _transferSize is missing", async () => {
        const entry = buildFunctionEntry({
          responseText: buildFunctionSuccessResponse(),
          omitTransferSize: true,
          contentSize: 1024,
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invoke",
          transferredSize: 1024,
          size: 1024,
        });
      });
    });

    describe("parsed requests", () => {
      it("should include all parsed request fields for a function invocation", async () => {
        const context = buildInvocationContext();
        const entry = buildFunctionEntry({
          call: buildFunctionCall({ functionKey: "my-handler", payload: { key: "value" } }),
          requestOptions: { context, extensionId: "ext-xyz-789" },
          responseText: buildFunctionSuccessResponse(),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedRequest).toMatchObject({
          type: "invoke",
          functionKey: "my-handler",
          body: { key: "value" },
          context: {
            siteUrl: context.siteUrl,
            cloudId: context.cloudId,
            appVersion: context.appVersion,
            environmentType: context.environmentType,
            environmentId: context.environmentId,
            moduleKey: context.moduleKey,
            extensionType: context.extension.type,
            extensionId: "ext-xyz-789",
            localId: context.localId,
          },
        });
      });

      it("should set all context fields to undefined when context is null", async () => {
        const entry = buildFunctionEntry({
          requestOptions: { context: null, extensionId: null },
          responseText: buildFunctionSuccessResponse(),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedRequest).toMatchObject({
          type: "invoke",
          context: {
            siteUrl: undefined,
            cloudId: undefined,
            appVersion: undefined,
            environmentType: undefined,
            environmentId: undefined,
            extensionType: undefined,
            extensionId: undefined,
            moduleKey: undefined,
            localId: undefined,
          },
        });
      });

      it("should set extensionType to undefined when extension is null", async () => {
        const context = buildInvocationContext({ extension: null });
        const entry = buildFunctionEntry({
          requestOptions: { context },
          responseText: buildFunctionSuccessResponse(),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedRequest).toMatchObject({
          type: "invoke",
          context: {
            siteUrl: context.siteUrl,
            cloudId: context.cloudId,
            extensionType: undefined,
          },
        });
      });

      it("should set the raw response body in the parsed HAR entry", async () => {
        const responseText = buildFunctionSuccessResponse({ data: "result" });
        const entry = buildFunctionEntry({ getContent: (cb) => cb(responseText, "") });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.response.content.text).toBe(responseText);
      });
    });
  });

  describe("remote invocations", () => {
    describe("invalid requests", () => {
      it("should throw when the request body is missing method", async () => {
        const entry = buildRemoteEntry({
          call: { path: "/rest/api/3/issue", headers: {} },
          responseText: buildRemoteSuccessResponse({ status: 200, headers: {} }),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
      });

      it("should throw when the request body is missing path", async () => {
        const entry = buildRemoteEntry({
          call: { method: "GET", headers: {} },
          responseText: buildRemoteSuccessResponse({ status: 200, headers: {} }),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
      });

      it("should throw when the request body has invalid headers", async () => {
        const entry = buildRemoteEntry({
          call: { method: "GET", path: "/rest/api/3/issue", headers: { "X-Count": 5 } },
          responseText: buildRemoteSuccessResponse({ status: 200, headers: {} }),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the request body");
      });
    });

    describe("invalid responses", () => {
      it("should throw when the response body is not valid JSON", async () => {
        const entry = buildRemoteEntry({ responseText: "not json {{" });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to parse the response body");
      });

      it("should throw when the response body is missing data", async () => {
        const entry = buildRemoteEntry({ responseText: JSON.stringify({ errors: [] }) });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });

      it("should throw when the response body is missing data.invokeExtension", async () => {
        const entry = buildRemoteEntry({ responseText: JSON.stringify({ data: {} }) });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });

      it("should throw when the response body is missing data.invokeExtension.success", async () => {
        const entry = buildRemoteEntry({
          responseText: JSON.stringify({ data: { invokeExtension: {} } }),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });

      it("should throw when data.invokeExtension.success is not a boolean", async () => {
        const entry = buildRemoteEntry({
          responseText: JSON.stringify({ data: { invokeExtension: { success: "yes" } } }),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });

      it("should throw when the response body is missing response.body.success", async () => {
        const entry = buildRemoteEntry({
          responseText: JSON.stringify({
            data: {
              invokeExtension: {
                success: true,
                response: { body: { payload: { status: 200, headers: {}, body: null } } },
              },
            },
          }),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });

      it("should throw when response.body.success is not a boolean", async () => {
        const entry = buildRemoteEntry({
          responseText: JSON.stringify({
            data: {
              invokeExtension: {
                success: true,
                response: { body: { success: "yes", payload: { status: 200, headers: {}, body: null } } },
              },
            },
          }),
        });
        await expect(parseHarEntry(entry)).rejects.toThrow("Failed to validate the response body");
      });
    });

    describe("error responses", () => {
      it("should return a failed response when invokeExtension.success is false with null errors", async () => {
        const entry = buildRemoteEntry({ responseText: buildRemoteForgeErrorResponse(null) });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: false,
          errors: [],
        });
      });

      it("should return a failed response when invokeExtension.success is false with no errors", async () => {
        const entry = buildRemoteEntry({ responseText: buildRemoteForgeErrorResponse([]) });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: false,
          errors: [],
        });
      });

      it("should return a failed response when invokeExtension.success is false with an error", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteForgeErrorResponse([
            { message: "Unauthorized", extensions: { errorType: "AUTH_ERROR", statusCode: 401 } },
          ]),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: false,
          errors: [{ status: 401, type: "AUTH_ERROR", message: "Unauthorized" }],
        });
      });

      it("should return a failed response when invokeExtension.success is false with multiple errors", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteForgeErrorResponse([
            { message: "Not found", extensions: { errorType: "NOT_FOUND", statusCode: 404 } },
            { message: "Forbidden", extensions: { errorType: "FORBIDDEN", statusCode: 403 } },
          ]),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: false,
          errors: [
            { status: 404, type: "NOT_FOUND", message: "Not found" },
            { status: 403, type: "FORBIDDEN", message: "Forbidden" },
          ],
        });
      });

      it("should return a MISSING_RESPONSE error when invokeExtension.success is true but the response payload is missing", async () => {
        const entry = buildRemoteEntry({ responseText: buildRemoteMissingResponsePayload() });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: false,
          errors: [
            {
              status: 500,
              type: "MISSING_RESPONSE",
              message: "Missing response from Forge invocation.",
            },
          ],
        });
      });

      it("should return a MISSING_RESPONSE_ERROR_PAYLOAD error when body.success is false but the error payload is missing", async () => {
        const entry = buildRemoteEntry({ responseText: buildRemoteMissingErrorPayload() });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: false,
          errors: [
            {
              status: 500,
              type: "MISSING_RESPONSE_ERROR_PAYLOAD",
              message: "Missing response error payload from Forge invocation.",
            },
          ],
        });
      });

      it("should return a MISSING_RESPONSE_SUCCESS_PAYLOAD error when body.success is true but the success payload is missing", async () => {
        const entry = buildRemoteEntry({ responseText: buildRemoteMissingSuccessPayload() });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: false,
          errors: [
            {
              status: 500,
              type: "MISSING_RESPONSE_SUCCESS_PAYLOAD",
              message: "Missing response success payload from Forge invocation.",
            },
          ],
        });
      });

      it("should include the correct transferredSize, size, and duration in an error response", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteForgeErrorResponse(null),
          transferSize: 32,
          contentSize: 64,
          time: 180,
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: false,
          transferredSize: 32,
          size: 64,
          duration: 180,
        });
      });
    });

    describe("success responses", () => {
      it("should return a successful response when the remote call fails", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteErrorBodyResponse({
            status: 404,
            headers: { "content-type": ["application/json"] },
            body: { message: "Not Found" },
          }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: true,
          status: 404,
          headers: { "content-type": "application/json" },
          body: { message: "Not Found" },
        });
      });

      it("should return a successful response when the remote call succeeds", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteSuccessResponse({
            status: 200,
            headers: { "content-type": ["application/json"] },
            body: { id: 1, key: "PROJ-1", summary: "Test issue" },
          }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: true,
          status: 200,
          headers: { "content-type": "application/json" },
          body: { id: 1, key: "PROJ-1", summary: "Test issue" },
        });
      });

      it("should return an undefined request body when the remote call has no request body", async () => {
        const entry = buildRemoteEntry({
          call: { method: "GET", path: "/rest/api/3/issue", headers: {} },
          responseText: buildRemoteSuccessResponse({ status: 200, headers: {} }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedRequest).toMatchObject({ type: "invokeRemote", method: "GET" });
        expect((result!.parsedRequest as { body?: unknown }).body).toBeUndefined();
      });

      it("should return an undefined request headers object when the request has no headers", async () => {
        const entry = buildRemoteEntry({
          call: { method: "GET", path: "/rest/api/3/issue" },
          responseText: buildRemoteSuccessResponse({ status: 200, headers: {} }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedRequest).toMatchObject({ type: "invokeRemote", method: "GET" });
        expect((result!.parsedRequest as { headers?: Record<string, string> }).headers).toBeUndefined();
      });

      it("should return an undefined response body when the remote call fails with no response body", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteErrorBodyResponse({ status: 404, headers: {} }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({ type: "invokeRemote", success: true, status: 404 });
        expect((result!.parsedResponse as { body?: unknown }).body).toBeUndefined();
      });

      it("should return an undefined response body when the remote call succeeds with no response body", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteSuccessResponse({ status: 204, headers: {} }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({ type: "invokeRemote", success: true, status: 204 });
        expect((result!.parsedResponse as { body?: unknown }).body).toBeUndefined();
      });

      it("should return an undefined response headers object when the response has no headers", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteSuccessResponse({ status: 200 }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({ type: "invokeRemote", success: true });
        expect((result!.parsedResponse as { headers?: Record<string, string> }).headers).toBeUndefined();
      });

      it("should concatenate multi-value response headers with a comma separator", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteSuccessResponse({
            status: 200,
            headers: {
              "set-cookie": ["sessionId=abc; Path=/", "userId=123; Path=/"],
              "x-custom": ["val1", "val2", "val3"],
            },
          }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          success: true,
          headers: {
            "set-cookie": "sessionId=abc; Path=/, userId=123; Path=/",
            "x-custom": "val1, val2, val3",
          },
        });
      });

      it("should include the correct transferredSize, size, and duration in a success response", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteSuccessResponse({ status: 201, headers: {} }),
          transferSize: 64,
          contentSize: 128,
          time: 200,
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          transferredSize: 64,
          size: 128,
          duration: 200,
        });
      });

      it("should fall back to content.size for transferredSize when _transferSize is missing", async () => {
        const entry = buildRemoteEntry({
          responseText: buildRemoteSuccessResponse({ status: 200, headers: {} }),
          omitTransferSize: true,
          contentSize: 512,
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedResponse).toMatchObject({
          type: "invokeRemote",
          transferredSize: 512,
          size: 512,
        });
      });
    });

    describe("parsed requests", () => {
      it("should include all parsed request fields for a remote invocation", async () => {
        const context = buildInvocationContext();
        const call = buildRemoteCall({
          method: "POST",
          path: "/rest/api/3/issue",
          headers: { "Content-Type": "application/json" },
          body: { summary: "Test issue" },
        });
        const entry = buildRemoteEntry({
          call,
          requestOptions: { context, extensionId: "ext-remote-001" },
          responseText: buildRemoteSuccessResponse({ status: 201, headers: {} }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedRequest).toMatchObject({
          type: "invokeRemote",
          method: "POST",
          path: "/rest/api/3/issue",
          headers: { "Content-Type": "application/json" },
          body: { summary: "Test issue" },
          context: {
            siteUrl: context.siteUrl,
            cloudId: context.cloudId,
            appVersion: context.appVersion,
            environmentType: context.environmentType,
            environmentId: context.environmentId,
            moduleKey: context.moduleKey,
            extensionType: context.extension.type,
            extensionId: "ext-remote-001",
            localId: context.localId,
          },
        });
      });

      it("should set all context fields to undefined when context is null", async () => {
        const entry = buildRemoteEntry({
          requestOptions: { context: null, extensionId: null },
          responseText: buildRemoteSuccessResponse({ status: 200, headers: {} }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedRequest).toMatchObject({
          type: "invokeRemote",
          context: {
            siteUrl: undefined,
            cloudId: undefined,
            appVersion: undefined,
            environmentType: undefined,
            environmentId: undefined,
            extensionType: undefined,
            extensionId: undefined,
            moduleKey: undefined,
            localId: undefined,
          },
        });
      });

      it("should set extensionType to undefined when extension is null", async () => {
        const context = buildInvocationContext({ extension: null });
        const entry = buildRemoteEntry({
          requestOptions: { context },
          responseText: buildRemoteSuccessResponse({ status: 200, headers: {} }),
        });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.parsedRequest).toMatchObject({
          type: "invokeRemote",
          context: {
            siteUrl: context.siteUrl,
            cloudId: context.cloudId,
            extensionType: undefined,
          },
        });
      });

      it("should set the raw response body in the parsed HAR entry", async () => {
        const responseText = buildRemoteSuccessResponse({
          status: 200,
          headers: {},
          body: { result: "ok" },
        });
        const entry = buildRemoteEntry({ responseText });
        const result = await parseHarEntry(entry);
        expect(result).not.toBeNull();
        expect(result!.response.content.text).toBe(responseText);
      });
    });
  });
});
