import { browser, Browser } from "#imports";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { AtlassianEntry } from "@/types/atlassian";
import { buildHarFile, parseHarFile } from "@/utils/har-utils";
import { parseHarEntry } from "@/utils/atlassian-utils";
import { Suspense, useCallback, useEffect, useState } from "react";
import RequestDetails from "./request-details/RequestDetails.lazy";
import RequestDetailsSkeleton from "./request-details/RequestDetails.skeleton";
import RequestList from "./request-list/RequestList.lazy";
import RequestListSkeleton from "./request-list/RequestList.skeleton";
import Toolbar from "./toolbar/Toolbar";

function App() {
  const [filter, setFilter] = useState("");
  const [requests, setRequests] = useState<AtlassianEntry[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AtlassianEntry>();

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
        <ResizablePanel minSize="10%" className="flex h-full w-full flex-col gap-0 overflow-hidden">
          <Suspense fallback={<RequestListSkeleton />}>
            <RequestList
              filter={filter}
              requests={requests}
              selectedRequest={selectedRequest}
              onSelectRequest={handleSelectRequest}
            />
          </Suspense>
        </ResizablePanel>
        {selectedRequest != null && (
          <>
            <ResizableHandle className="z-10" />
            <ResizablePanel minSize="10%" className="flex h-full w-full flex-col gap-0 overflow-hidden">
              <Suspense fallback={<RequestDetailsSkeleton />}>
                <RequestDetails request={selectedRequest} onCloseRequest={handleCloseRequest} />
              </Suspense>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
