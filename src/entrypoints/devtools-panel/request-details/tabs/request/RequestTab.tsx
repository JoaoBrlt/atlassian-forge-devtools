import JsonEditor from "@/components/json-editor/JsonEditor.lazy";
import JsonEditorSkeleton from "@/components/json-editor/JsonEditor.skeleton";
import type { AtlassianEntry } from "@/types/atlassian";
import { Suspense } from "react";

export interface RequestTabProps {
  request: AtlassianEntry;
}

function RequestTab({ request }: RequestTabProps) {
  // No request body
  if (request.parsedRequest.body == null) {
    return (
      <div className="flex flex-col gap-0 p-2">
        <p>No payload for this request.</p>
      </div>
    );
  }
  // Request body
  return (
    <Suspense fallback={<JsonEditorSkeleton />}>
      <JsonEditor isReadOnly data={request.parsedRequest.body} />
    </Suspense>
  );
}

export default RequestTab;
