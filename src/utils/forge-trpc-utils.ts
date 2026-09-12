import type { ForgeTrpcRequest, ForgeTrpcResponse } from "@/schemas/forge-trpc";
import type {
  AtlassianFunctionRequest,
  AtlassianFunctionSuccessResponse,
  AtlassianRequest,
  AtlassianResponse,
} from "@/types/atlassian";

/**
 * Indicates whether the given parsed Atlassian request is a Forge tRPC request.
 * See: https://github.com/toolsplus/forge-trpc
 * @param request the parsed Atlassian request
 * @return true if the request is a Forge tRPC request, false otherwise
 */
export function isForgeTrpcRequest(
  request: AtlassianRequest,
): request is AtlassianFunctionRequest & { trpc: ForgeTrpcRequest } {
  return request.type === "invoke" && request.trpc != null;
}

/**
 * Indicates whether the given parsed Atlassian response is a Forge tRPC response.
 * See: https://github.com/toolsplus/forge-trpc
 * @param response the parsed Atlassian response
 * @return true if the response is a Forge tRPC response, false otherwise
 */
export function isForgeTrpcResponse(
  response: AtlassianResponse,
): response is AtlassianFunctionSuccessResponse & { trpc: ForgeTrpcResponse } {
  return response.type === "invoke" && response.success && response.trpc != null;
}
