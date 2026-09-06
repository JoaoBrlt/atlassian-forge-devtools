import JsonViewer from "@/components/json-viewer/JsonViewer.lazy";
import JsonViewerSkeleton from "@/components/json-viewer/JsonViewer.skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { AtlassianEntry } from "@/types/atlassian";
import type { EditableContext, EditableRequest } from "@/types/request-editor";
import { buildEditableRequest, createEditableHeader } from "@/utils/request-utils";
import { Plus, Send, Trash, X } from "lucide-react";
import { type ChangeEvent, Suspense, useEffect, useState } from "react";

export interface RequestEditorProps {
  request: AtlassianEntry;
  isSending: boolean;
  onSend: (request: AtlassianEntry, editedRequest: EditableRequest) => void;
  onClose: () => void;
}

const METHODS = ["", "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const CONTEXT_FIELDS: { name: keyof EditableContext; label: string }[] = [
  { name: "cloudId", label: "Cloud ID" },
  { name: "siteUrl", label: "Site URL" },
  { name: "appVersion", label: "App Version" },
  { name: "environmentType", label: "Environment Type" },
  { name: "environmentId", label: "Environment ID" },
  { name: "extensionType", label: "Extension Type" },
  { name: "extensionId", label: "Extension ID" },
  { name: "moduleKey", label: "Module Key" },
  { name: "localId", label: "Local ID" },
];

function RequestEditor({ request, isSending, onSend, onClose }: RequestEditorProps) {
  const [editedRequest, setEditedRequest] = useState<EditableRequest>(() => buildEditableRequest(request));

  useEffect(() => {
    setEditedRequest(buildEditableRequest(request));
  }, [request]);

  const handleMethodChange = (value: string | null) => {
    setEditedRequest((previous) => ({ ...previous, method: value ?? "" }));
  };

  const handlePathChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setEditedRequest((previous) => ({ ...previous, path: value }));
  };

  const handleFunctionKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setEditedRequest((previous) => ({ ...previous, functionKey: value }));
  };

  const handleContextChange = (name: keyof EditableContext, value: string) => {
    setEditedRequest((previous) => ({ ...previous, context: { ...previous.context, [name]: value } }));
  };

  const handleHeaderEnabledChange = (id: string, isEnabled: boolean) => {
    setEditedRequest((previous) => ({
      ...previous,
      headers: previous.headers.map((header) => (header.id === id ? { ...header, isEnabled } : header)),
    }));
  };

  const handleHeaderNameChange = (id: string, name: string) => {
    setEditedRequest((previous) => ({
      ...previous,
      headers: previous.headers.map((header) => (header.id === id ? { ...header, name } : header)),
    }));
  };

  const handleHeaderValueChange = (id: string, value: string) => {
    setEditedRequest((previous) => ({
      ...previous,
      headers: previous.headers.map((header) => (header.id === id ? { ...header, value } : header)),
    }));
  };

  const handleHeaderAdd = () => {
    setEditedRequest((previous) => ({ ...previous, headers: [...previous.headers, createEditableHeader()] }));
  };

  const handleHeaderRemove = (id: string) => {
    setEditedRequest((previous) => ({
      ...previous,
      headers: previous.headers.filter((header) => header.id !== id),
    }));
  };

  const handleBodyChange = (value: string) => {
    setEditedRequest((previous) => ({ ...previous, body: value }));
  };

  const handleClear = () => {
    setEditedRequest(buildEditableRequest(request));
  };

  const handleSend = () => {
    onSend(request, editedRequest);
  };

  return (
    <div className="flex h-full w-full min-w-[320px] flex-col gap-0 overflow-hidden">
      <div className="flex w-full shrink-0 items-center gap-1 border-b border-border bg-muted px-[3px]">
        <Button size="icon" variant="ghost" title="Close" onClick={onClose}>
          <X />
        </Button>
        <span className="text-xs font-medium">Edit and resend</span>
      </div>

      <div className="flex h-full w-full flex-col gap-0 overflow-auto">
        <Accordion multiple defaultValue={["general", "context", "headers", "body"]}>
          <AccordionItem value="general" className="border-none">
            <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
              General
            </AccordionTrigger>
            <AccordionContent className="p-2 text-xs">
              {editedRequest.type === "invokeRemote" ? (
                <div className="flex items-center gap-1">
                  <Select value={editedRequest.method} onValueChange={handleMethodChange}>
                    <SelectTrigger size="sm" className="w-24 shrink-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((method) => (
                        <SelectItem key={method} value={method} className="h-6 text-xs">
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-7 flex-1 text-xs"
                    placeholder="Path"
                    value={editedRequest.path}
                    onChange={handlePathChange}
                  />
                </div>
              ) : (
                <Input
                  className="h-7 w-full text-xs"
                  placeholder="Function key"
                  value={editedRequest.functionKey}
                  onChange={handleFunctionKeyChange}
                />
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="context" className="border-none">
            <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
              Context
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1 p-2 text-xs">
              {CONTEXT_FIELDS.map((field) => (
                <div key={field.name} className="flex items-center gap-1">
                  <span className="w-[35%] max-w-60 min-w-30 shrink-0 font-medium">{field.label}</span>
                  <Input
                    className="h-7 flex-1 text-xs"
                    placeholder={field.label}
                    value={editedRequest.context[field.name]}
                    onChange={(event) => handleContextChange(field.name, event.target.value)}
                  />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {editedRequest.type === "invokeRemote" && (
            <AccordionItem value="headers" className="border-none">
              <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
                Headers
              </AccordionTrigger>
              <AccordionContent className="flex flex-col items-start gap-1 p-2 text-xs">
                {editedRequest.headers.map((header) => (
                  <div key={header.id} className="flex w-full items-center gap-1">
                    <Checkbox
                      className="shrink-0"
                      title={header.isEnabled ? "Disable header" : "Enable header"}
                      checked={header.isEnabled}
                      onCheckedChange={(checked) => handleHeaderEnabledChange(header.id, checked)}
                    />
                    <Input
                      className="h-7 w-[35%] text-xs"
                      placeholder="Name"
                      value={header.name}
                      onChange={(event) => handleHeaderNameChange(header.id, event.target.value)}
                    />
                    <Input
                      className="h-7 flex-1 text-xs"
                      placeholder="Value"
                      value={header.value}
                      onChange={(event) => handleHeaderValueChange(header.id, event.target.value)}
                    />
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      title="Remove header"
                      onClick={() => handleHeaderRemove(header.id)}
                    >
                      <Trash />
                    </Button>
                  </div>
                ))}
                <Button size="xs" variant="outline" onClick={handleHeaderAdd}>
                  <Plus />
                  Add header
                </Button>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="body" className="border-none">
            <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
              {editedRequest.type === "invokeRemote" ? "Body" : "Payload"}
            </AccordionTrigger>
            <AccordionContent className="p-2 text-xs">
              <div className="h-64 w-full overflow-hidden rounded-lg border border-border">
                <Suspense fallback={<JsonViewerSkeleton />}>
                  <JsonViewer editable prettify={false} data={editedRequest.body} onChange={handleBodyChange} />
                </Suspense>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border p-2">
        <Button size="xs" variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button size="xs" disabled={isSending} onClick={handleSend}>
          {isSending ? <Spinner size="sm" /> : <Send />}
          Send
        </Button>
      </div>
    </div>
  );
}

export default RequestEditor;
