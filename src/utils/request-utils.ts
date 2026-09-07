import { browser } from "#imports";
import type { AtlassianInvokeExtensionRequest } from "@/schemas/atlassian";
import type { AtlassianEntry } from "@/types/atlassian";
import type { EditableContext, EditableHeader, EditableRequest } from "@/types/request-editor";
import { isBlank, isNotBlank } from "@/utils/string-utils";
import type { Header } from "har-format";

interface EvaluationResult {
  success?: boolean;
  error?: string;
}

/**
 * The name prefixes of the request headers that cannot be set when sending a request.
 */
const FORBIDDEN_HEADER_PREFIXES = [":", "proxy-", "sec-"];

/**
 * The names of the request headers that cannot be set when sending a request.
 */
const FORBIDDEN_HEADERS = new Set([
  "accept-charset",
  "accept-encoding",
  "access-control-request-headers",
  "access-control-request-method",
  "connection",
  "content-length",
  "cookie",
  "date",
  "dnt",
  "expect",
  "host",
  "keep-alive",
  "origin",
  "referer",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
]);

/**
 * Creates a new editable header.
 *
 * @return the new editable header
 */
export function buildEditableHeader(): EditableHeader {
  return {
    id: crypto.randomUUID(),
    isEnabled: true,
    name: "",
    value: "",
  };
}

/**
 * Converts an Atlassian HAR entry to an editable request.
 *
 * @param entry the Atlassian HAR entry to convert
 * @return the editable request
 */
export function buildEditableRequest(entry: AtlassianEntry): EditableRequest {
  const request = entry.parsedRequest;
  return {
    type: request.type,
    functionKey: request.type === "invoke" ? request.functionKey : "",
    method: request.type === "invokeRemote" ? request.method : "",
    path: request.type === "invokeRemote" ? request.path : "",
    headers: request.type === "invokeRemote" ? buildEditableRequestHeaders(request.headers) : [],
    body: buildEditableRequestBody(request.body),
    context: {
      cloudId: request.context.cloudId ?? "",
      siteUrl: request.context.siteUrl ?? "",
      appVersion: request.context.appVersion ?? "",
      environmentType: request.context.environmentType ?? "",
      environmentId: request.context.environmentId ?? "",
      extensionType: request.context.extensionType ?? "",
      extensionId: request.context.extensionId ?? "",
      moduleKey: request.context.moduleKey ?? "",
      localId: request.context.localId ?? "",
    },
  };
}

function buildEditableRequestHeaders(headers: Record<string, string> | undefined): EditableHeader[] {
  return Object.entries(headers ?? {}).map(([name, value]) => ({
    id: crypto.randomUUID(),
    isEnabled: true,
    name,
    value,
  }));
}

function buildEditableRequestBody(body: unknown): string {
  if (body == null) {
    return "";
  }
  if (typeof body === "string") {
    return body;
  }
  return JSON.stringify(body, null, 2);
}

/**
 * Resends a request.
 *
 * @param entry the Atlassian HAR entry to resend
 */
export async function resendRequest(entry: AtlassianEntry): Promise<void> {
  await evaluateRequest(entry, getRequestBody(entry));
}

/**
 * Sends a request with modifications.
 *
 * @param entry the Atlassian HAR entry to send
 * @param request the editable request to send
 * @return the response of the request
 */
export async function sendRequest(entry: AtlassianEntry, request: EditableRequest): Promise<void> {
  await evaluateRequest(entry, buildRequestBody(entry, request));
}

function getRequestBody(entry: AtlassianEntry): string {
  const body = entry.request.postData?.text;
  if (isBlank(body)) {
    throw new Error("Missing request body");
  }
  return body;
}

function buildRequestBody(entry: AtlassianEntry, request: EditableRequest): string {
  const body = getRequestBody(entry);

  let parsedBody: AtlassianInvokeExtensionRequest;
  try {
    parsedBody = JSON.parse(body) as AtlassianInvokeExtensionRequest;
  } catch (error) {
    throw new Error("Failed to parse the request body", { cause: error });
  }

  return JSON.stringify({
    ...parsedBody,
    variables: {
      ...parsedBody.variables,
      input: {
        ...parsedBody.variables?.input,
        extensionId: blankToUndefined(request.context.extensionId),
        payload: {
          ...parsedBody.variables?.input?.payload,
          call: buildRequestCall(request),
          context: buildRequestContext(request.context),
        },
      },
    },
  });
}

function buildRequestCall(request: EditableRequest) {
  if (request.type === "invoke") {
    return {
      functionKey: request.functionKey,
      payload: buildRequestCallBody(request.body),
    };
  }
  return {
    method: request.method,
    path: request.path,
    headers: buildRequestCallHeaders(request.headers),
    body: buildRequestCallBody(request.body),
  };
}

function buildRequestCallHeaders(headers: EditableHeader[]): Record<string, string> {
  return Object.fromEntries(
    headers
      .filter((header) => header.isEnabled && isNotBlank(header.name))
      .map((header) => [header.name, header.value]),
  );
}

function buildRequestCallBody(body: string): unknown {
  if (isBlank(body)) {
    return undefined;
  }
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function buildRequestContext(context: EditableContext) {
  return {
    cloudId: blankToUndefined(context.cloudId),
    siteUrl: blankToUndefined(context.siteUrl),
    appVersion: blankToUndefined(context.appVersion),
    environmentType: blankToUndefined(context.environmentType),
    environmentId: blankToUndefined(context.environmentId),
    extension: isNotBlank(context.extensionType) ? { type: context.extensionType } : undefined,
    moduleKey: blankToUndefined(context.moduleKey),
    localId: blankToUndefined(context.localId),
  };
}

function blankToUndefined(value: string): string | undefined {
  return isNotBlank(value) ? value : undefined;
}

async function evaluateRequest(entry: AtlassianEntry, body: string): Promise<void> {
  const url = JSON.stringify(entry.request.url);
  const options = JSON.stringify({
    method: entry.request.method,
    headers: buildRequestHeaders(entry.request.headers),
    body,
    credentials: "include",
  });

  const result = await evaluateExpression<EvaluationResult>(`(async () => {
  try {
    const response = await fetch(${url}, ${options});
    await response.text();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
})()`);

  if (result?.success === false) {
    throw new Error(result.error ?? "Failed to send the request");
  }
}

function buildRequestHeaders(headers: Header[]): Record<string, string> {
  return Object.fromEntries(
    headers.filter((header) => isAllowedHeader(header.name)).map((header) => [header.name, header.value]),
  );
}

function isAllowedHeader(name: string): boolean {
  const normalizedName = name.toLowerCase();
  return (
    !FORBIDDEN_HEADERS.has(normalizedName) &&
    !FORBIDDEN_HEADER_PREFIXES.some((prefix) => normalizedName.startsWith(prefix))
  );
}

function evaluateExpression<T>(expression: string): Promise<T> {
  return new Promise((resolve, reject) => {
    browser.devtools.inspectedWindow.eval<T>(expression, (result, exceptionInfo) => {
      if (exceptionInfo?.isError) {
        reject(new Error(exceptionInfo.description ?? "Failed to evaluate the expression"));
      } else if (exceptionInfo?.isException) {
        reject(new Error(exceptionInfo.value ?? "Failed to evaluate the expression"));
      } else {
        resolve(result);
      }
    });
  });
}
