import { browser } from "#imports";
import type { AtlassianEntry, AtlassianFunctionRequest, AtlassianRemoteRequest } from "@/types/atlassian";
import type { EditableRequest } from "@/types/request-editor";
import type { Header } from "har-format";
import { runInNewContext } from "node:vm";
import { beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { buildEditableHeader, buildEditableRequest, resendRequest, sendRequest } from "./request-utils";

type EvaluationCallback = (result: unknown, exceptionInfo?: unknown) => void;
type EvaluationFunction = (expression: string, callback: EvaluationCallback) => void;

interface FetchOptions {
  method: string;
  headers: Record<string, string>;
  body: string;
  credentials: string;
}

interface SentRequestBody {
  operationName: string;
  query: string;
  variables: {
    input: {
      extensionId?: string;
      payload: {
        call: Record<string, unknown>;
        context?: Record<string, unknown>;
      };
    };
  };
}

const fetchMock = vi.fn();
const textMock = vi.fn();
const evaluate = vi.spyOn(browser.devtools.inspectedWindow, "eval") as unknown as MockInstance<EvaluationFunction>;

function buildRequestContext(overrides?: Record<string, unknown>) {
  return {
    siteUrl: "https://example.atlassian.net",
    cloudId: "cloud-abc-123",
    appVersion: "1.0.0",
    environmentType: "PRODUCTION",
    environmentId: "env-xyz-456",
    extensionType: "jira:issuePanel",
    extensionId: "ext-abc-001",
    moduleKey: "my-jira-module",
    localId: "local-def-789",
    ...overrides,
  };
}

function buildFunctionRequest(overrides?: Partial<AtlassianFunctionRequest>): AtlassianFunctionRequest {
  return {
    type: "invoke",
    functionKey: "my-function",
    body: { input: "data" },
    context: buildRequestContext(),
    ...overrides,
  };
}

function buildRemoteRequest(overrides?: Partial<AtlassianRemoteRequest>): AtlassianRemoteRequest {
  return {
    type: "invokeRemote",
    method: "GET",
    path: "/rest/api/3/issue/PROJ-1",
    headers: { Accept: "application/json" },
    body: { input: "data" },
    context: buildRequestContext(),
    ...overrides,
  };
}

function buildEditableRequestBody(overrides?: Partial<EditableRequest>): EditableRequest {
  return {
    type: "invoke",
    functionKey: "my-function",
    method: "",
    path: "",
    headers: [],
    body: JSON.stringify({ input: "data" }),
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
    ...overrides,
  };
}

function buildPostData(call: unknown, context?: unknown): string {
  return JSON.stringify({
    operationName: "forge_ui_invokeExtension",
    query: "mutation forge_ui_invokeExtension { invokeExtension { success } }",
    variables: {
      input: {
        extensionId: "ext-abc-001",
        payload: { call, context },
      },
    },
  });
}

function buildEntry(options?: {
  url?: string;
  method?: string;
  headers?: Header[];
  postData?: string | null;
  parsedRequest?: AtlassianFunctionRequest | AtlassianRemoteRequest;
}): AtlassianEntry {
  const postData = options?.postData !== undefined ? options.postData : buildPostData({ functionKey: "my-function" });
  return {
    startedDateTime: "2024-01-01T00:00:00.000Z",
    time: 100,
    request: {
      method: options?.method ?? "POST",
      url: options?.url ?? "https://example.atlassian.net/gateway/api/graphql",
      httpVersion: "HTTP/2.0",
      headers: options?.headers ?? [],
      queryString: [],
      cookies: [],
      headersSize: 0,
      bodySize: 0,
      postData: postData != null ? { mimeType: "application/json", text: postData } : undefined,
    },
    response: {
      status: 200,
      statusText: "OK",
      httpVersion: "HTTP/2.0",
      headers: [],
      cookies: [],
      content: { size: 0, mimeType: "application/json" },
      redirectURL: "",
      headersSize: 0,
      bodySize: 0,
    },
    cache: {},
    timings: { send: 0, wait: 100, receive: 0 },
    parsedRequest: options?.parsedRequest ?? buildFunctionRequest(),
    parsedResponse: {
      type: "invoke",
      success: true,
      body: { output: "data" },
      transferredSize: 0,
      size: 0,
      duration: 100,
    },
  };
}

async function runExpression(expression: string): Promise<unknown> {
  return (await runInNewContext(expression, { fetch: fetchMock })) as unknown;
}

function getFetchCall(): [string, FetchOptions] {
  return fetchMock.mock.calls[0] as [string, FetchOptions];
}

function getSentRequestBody(): SentRequestBody {
  return JSON.parse(getFetchCall()[1].body) as SentRequestBody;
}

beforeEach(() => {
  vi.clearAllMocks();
  textMock.mockResolvedValue("{}");
  fetchMock.mockResolvedValue({ text: textMock });
  evaluate.mockImplementation((expression, callback) => {
    void runExpression(expression).then((result) => {
      callback(result, undefined);
    });
  });
});

describe("buildEditableHeader", () => {
  it("should build an enabled header with an empty name and value", () => {
    const header = buildEditableHeader();
    expect(header).toEqual({
      id: expect.any(String) as string,
      isEnabled: true,
      name: "",
      value: "",
    });
  });

  it("should build headers with unique identifiers", () => {
    expect(buildEditableHeader().id).not.toBe(buildEditableHeader().id);
  });
});

describe("buildEditableRequest", () => {
  it("should convert a function invocation", () => {
    const entry = buildEntry({ parsedRequest: buildFunctionRequest() });
    expect(buildEditableRequest(entry)).toEqual({
      type: "invoke",
      functionKey: "my-function",
      method: "",
      path: "",
      headers: [],
      body: JSON.stringify({ input: "data" }, null, 2),
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

  it("should convert a remote invocation", () => {
    const entry = buildEntry({ parsedRequest: buildRemoteRequest() });
    const request = buildEditableRequest(entry);
    expect(request.type).toBe("invokeRemote");
    expect(request.functionKey).toBe("");
    expect(request.method).toBe("GET");
    expect(request.path).toBe("/rest/api/3/issue/PROJ-1");
    expect(request.headers).toEqual([
      { id: expect.any(String) as string, isEnabled: true, name: "Accept", value: "application/json" },
    ]);
  });

  it("should convert a remote invocation without headers", () => {
    const entry = buildEntry({ parsedRequest: buildRemoteRequest({ headers: undefined }) });
    expect(buildEditableRequest(entry).headers).toEqual([]);
  });

  it("should keep a string body as is", () => {
    const entry = buildEntry({ parsedRequest: buildFunctionRequest({ body: "raw body" }) });
    expect(buildEditableRequest(entry).body).toBe("raw body");
  });

  it("should convert a missing body to an empty string", () => {
    const entry = buildEntry({ parsedRequest: buildFunctionRequest({ body: undefined }) });
    expect(buildEditableRequest(entry).body).toBe("");
  });

  it("should convert missing context fields to empty strings", () => {
    const entry = buildEntry({ parsedRequest: buildFunctionRequest({ context: {} }) });
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
  it("should resend the original request", async () => {
    const postData = buildPostData({ functionKey: "my-function" }, { cloudId: "cloud-abc-123" });
    const entry = buildEntry({ url: "https://example.atlassian.net/gateway/api/graphql", postData });

    await resendRequest(entry);

    expect(fetchMock).toHaveBeenCalledWith("https://example.atlassian.net/gateway/api/graphql", {
      method: "POST",
      headers: {},
      body: postData,
      credentials: "include",
    });
  });

  it("should read the response body", async () => {
    await resendRequest(buildEntry());
    expect(textMock).toHaveBeenCalled();
  });

  it("should forward the allowed request headers", async () => {
    const entry = buildEntry({
      headers: [
        { name: "content-type", value: "application/json" },
        { name: "X-Custom-Header", value: "custom-value" },
      ],
    });

    await resendRequest(entry);

    expect(getFetchCall()[1].headers).toEqual({
      "content-type": "application/json",
      "X-Custom-Header": "custom-value",
    });
  });

  it("should filter out the forbidden request headers", async () => {
    const entry = buildEntry({
      headers: [
        { name: ":authority", value: "example.atlassian.net" },
        { name: "Accept-Encoding", value: "gzip" },
        { name: "content-length", value: "42" },
        { name: "Cookie", value: "session=abc" },
        { name: "host", value: "example.atlassian.net" },
        { name: "origin", value: "https://example.atlassian.net" },
        { name: "proxy-authorization", value: "secret" },
        { name: "sec-fetch-mode", value: "cors" },
        { name: "content-type", value: "application/json" },
      ],
    });

    await resendRequest(entry);

    expect(getFetchCall()[1].headers).toEqual({ "content-type": "application/json" });
  });

  it("should throw if the request has no post data", async () => {
    await expect(resendRequest(buildEntry({ postData: null }))).rejects.toThrow("Missing request body");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should throw if the request body is blank", async () => {
    await expect(resendRequest(buildEntry({ postData: "  " }))).rejects.toThrow("Missing request body");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should throw if the evaluation fails", async () => {
    evaluate.mockImplementation((_expression, callback) => {
      callback(undefined, { isError: true, code: "E_NOTFOUND", description: "Failed to reach the inspected window" });
    });

    await expect(resendRequest(buildEntry())).rejects.toThrow("Failed to reach the inspected window");
  });

  it("should throw if the evaluated code throws an exception", async () => {
    evaluate.mockImplementation((_expression, callback) => {
      callback(undefined, { isException: true, value: "ReferenceError: fetch is not defined" });
    });

    await expect(resendRequest(buildEntry())).rejects.toThrow("ReferenceError: fetch is not defined");
  });

  it("should throw if the request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(resendRequest(buildEntry())).rejects.toThrow("TypeError: Failed to fetch");
  });

  it("should throw if the response body cannot be read", async () => {
    textMock.mockRejectedValue(new Error("Body already consumed"));
    await expect(resendRequest(buildEntry())).rejects.toThrow("Body already consumed");
  });
});

describe("sendRequest", () => {
  it("should send an edited function invocation", async () => {
    const entry = buildEntry();
    const request = buildEditableRequestBody({
      functionKey: "my-edited-function",
      body: JSON.stringify({ input: "edited" }),
    });

    await sendRequest(entry, request);

    expect(getFetchCall()[0]).toBe("https://example.atlassian.net/gateway/api/graphql");
    expect(getFetchCall()[1].method).toBe("POST");
    expect(getSentRequestBody().variables.input.payload.call).toEqual({
      functionKey: "my-edited-function",
      payload: { input: "edited" },
    });
  });

  it("should send an edited remote invocation", async () => {
    const entry = buildEntry();
    const request = buildEditableRequestBody({
      type: "invokeRemote",
      method: "POST",
      path: "/rest/api/3/issue",
      headers: [
        { id: "1", isEnabled: true, name: "Accept", value: "application/json" },
        { id: "2", isEnabled: false, name: "X-Disabled-Header", value: "disabled-value" },
        { id: "3", isEnabled: true, name: "  ", value: "unnamed-value" },
      ],
      body: JSON.stringify({ summary: "My issue" }),
    });

    await sendRequest(entry, request);

    expect(getSentRequestBody().variables.input.payload.call).toEqual({
      method: "POST",
      path: "/rest/api/3/issue",
      headers: { Accept: "application/json" },
      body: { summary: "My issue" },
    });
  });

  it("should keep the operation name and the query of the original request", async () => {
    const entry = buildEntry();

    await sendRequest(entry, buildEditableRequestBody());

    expect(getSentRequestBody().operationName).toBe("forge_ui_invokeExtension");
    expect(getSentRequestBody().query).toBe("mutation forge_ui_invokeExtension { invokeExtension { success } }");
  });

  it("should send the edited context", async () => {
    const entry = buildEntry();
    const request = buildEditableRequestBody({
      context: {
        cloudId: "cloud-edited",
        siteUrl: "https://edited.atlassian.net",
        appVersion: "2.0.0",
        environmentType: "DEVELOPMENT",
        environmentId: "env-edited",
        extensionType: "jira:globalPage",
        extensionId: "ext-edited",
        moduleKey: "my-edited-module",
        localId: "local-edited",
      },
    });

    await sendRequest(entry, request);

    expect(getSentRequestBody().variables.input.extensionId).toBe("ext-edited");
    expect(getSentRequestBody().variables.input.payload.context).toEqual({
      cloudId: "cloud-edited",
      siteUrl: "https://edited.atlassian.net",
      appVersion: "2.0.0",
      environmentType: "DEVELOPMENT",
      environmentId: "env-edited",
      extension: { type: "jira:globalPage" },
      moduleKey: "my-edited-module",
      localId: "local-edited",
    });
  });

  it("should omit the blank context fields", async () => {
    const entry = buildEntry();
    const request = buildEditableRequestBody({
      context: {
        cloudId: "cloud-abc-123",
        siteUrl: "",
        appVersion: "",
        environmentType: "",
        environmentId: "",
        extensionType: "",
        extensionId: "",
        moduleKey: "",
        localId: "",
      },
    });

    await sendRequest(entry, request);

    expect(getSentRequestBody().variables.input.payload.context).toEqual({ cloudId: "cloud-abc-123" });
    expect(getSentRequestBody().variables.input.extensionId).toBeUndefined();
  });

  it("should keep a body that is not valid JSON as a string", async () => {
    const entry = buildEntry();
    const request = buildEditableRequestBody({ body: "not json" });

    await sendRequest(entry, request);

    expect(getSentRequestBody().variables.input.payload.call).toEqual({
      functionKey: "my-function",
      payload: "not json",
    });
  });

  it("should omit a blank body", async () => {
    const entry = buildEntry();
    const request = buildEditableRequestBody({ body: "  " });

    await sendRequest(entry, request);

    expect(getSentRequestBody().variables.input.payload.call).toEqual({ functionKey: "my-function" });
  });

  it("should read the response body", async () => {
    await sendRequest(buildEntry(), buildEditableRequestBody());
    expect(textMock).toHaveBeenCalled();
  });

  it("should throw if the request has no post data", async () => {
    const entry = buildEntry({ postData: null });
    await expect(sendRequest(entry, buildEditableRequestBody())).rejects.toThrow("Missing request body");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should throw if the request body is not valid JSON", async () => {
    const entry = buildEntry({ postData: "not json" });
    await expect(sendRequest(entry, buildEditableRequestBody())).rejects.toThrow("Failed to parse the request body");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should throw if the request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(sendRequest(buildEntry(), buildEditableRequestBody())).rejects.toThrow("TypeError: Failed to fetch");
  });
});
