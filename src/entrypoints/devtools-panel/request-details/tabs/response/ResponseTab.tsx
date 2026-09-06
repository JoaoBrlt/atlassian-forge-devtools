import JsonEditor from "@/components/json-editor/JsonEditor.lazy";
import JsonEditorSkeleton from "@/components/json-editor/JsonEditor.skeleton";
import type { AtlassianEntry } from "@/types/atlassian";
import { Suspense } from "react";

export interface RequestTabProps {
  request: AtlassianEntry;
}

function ResponseTab({ request }: RequestTabProps) {
  // Invocation error
  if (!request.parsedResponse.success) {
    return (
      <Suspense fallback={<JsonEditorSkeleton />}>
        <JsonEditor isReadOnly data={request.parsedResponse.errors} />
      </Suspense>
    );
  }
  // No response body
  if (request.parsedResponse.body == null) {
    return (
      <div className="flex flex-col gap-0 p-2">
        <p>No response data for this request.</p>
      </div>
    );
  }
  // Response body
  return (
    <Suspense fallback={<JsonEditorSkeleton />}>
      <JsonEditor isReadOnly data={request.parsedResponse.body} />
    </Suspense>
  );
}

export default ResponseTab;
