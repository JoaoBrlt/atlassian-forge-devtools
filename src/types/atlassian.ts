import { Entry } from "har-format";

/**
 * Represents the HAR entry of an Atlassian Forge extension invocation.
 */
export interface AtlassianEntry<RequestType = unknown, ResponseType = unknown> extends Entry {
  parsedRequest: AtlassianRequest<RequestType>;
  parsedResponse: AtlassianResponse<ResponseType>;
}

/**
 * Represents the parsed request of an Atlassian Forge extension invocation.
 */
export type AtlassianRequest<RequestType = unknown> =
  | AtlassianFunctionRequest<RequestType>
  | AtlassianRemoteRequest<RequestType>;

/**
 * Represents the parsed request of an Atlassian Forge function invocation.
 */
export interface AtlassianFunctionRequest<RequestType = unknown> {
  type: "invoke";
  functionKey: string;
  body?: RequestType;
  context: AtlassianRequestContext;
}

/**
 * Represents the parsed request of an Atlassian Forge remote invocation.
 */
export interface AtlassianRemoteRequest<RequestType = unknown> {
  type: "invokeRemote";
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: RequestType;
  context: AtlassianRequestContext;
}

/**
 * Represents the context of an Atlassian Forge extension invocation.
 */
export interface AtlassianRequestContext {
  siteUrl?: string;
  cloudId?: string;
  appVersion?: string;
  environmentType?: string;
  environmentId?: string;
  extensionType?: string;
  extensionId?: string;
  moduleKey?: string;
  localId?: string;
}

/**
 * Represents the parsed response of an Atlassian Forge extension invocation.
 */
export type AtlassianResponse<ResponseType = unknown> =
  | AtlassianFunctionResponse<ResponseType>
  | AtlassianRemoteResponse<ResponseType>;

/**
 * Represents the parsed response of an Atlassian Forge function invocation.
 */
export type AtlassianFunctionResponse<ResponseType = unknown> =
  | AtlassianFunctionSuccessResponse<ResponseType>
  | AtlassianFunctionErrorResponse;

/**
 * Represents the parsed response of a successful Atlassian Forge function invocation.
 */
export interface AtlassianFunctionSuccessResponse<ResponseType = unknown> {
  type: "invoke";
  success: true;
  body?: ResponseType;
  transferredSize: number;
  size: number;
  duration: number;
}

/**
 * Represents the parsed response of a failed Atlassian Forge function invocation.
 */
export interface AtlassianFunctionErrorResponse {
  type: "invoke";
  success: false;
  errors: AtlassianInvocationError[];
  transferredSize: number;
  size: number;
  duration: number;
}

/**
 * Represents the parsed response of an Atlassian Forge remote invocation.
 */
export type AtlassianRemoteResponse<ResponseType = unknown> =
  | AtlassianRemoteSuccessResponse<ResponseType>
  | AtlassianRemoteErrorResponse;

/**
 * Represents the parsed response of a successful Atlassian Forge remote invocation.
 */
export interface AtlassianRemoteSuccessResponse<ResponseType = unknown> {
  type: "invokeRemote";
  success: true;
  status: number;
  headers?: Record<string, string>;
  body?: ResponseType;
  transferredSize: number;
  size: number;
  duration: number;
}

/**
 * Represents the parsed response of a failed Atlassian Forge remote invocation.
 */
export interface AtlassianRemoteErrorResponse {
  type: "invokeRemote";
  success: false;
  errors: AtlassianInvocationError[];
  transferredSize: number;
  size: number;
  duration: number;
}

/**
 * Represents an invocation error.
 */
export interface AtlassianInvocationError {
  status: number;
  type: string;
  message: string;
}
