import JsonViewer from "@/components/json-viewer/JsonViewer.lazy";
import JsonViewerSkeleton from "@/components/json-viewer/JsonViewer.skeleton";
import { AtlassianEntry } from "@/types/atlassian";
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
    <Suspense fallback={<JsonViewerSkeleton />}>
      <JsonViewer data={request.parsedRequest.body} />
    </Suspense>
  );
}

export default RequestTab;
