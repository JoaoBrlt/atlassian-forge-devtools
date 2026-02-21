import JsonViewer from "@/components/json-viewer/JsonViewer.lazy";
import JsonViewerSkeleton from "@/components/json-viewer/JsonViewer.skeleton";
import { AtlassianEntry } from "@/types/atlassian";
import { Suspense } from "react";

export interface RequestTabProps {
  request: AtlassianEntry;
}

function ResponseTab({ request }: RequestTabProps) {
  // Invocation error
  if (!request.parsedResponse.success) {
    return (
      <Suspense fallback={<JsonViewerSkeleton />}>
        <JsonViewer data={request.parsedResponse.errors} />
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
    <Suspense fallback={<JsonViewerSkeleton />}>
      <JsonViewer data={request.parsedResponse.body} />
    </Suspense>
  );
}

export default ResponseTab;
