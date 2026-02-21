import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeadersTab from "@/entrypoints/devtools-panel/request-details/tabs/headers/HeadersTab";
import RequestTab from "@/entrypoints/devtools-panel/request-details/tabs/request/RequestTab";
import { useVisibleItems } from "@/hooks/useVisibleItems";
import { cn } from "@/lib/utils";
import { AtlassianEntry } from "@/types/atlassian";
import { ChevronsRight, X } from "lucide-react";
import { useState } from "react";
import ResponseTab from "./tabs/response/ResponseTab";

export interface RequestDetailsProps {
  request: AtlassianEntry;
  onCloseRequest: () => void;
}

interface Tab {
  label: string;
  value: string;
}

const TABS: Tab[] = [
  {
    label: "Headers",
    value: "headers",
  },
  {
    label: "Request",
    value: "request",
  },
  {
    label: "Response",
    value: "response",
  },
];

function RequestDetails({ request, onCloseRequest }: RequestDetailsProps) {
  // State
  const [selectedTab, setSelectedTab] = useState<string>("headers");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Visible tabs
  const { containerRef, itemRefs, visibleCount } = useVisibleItems<HTMLDivElement, HTMLButtonElement>({
    totalItems: TABS.length,
    reservedWidth: 32,
    ellipsisWidth: 24,
  });
  const visibleTabs = TABS.slice(0, visibleCount);
  const overflowTabs = TABS.slice(visibleCount);
  const isSelectedTabVisible = visibleTabs.some((tab) => tab.value === selectedTab);

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setIsMenuOpen(false);
  };

  const handleMenuOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
  };

  return (
    <Tabs
      value={selectedTab}
      onValueChange={setSelectedTab}
      className="flex h-full w-full flex-col gap-0 overflow-hidden"
    >
      <TabsList ref={containerRef} variant="line" className="w-full justify-start border-b border-border bg-muted">
        <div>
          <Button size="icon" variant="ghost" title="Close" onClick={onCloseRequest}>
            <X />
          </Button>
        </div>
        {TABS.map((tab, index) => {
          const isVisible = index < visibleCount;
          return (
            <TabsTrigger
              key={tab.value}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              className={cn(
                "flex-0 shrink-0 cursor-pointer text-xs transition-none",
                !isVisible && "pointer-none invisible absolute",
              )}
              value={tab.value}
            >
              {tab.label}
            </TabsTrigger>
          );
        })}
        {overflowTabs != null && overflowTabs.length > 0 && (
          <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  title="More"
                  className={cn(
                    "relative after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity",
                    !isSelectedTabVisible && "text-foreground after:opacity-100",
                  )}
                />
              }
            >
              <ChevronsRight />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup value={selectedTab} onValueChange={handleTabChange}>
                  {overflowTabs.map((tab) => (
                    <DropdownMenuRadioItem key={tab.value} value={tab.value}>
                      {tab.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
      <TabsContent value="headers" className="flex h-full w-full flex-col gap-0 overflow-auto p-0">
        <HeadersTab request={request} />
      </TabsContent>
      <TabsContent value="request" className="flex h-full w-full flex-col gap-0 overflow-auto p-0">
        <RequestTab request={request} />
      </TabsContent>
      <TabsContent value="response" className="flex h-full w-full flex-col gap-0 overflow-auto p-0">
        <ResponseTab request={request} />
      </TabsContent>
    </Tabs>
  );
}

export default RequestDetails;
