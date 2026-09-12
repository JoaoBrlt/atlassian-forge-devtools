import type { ForgeTrpcRequest, ForgeTrpcResponse } from "@/schemas/forge-trpc";
import type {
  AtlassianFunctionErrorResponse,
  AtlassianFunctionRequest,
  AtlassianFunctionSuccessResponse,
  AtlassianRemoteErrorResponse,
  AtlassianRemoteRequest,
  AtlassianRemoteSuccessResponse,
  AtlassianRequest,
  AtlassianRequestContext,
  AtlassianResponse,
} from "@/types/atlassian";
import { describe, expect, it } from "vitest";
import { isForgeTrpcRequest, isForgeTrpcResponse } from "./forge-trpc-utils";

function buildRequestContext(overrides?: Partial<AtlassianRequestContext>): AtlassianRequestContext {
  return {
    siteUrl: "https://example.atlassian.net",
    cloudId: "cloud-abc-123",
    extensionId: "ext-abc-001",
    moduleKey: "my-jira-module",
    ...overrides,
  };
}

function buildTrpcRequest(overrides?: Partial<ForgeTrpcRequest>): ForgeTrpcRequest {
  return {
    type: "query",
    path: "issue.getById",
    input: { id: "PROJ-1" },
    isBatchCall: false,
    ...overrides,
  };
}

function buildTrpcSuccessResponse(data: unknown = { id: "PROJ-1" }): ForgeTrpcResponse {
  return { result: { data } };
}

function buildTrpcErrorResponse(error: unknown = { message: "Procedure failed" }): ForgeTrpcResponse {
  return { error };
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

function buildFunctionSuccessResponse(
  overrides?: Partial<AtlassianFunctionSuccessResponse>,
): AtlassianFunctionSuccessResponse {
  return {
    type: "invoke",
    success: true,
    body: { output: "data" },
    transferredSize: 256,
    size: 512,
    duration: 150,
    ...overrides,
  };
}

function buildFunctionErrorResponse(
  overrides?: Partial<AtlassianFunctionErrorResponse>,
): AtlassianFunctionErrorResponse {
  return {
    type: "invoke",
    success: false,
    errors: [{ status: 500, type: "INTERNAL_ERROR", message: "Something went wrong" }],
    transferredSize: 256,
    size: 512,
    duration: 150,
    ...overrides,
  };
}

function buildRemoteSuccessResponse(
  overrides?: Partial<AtlassianRemoteSuccessResponse>,
): AtlassianRemoteSuccessResponse {
  return {
    type: "invokeRemote",
    success: true,
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: { output: "data" },
    transferredSize: 256,
    size: 512,
    duration: 150,
    ...overrides,
  };
}

function buildRemoteErrorResponse(overrides?: Partial<AtlassianRemoteErrorResponse>): AtlassianRemoteErrorResponse {
  return {
    type: "invokeRemote",
    success: false,
    errors: [{ status: 500, type: "INTERNAL_ERROR", message: "Something went wrong" }],
    transferredSize: 256,
    size: 512,
    duration: 150,
    ...overrides,
  };
}

describe("isForgeTrpcRequest", () => {
  it("should return true for a function request carrying a tRPC query", () => {
    const request = buildFunctionRequest({ trpc: buildTrpcRequest({ type: "query" }) });
    expect(isForgeTrpcRequest(request)).toBe(true);
  });

  it("should return true for a function request carrying a tRPC mutation", () => {
    const request = buildFunctionRequest({ trpc: buildTrpcRequest({ type: "mutation" }) });
    expect(isForgeTrpcRequest(request)).toBe(true);
  });

  it("should return true for a function request carrying a tRPC subscription", () => {
    const request = buildFunctionRequest({ trpc: buildTrpcRequest({ type: "subscription" }) });
    expect(isForgeTrpcRequest(request)).toBe(true);
  });

  it("should return true for a function request carrying a batched tRPC call", () => {
    const request = buildFunctionRequest({ trpc: buildTrpcRequest({ isBatchCall: true }) });
    expect(isForgeTrpcRequest(request)).toBe(true);
  });

  it("should return true for a function request carrying a tRPC call without input", () => {
    const request = buildFunctionRequest({ trpc: buildTrpcRequest({ input: undefined }) });
    expect(isForgeTrpcRequest(request)).toBe(true);
  });

  it("should return false for a function request without a tRPC call", () => {
    const request = buildFunctionRequest();
    expect(isForgeTrpcRequest(request)).toBe(false);
  });

  it("should return false for a function request with an undefined tRPC call", () => {
    const request = buildFunctionRequest({ trpc: undefined });
    expect(isForgeTrpcRequest(request)).toBe(false);
  });

  it("should return false for a function request with a null tRPC call", () => {
    const request = buildFunctionRequest({ trpc: null as unknown as ForgeTrpcRequest });
    expect(isForgeTrpcRequest(request)).toBe(false);
  });

  it("should return false for a remote request", () => {
    const request = buildRemoteRequest();
    expect(isForgeTrpcRequest(request)).toBe(false);
  });

  it("should return false for a remote request carrying a tRPC call", () => {
    const request = { ...buildRemoteRequest(), trpc: buildTrpcRequest() } as unknown as AtlassianRequest;
    expect(isForgeTrpcRequest(request)).toBe(false);
  });

  it("should narrow the request to a function request carrying a tRPC call", () => {
    const request: AtlassianRequest = buildFunctionRequest({ trpc: buildTrpcRequest({ path: "issue.list" }) });
    expect(isForgeTrpcRequest(request) && request.trpc.path).toBe("issue.list");
  });
});

describe("isForgeTrpcResponse", () => {
  it("should return true for a successful function response carrying a tRPC result", () => {
    const response = buildFunctionSuccessResponse({ trpc: buildTrpcSuccessResponse() });
    expect(isForgeTrpcResponse(response)).toBe(true);
  });

  it("should return true for a successful function response carrying a tRPC result without data", () => {
    const response = buildFunctionSuccessResponse({ trpc: { result: {} } });
    expect(isForgeTrpcResponse(response)).toBe(true);
  });

  it("should return true for a successful function response carrying a tRPC error", () => {
    const response = buildFunctionSuccessResponse({ trpc: buildTrpcErrorResponse() });
    expect(isForgeTrpcResponse(response)).toBe(true);
  });

  it("should return false for a successful function response without a tRPC response", () => {
    const response = buildFunctionSuccessResponse();
    expect(isForgeTrpcResponse(response)).toBe(false);
  });

  it("should return false for a successful function response with an undefined tRPC response", () => {
    const response = buildFunctionSuccessResponse({ trpc: undefined });
    expect(isForgeTrpcResponse(response)).toBe(false);
  });

  it("should return false for a successful function response with a null tRPC response", () => {
    const response = buildFunctionSuccessResponse({ trpc: null as unknown as ForgeTrpcResponse });
    expect(isForgeTrpcResponse(response)).toBe(false);
  });

  it("should return false for a failed function response", () => {
    const response = buildFunctionErrorResponse();
    expect(isForgeTrpcResponse(response)).toBe(false);
  });

  it("should return false for a failed function response carrying a tRPC response", () => {
    const response = {
      ...buildFunctionErrorResponse(),
      trpc: buildTrpcErrorResponse(),
    } as unknown as AtlassianResponse;
    expect(isForgeTrpcResponse(response)).toBe(false);
  });

  it("should return false for a successful remote response", () => {
    const response = buildRemoteSuccessResponse();
    expect(isForgeTrpcResponse(response)).toBe(false);
  });

  it("should return false for a successful remote response carrying a tRPC response", () => {
    const response = {
      ...buildRemoteSuccessResponse(),
      trpc: buildTrpcSuccessResponse(),
    } as unknown as AtlassianResponse;
    expect(isForgeTrpcResponse(response)).toBe(false);
  });

  it("should return false for a failed remote response", () => {
    const response = buildRemoteErrorResponse();
    expect(isForgeTrpcResponse(response)).toBe(false);
  });

  it("should narrow the response to a successful function response carrying a tRPC response", () => {
    const response: AtlassianResponse = buildFunctionSuccessResponse({
      trpc: buildTrpcSuccessResponse({ id: "PROJ-1" }),
    });
    expect(isForgeTrpcResponse(response) && response.trpc).toEqual({ result: { data: { id: "PROJ-1" } } });
  });
});
