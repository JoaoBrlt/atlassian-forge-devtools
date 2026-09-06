import { browser } from "#imports";
import type { AtlassianInvokeExtensionRequest } from "@/schemas/atlassian";
import type { AtlassianEntry } from "@/types/atlassian";
import type { EditableContext, EditableHeader, EditableRequest } from "@/types/request-editor";
import { isBlank, isNotBlank } from "@/utils/string-utils";

type InvokeExtensionPayload = AtlassianInvokeExtensionRequest["variables"]["input"]["payload"];
type InvokeExtensionCall = InvokeExtensionPayload["call"];
type InvokeExtensionContext = InvokeExtensionPayload["context"];
type InvokeExtensionExtension = NonNullable<InvokeExtensionContext>["extension"];

export function createEditableHeader(): EditableHeader {
  return {
    id: crypto.randomUUID(),
    isEnabled: true,
    name: "",
    value: "",
  };
}

export function buildEditableRequest(entry: AtlassianEntry): EditableRequest {
  const request = entry.parsedRequest;
  return {
    type: request.type,
    functionKey: request.type === "invoke" ? request.functionKey : "",
    method: request.type === "invokeRemote" ? request.method : "",
    path: request.type === "invokeRemote" ? request.path : "",
    headers: request.type === "invokeRemote" ? buildEditableHeaders(request.headers) : [],
    body: buildEditableBody(request.body),
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

function buildEditableHeaders(headers: Record<string, string> | undefined): EditableHeader[] {
  return Object.entries(headers ?? {}).map(([name, value]) => ({
    id: crypto.randomUUID(),
    isEnabled: true,
    name,
    value,
  }));
}

function buildEditableBody(body: unknown): string {
  if (body == null) {
    return "";
  }
  if (typeof body === "string") {
    return body;
  }
  return JSON.stringify(body, null, 2);
}

export async function resendRequest(entry: AtlassianEntry): Promise<void> {
  const body = entry.request.postData?.text;
  if (isBlank(body)) {
    throw new Error("Missing request body");
  }
  await sendInvocationRequest(entry, body);
}

export async function sendRequest(entry: AtlassianEntry, request: EditableRequest): Promise<void> {
  await sendInvocationRequest(entry, buildRequestBody(entry, request));
}

function buildRequestBody(entry: AtlassianEntry, request: EditableRequest): string {
  const body = entry.request.postData?.text;
  if (isBlank(body)) {
    throw new Error("Missing request body");
  }

  let originalRequest: AtlassianInvokeExtensionRequest;
  try {
    originalRequest = JSON.parse(body) as AtlassianInvokeExtensionRequest;
  } catch (error) {
    throw new Error("Failed to parse the request body", { cause: error });
  }

  const originalInput = originalRequest.variables.input;
  const originalPayload = originalInput.payload;

  return JSON.stringify({
    ...originalRequest,
    variables: {
      ...originalRequest.variables,
      input: {
        ...originalInput,
        extensionId: blankToUndefined(request.context.extensionId),
        payload: {
          ...originalPayload,
          call: buildCall(originalPayload.call, request, entry.parsedRequest.body),
          context: buildContext(originalPayload.context, request.context),
        },
      },
    },
  });
}

function buildCall(originalCall: InvokeExtensionCall, request: EditableRequest, originalBody: unknown) {
  if (request.type === "invoke") {
    return {
      ...originalCall,
      functionKey: request.functionKey,
      payload: buildBody(request.body, originalBody),
    };
  }
  return {
    ...originalCall,
    method: request.method,
    path: request.path,
    headers: buildHeaders(request.headers),
    body: buildBody(request.body, originalBody),
  };
}

function buildHeaders(headers: EditableHeader[]): Record<string, string> | undefined {
  const enabledHeaders = headers.filter((header) => header.isEnabled && isNotBlank(header.name));
  if (enabledHeaders.length === 0) {
    return undefined;
  }
  return Object.fromEntries(enabledHeaders.map((header) => [header.name, header.value]));
}

function buildBody(body: string, originalBody: unknown): unknown {
  if (isBlank(body)) {
    return undefined;
  }
  if (typeof originalBody === "string") {
    return body;
  }
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

function buildContext(originalContext: InvokeExtensionContext, context: EditableContext) {
  return {
    ...originalContext,
    cloudId: blankToUndefined(context.cloudId),
    siteUrl: blankToUndefined(context.siteUrl),
    appVersion: blankToUndefined(context.appVersion),
    environmentType: blankToUndefined(context.environmentType),
    environmentId: blankToUndefined(context.environmentId),
    extension: buildExtension(originalContext?.extension, context.extensionType),
    moduleKey: blankToUndefined(context.moduleKey),
    localId: blankToUndefined(context.localId),
  };
}

function buildExtension(originalExtension: InvokeExtensionExtension, extensionType: string) {
  if (originalExtension == null && isBlank(extensionType)) {
    return undefined;
  }
  return {
    ...originalExtension,
    type: blankToUndefined(extensionType),
  };
}

function blankToUndefined(value: string): string | undefined {
  return isBlank(value) ? undefined : value;
}

async function sendInvocationRequest(entry: AtlassianEntry, body: string): Promise<void> {
  const options = {
    method: entry.request.method,
    credentials: "include",
    headers: buildRequestHeaders(entry),
    body,
  };
  const expression = `fetch(${JSON.stringify(entry.request.url)}, ${JSON.stringify(options)})`;
  const outcome: unknown = browser.devtools.inspectedWindow.eval(expression);
  if (outcome instanceof Promise) {
    await outcome;
  }
}

function buildRequestHeaders(entry: AtlassianEntry): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const header of entry.request.headers) {
    headers[header.name] = header.value;
  }
  return headers;
}
