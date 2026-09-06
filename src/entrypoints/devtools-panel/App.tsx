import { browser, type Browser } from "#imports";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { AtlassianEntry } from "@/types/atlassian";
import type { EditableRequest } from "@/types/request-editor";
import { parseHarEntry } from "@/utils/atlassian-utils";
import { buildHarFile, parseHarFile } from "@/utils/har-utils";
import { resendRequest, sendRequest } from "@/utils/request-utils";
import { Suspense, useCallback, useEffect, useState } from "react";
import RequestDetails from "./request-details/RequestDetails.lazy";
import RequestDetailsSkeleton from "./request-details/RequestDetails.skeleton";
import RequestEditor from "./request-editor/RequestEditor.lazy";
import RequestEditorSkeleton from "./request-editor/RequestEditor.skeleton";
import RequestList from "./request-list/RequestList.lazy";
import RequestListSkeleton from "./request-list/RequestList.skeleton";
import Toolbar from "./toolbar/Toolbar";

function App() {
  const [filter, setFilter] = useState("");
  const [requests, setRequests] = useState<AtlassianEntry[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AtlassianEntry>();
  const [editedRequest, setEditedRequest] = useState<AtlassianEntry>();
  const [isSending, setIsSending] = useState(false);

  const handleFilterChange = useCallback((value: string) => {
    setFilter(value);
  }, []);

  const handleClearRequests = useCallback(() => {
    setRequests([]);
    setSelectedRequest(undefined);
  }, []);

  const handleSelectRequest = useCallback((request: AtlassianEntry) => {
    setSelectedRequest(request);
  }, []);

  const handleCloseRequest = useCallback(() => {
    setSelectedRequest(undefined);
  }, []);

  const handleResendRequest = useCallback((request: AtlassianEntry) => {
    setIsSending(true);
    resendRequest(request)
      .catch((error) => console.error("Failed to resend the request:", error))
      .finally(() => setIsSending(false));
  }, []);

  const handleEditRequest = useCallback((request: AtlassianEntry) => {
    setEditedRequest(request);
  }, []);

  const handleCloseRequestEditor = useCallback(() => {
    setEditedRequest(undefined);
  }, []);

  const handleSubmitRequestEditor = useCallback((request: AtlassianEntry, editableRequest: EditableRequest) => {
    setIsSending(true);
    sendRequest(request, editableRequest)
      .catch((error) => console.error("Failed to send the request:", error))
      .finally(() => setIsSending(false));
  }, []);

  const handleRequestFinished = useCallback((request: Browser.devtools.network.Request) => {
    parseHarEntry(request)
      .then((parsedEntry) => {
        if (parsedEntry != null) {
          setRequests((entries) => [...entries, parsedEntry]);
        }
      })
      .catch((error) => console.error("Failed to parse HAR entry:", error));
  }, []);

  const handleHarImport = useCallback(async (file: File) => {
    try {
      const content = await parseHarFile(file);
      const newRequests: AtlassianEntry[] = [];
      for (const entry of content.log.entries) {
        try {
          const parsedEntry = await parseHarEntry(entry);
          if (parsedEntry != null) {
            newRequests.push(parsedEntry);
          }
        } catch (error) {
          console.error("Failed to parse HAR entry:", error);
        }
      }
      setRequests(newRequests);
    } catch (error) {
      console.error("Failed to import HAR file:", error);
    }
  }, []);

  const handleHarExport = useCallback(() => {
    try {
      const file = buildHarFile(requests);
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.har";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export HAR file:", error);
    }
  }, [requests]);

  useEffect(() => {
    browser.devtools.network.onRequestFinished.addListener(handleRequestFinished);
    browser.devtools.network.onNavigated.addListener(handleClearRequests);
    return () => {
      browser.devtools.network.onRequestFinished.removeListener(handleRequestFinished);
      browser.devtools.network.onNavigated.removeListener(handleClearRequests);
    };
  }, [handleClearRequests, handleRequestFinished]);

  return (
    <div className="flex h-full w-full flex-col gap-0 overflow-hidden">
      <Toolbar
        filter={filter}
        onFilterChange={handleFilterChange}
        onClearRequests={handleClearRequests}
        onHarImport={handleHarImport}
        onHarExport={handleHarExport}
      />
      <ResizablePanelGroup orientation="horizontal">
        {editedRequest != null && (
          <>
            <ResizablePanel minSize="10%" className="flex h-full w-full flex-col gap-0 overflow-hidden">
              <Suspense fallback={<RequestEditorSkeleton />}>
                <RequestEditor
                  request={editedRequest}
                  isSending={isSending}
                  onSend={handleSubmitRequestEditor}
                  onClose={handleCloseRequestEditor}
                />
              </Suspense>
            </ResizablePanel>
            <ResizableHandle className="z-10" />
          </>
        )}
        <ResizablePanel minSize="10%" className="flex h-full w-full flex-col gap-0 overflow-hidden">
          <Suspense fallback={<RequestListSkeleton />}>
            <RequestList
              filter={filter}
              requests={requests}
              selectedRequest={selectedRequest}
              onSelect={handleSelectRequest}
              onResend={handleResendRequest}
              onEdit={handleEditRequest}
            />
          </Suspense>
        </ResizablePanel>
        {selectedRequest != null && (
          <>
            <ResizableHandle className="z-10" />
            <ResizablePanel minSize="10%" className="flex h-full w-full flex-col gap-0 overflow-hidden">
              <Suspense fallback={<RequestDetailsSkeleton />}>
                <RequestDetails request={selectedRequest} onClose={handleCloseRequest} />
              </Suspense>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
