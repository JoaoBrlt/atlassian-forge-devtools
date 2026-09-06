export interface EditableHeader {
  id: string;
  isEnabled: boolean;
  name: string;
  value: string;
}

export interface EditableContext {
  cloudId: string;
  siteUrl: string;
  appVersion: string;
  environmentType: string;
  environmentId: string;
  extensionType: string;
  extensionId: string;
  moduleKey: string;
  localId: string;
}

export interface EditableRequest {
  type: "invoke" | "invokeRemote";
  functionKey: string;
  method: string;
  path: string;
  headers: EditableHeader[];
  body: string;
  context: EditableContext;
}
