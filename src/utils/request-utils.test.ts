import type { AtlassianEntry, AtlassianRequest } from "@/types/atlassian";
import type { EditableRequest } from "@/types/request-editor";
import { browser } from "#imports";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { buildEditableRequest, createEditableHeader, resendRequest, sendRequest } from "./request-utils";

interface SentBody {
  operationName?: string;
  query?: string;
  variables: {
    input: {
      extensionId?: string;
      payload: {
        call: Record<string, unknown>;
        context: Record<string, unknown>;
      };
    };
  };
}

let evalSpy: MockInstance;

const URL = "https://example.atlassian.net/gateway/api/graphql";

function buildContext(overrides?: Record<string, unknown>) {
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

function buildRequestBody(call: unknown, options?: { context?: unknown; extensionId?: string | null }): string {
  return JSON.stringify({
    operationName: "forge_ui_invokeExtension",
    query: "mutation forge_ui_invokeExtension { invokeExtension }",
    variables: {
      input: {
        extensionId: options?.extensionId !== undefined ? options.extensionId : "ext-abc-001",
        payload: {
          call,
          context: options?.context !== undefined ? options.context : buildContext(),
        },
      },
    },
  });
}

function buildEntry(options: {
  parsedRequest: AtlassianRequest;
  postDataText?: string;
  headers?: { name: string; value: string }[];
}): AtlassianEntry {
  return {
    startedDateTime: "2024-01-01T00:00:00.000Z",
    time: 150,
    request: {
      method: "POST",
      url: URL,
      httpVersion: "HTTP/2.0",
      headers: options.headers ?? [{ name: "Content-Type", value: "application/json" }],
      queryString: [],
      cookies: [],
      headersSize: 0,
      bodySize: 0,
      ...(options.postDataText !== undefined
        ? { postData: { mimeType: "application/json", text: options.postDataText } }
        : {}),
    },
    response: {
      status: 200,
      statusText: "OK",
      httpVersion: "HTTP/2.0",
      headers: [],
      cookies: [],
      content: { size: 512, mimeType: "application/json" },
      redirectURL: "",
      headersSize: 0,
      bodySize: 0,
    },
    cache: {},
    timings: { send: 0, wait: 150, receive: 0 },
    parsedRequest: options.parsedRequest,
    parsedResponse: {
      type: options.parsedRequest.type,
      success: true,
      transferredSize: 256,
      size: 512,
      duration: 150,
    } as AtlassianEntry["parsedResponse"],
  };
}

function buildFunctionEntry(body: unknown = { input: "data" }): AtlassianEntry {
  return buildEntry({
    parsedRequest: {
      type: "invoke",
      functionKey: "my-function",
      body,
      context: {
        siteUrl: "https://example.atlassian.net",
        cloudId: "cloud-abc-123",
        appVersion: "1.0.0",
        environmentType: "PRODUCTION",
        environmentId: "env-xyz-456",
        extensionType: "jira:issuePanel",
        extensionId: "ext-abc-001",
        moduleKey: "my-jira-module",
        localId: "local-def-789",
      },
    },
    postDataText: buildRequestBody({ functionKey: "my-function", payload: body }),
  });
}

function buildRemoteEntry(body: unknown = { title: "Hello" }): AtlassianEntry {
  return buildEntry({
    parsedRequest: {
      type: "invokeRemote",
      method: "GET",
      path: "/rest/api/3/issue/PROJ-1",
      headers: { Accept: "application/json" },
      body,
      context: {
        siteUrl: "https://example.atlassian.net",
        cloudId: "cloud-abc-123",
        appVersion: "1.0.0",
        environmentType: "PRODUCTION",
        environmentId: "env-xyz-456",
        extensionType: "jira:issuePanel",
        extensionId: "ext-abc-001",
        moduleKey: "my-jira-module",
        localId: "local-def-789",
      },
    },
    postDataText: buildRequestBody({
      method: "GET",
      path: "/rest/api/3/issue/PROJ-1",
      headers: { Accept: "application/json" },
      body,
    }),
  });
}

function getSentRequest() {
  const expression = evalSpy.mock.calls[0]?.[0] as string;
  const match = /^fetch\((".*?"), (\{.*\})\)$/s.exec(expression);
  if (match == null) {
    throw new Error(`Unexpected expression: ${expression}`);
  }
  const url = JSON.parse(match[1]!) as string;
  const options = JSON.parse(match[2]!) as { method: string; credentials: string; headers: unknown; body: string };
  return { url, options, body: JSON.parse(options.body) as SentBody };
}

beforeEach(() => {
  evalSpy = vi.spyOn(browser.devtools.inspectedWindow, "eval").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createEditableHeader", () => {
  it("should create an empty enabled header", () => {
    const header = createEditableHeader();
    expect(header).toEqual({ id: expect.any(String) as string, isEnabled: true, name: "", value: "" });
  });

  it("should create headers with unique identifiers", () => {
    expect(createEditableHeader().id).not.toBe(createEditableHeader().id);
  });
});

describe("buildEditableRequest", () => {
  it("should build an editable function request", () => {
    expect(buildEditableRequest(buildFunctionEntry())).toEqual({
      type: "invoke",
      functionKey: "my-function",
      method: "",
      path: "",
      headers: [],
      body: '{\n  "input": "data"\n}',
      context: {
        cloudId: "cloud-abc-123",
        siteUrl: "https://example.atlassian.net",
        appVersion: "1.0.0",
        environmentType: "PRODUCTION",
        environmentId: "env-xyz-456",
        extensionType: "jira:issuePanel",
        extensionId: "ext-abc-001",
        moduleKey: "my-jira-module",
        localId: "local-def-789",
      },
    });
  });

  it("should build an editable remote request", () => {
    const request = buildEditableRequest(buildRemoteEntry());
    expect(request.type).toBe("invokeRemote");
    expect(request.method).toBe("GET");
    expect(request.path).toBe("/rest/api/3/issue/PROJ-1");
    expect(request.functionKey).toBe("");
    expect(request.headers).toEqual([
      { id: expect.any(String) as string, isEnabled: true, name: "Accept", value: "application/json" },
    ]);
  });

  it("should keep a string body as-is", () => {
    expect(buildEditableRequest(buildRemoteEntry("raw text")).body).toBe("raw text");
  });

  it("should build an empty body when there is no body", () => {
    expect(buildEditableRequest(buildRemoteEntry(null)).body).toBe("");
  });

  it("should build empty context values when the context is empty", () => {
    const entry = buildEntry({
      parsedRequest: { type: "invoke", functionKey: "my-function", context: {} },
      postDataText: buildRequestBody({ functionKey: "my-function" }, { context: null }),
    });
    expect(buildEditableRequest(entry).context).toEqual({
      cloudId: "",
      siteUrl: "",
      appVersion: "",
      environmentType: "",
      environmentId: "",
      extensionType: "",
      extensionId: "",
      moduleKey: "",
      localId: "",
    });
  });
});

describe("resendRequest", () => {
  it("should send the original request body", async () => {
    const entry = buildRemoteEntry();
    await resendRequest(entry);

    const { url, options } = getSentRequest();
    expect(url).toBe(URL);
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
    expect(options.body).toBe(entry.request.postData?.text);
  });

  it("should filter out forbidden headers", async () => {
    await resendRequest(
      buildEntry({
        parsedRequest: buildRemoteEntry().parsedRequest,
        postDataText: buildRequestBody({ method: "GET", path: "/rest/api/3/myself" }),
        headers: [
          { name: "Content-Type", value: "application/json" },
          { name: "Cookie", value: "session=secret" },
          { name: "Origin", value: "https://example.atlassian.net" },
          { name: ":authority", value: "example.atlassian.net" },
          { name: "Sec-Fetch-Mode", value: "cors" },
          { name: "X-Custom", value: "kept" },
        ],
      }),
    );

    expect(getSentRequest().options.headers).toEqual({
      "Content-Type": "application/json",
      "X-Custom": "kept",
    });
  });

  it("should reject when the request body is missing", async () => {
    await expect(resendRequest(buildEntry({ parsedRequest: buildFunctionEntry().parsedRequest }))).rejects.toThrow(
      "Missing request body",
    );
    expect(evalSpy).not.toHaveBeenCalled();
  });
});

describe("sendRequest", () => {
  function buildEditedRequest(overrides?: Partial<EditableRequest>): EditableRequest {
    return {
      ...buildEditableRequest(buildRemoteEntry()),
      ...overrides,
    };
  }

  it("should send the edited method, path, headers and body", async () => {
    const entry = buildRemoteEntry();
    await sendRequest(entry, {
      ...buildEditedRequest(),
      method: "POST",
      path: "/rest/api/3/issue",
      headers: [
        { id: "1", isEnabled: true, name: "Accept", value: "application/json" },
        { id: "2", isEnabled: false, name: "X-Disabled", value: "nope" },
        { id: "3", isEnabled: true, name: "  ", value: "blank" },
      ],
      body: '{"title":"World"}',
    });

    expect(getSentRequest().body).toMatchObject({
      variables: {
        input: {
          payload: {
            call: {
              method: "POST",
              path: "/rest/api/3/issue",
              headers: { Accept: "application/json" },
              body: { title: "World" },
            },
          },
        },
      },
    });
  });

  it("should preserve the GraphQL operation and query", async () => {
    const entry = buildRemoteEntry();
    await sendRequest(entry, buildEditedRequest());

    expect(getSentRequest().body).toMatchObject({
      operationName: "forge_ui_invokeExtension",
      query: "mutation forge_ui_invokeExtension { invokeExtension }",
    });
  });

  it("should send the edited function key and payload", async () => {
    const entry = buildFunctionEntry();
    await sendRequest(entry, {
      ...buildEditableRequest(entry),
      functionKey: "other-function",
      body: '{"input":"other"}',
    });

    expect(getSentRequest().body).toMatchObject({
      variables: {
        input: {
          payload: {
            call: { functionKey: "other-function", payload: { input: "other" } },
          },
        },
      },
    });
  });

  it("should send the edited context", async () => {
    const entry = buildRemoteEntry();
    const editedRequest = buildEditableRequest(entry);
    await sendRequest(entry, {
      ...editedRequest,
      context: { ...editedRequest.context, cloudId: "cloud-other", extensionType: "jira:globalPage" },
    });

    expect(getSentRequest().body).toMatchObject({
      variables: {
        input: {
          extensionId: "ext-abc-001",
          payload: {
            context: { cloudId: "cloud-other", extension: { type: "jira:globalPage" } },
          },
        },
      },
    });
  });

  it("should omit blank context values", async () => {
    const entry = buildRemoteEntry();
    const editedRequest = buildEditableRequest(entry);
    await sendRequest(entry, {
      ...editedRequest,
      context: { ...editedRequest.context, cloudId: "", extensionId: "" },
    });

    const { input } = getSentRequest().body.variables;
    expect(input).not.toHaveProperty("extensionId");
    expect(input.payload.context).not.toHaveProperty("cloudId");
  });

  it("should send a string body when the original body was a string", async () => {
    const entry = buildRemoteEntry("raw text");
    await sendRequest(entry, { ...buildEditableRequest(entry), body: '{"title":"World"}' });

    expect(getSentRequest().body).toMatchObject({
      variables: { input: { payload: { call: { body: '{"title":"World"}' } } } },
    });
  });

  it("should send a string body when the edited body is not valid JSON", async () => {
    const entry = buildRemoteEntry();
    await sendRequest(entry, { ...buildEditableRequest(entry), body: "not json" });

    expect(getSentRequest().body).toMatchObject({
      variables: { input: { payload: { call: { body: "not json" } } } },
    });
  });

  it("should omit the body when the edited body is blank", async () => {
    const entry = buildRemoteEntry();
    await sendRequest(entry, { ...buildEditableRequest(entry), body: "  " });

    expect(getSentRequest().body.variables.input.payload.call).not.toHaveProperty("body");
  });

  it("should omit the headers when no header is enabled", async () => {
    const entry = buildRemoteEntry();
    const editedRequest = buildEditableRequest(entry);
    await sendRequest(entry, {
      ...editedRequest,
      headers: editedRequest.headers.map((header) => ({ ...header, isEnabled: false })),
    });

    expect(getSentRequest().body.variables.input.payload.call).not.toHaveProperty("headers");
  });

  it("should reject when the request body is missing", async () => {
    const entry = buildEntry({ parsedRequest: buildRemoteEntry().parsedRequest });
    await expect(sendRequest(entry, buildEditedRequest())).rejects.toThrow("Missing request body");
    expect(evalSpy).not.toHaveBeenCalled();
  });

  it("should reject when the request body cannot be parsed", async () => {
    const entry = buildEntry({ parsedRequest: buildRemoteEntry().parsedRequest, postDataText: "{ invalid" });
    await expect(sendRequest(entry, buildEditedRequest())).rejects.toThrow("Failed to parse the request body");
    expect(evalSpy).not.toHaveBeenCalled();
  });
});
