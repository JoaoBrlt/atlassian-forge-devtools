import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { AtlassianEntry } from "@/types/atlassian";
import { formatSize } from "@/utils/size-utils";
import { getSafeStatusText } from "@/utils/http-utils";
import { formatDuration } from "@/utils/time-utils";
import { ReactNode } from "react";

export interface HeadersTabProps {
  request: AtlassianEntry;
}

interface RequestDetail {
  name: string;
  value: ReactNode;
}

function getStatusColor(status: number) {
  if (status >= 100 && status <= 399) {
    return "var(--color-text-success)";
  }
  if (status >= 400 && status <= 599) {
    return "var(--color-text-destructive)";
  }
  return "var(--color-text-info)";
}

function getResponseStatus(entry: AtlassianEntry) {
  if (entry.parsedResponse.type === "invokeRemote") {
    if (entry.parsedResponse.success) {
      return (
        <p className="font-semibold" style={{ color: getStatusColor(entry.parsedResponse.status) }}>
          {entry.parsedResponse.status} {getSafeStatusText(entry.parsedResponse.status)}
        </p>
      );
    }
    return <p className="font-semibold text-text-destructive">Failed</p>;
  }
  if (entry.parsedResponse.success) {
    return <p className="font-semibold text-text-success">Success</p>;
  }
  return <p className="font-semibold text-text-destructive">Failed</p>;
}

function getGeneralDetails(entry: AtlassianEntry): RequestDetail[] {
  return [
    {
      name: "Type",
      value: entry.parsedRequest.type,
    },
    {
      name: "Function Key",
      value: entry.parsedRequest.type === "invoke" ? entry.parsedRequest.functionKey : undefined,
    },
    {
      name: "Method",
      value: entry.parsedRequest.type === "invokeRemote" ? entry.parsedRequest.method : undefined,
    },
    {
      name: "Path",
      value: entry.parsedRequest.type === "invokeRemote" ? entry.parsedRequest.path : undefined,
    },
    {
      name: "Status",
      value: getResponseStatus(entry),
    },
    {
      name: "Transferred Size",
      value: formatSize(entry.parsedResponse.transferredSize),
    },
    {
      name: "Size",
      value: formatSize(entry.parsedResponse.size),
    },
    {
      name: "Time",
      value: formatDuration(entry.parsedResponse.duration),
    },
  ];
}

function getContextDetails(entry: AtlassianEntry): RequestDetail[] {
  return [
    {
      name: "Cloud ID",
      value: entry.parsedRequest.context.cloudId,
    },
    {
      name: "Site URL",
      value: entry.parsedRequest.context.siteUrl,
    },
    {
      name: "App Version",
      value: entry.parsedRequest.context.appVersion,
    },
    {
      name: "Environment Type",
      value: entry.parsedRequest.context.environmentType,
    },
    {
      name: "Environment ID",
      value: entry.parsedRequest.context.environmentId,
    },
    {
      name: "Extension Type",
      value: entry.parsedRequest.context.extensionType,
    },
    {
      name: "Extension ID",
      value: entry.parsedRequest.context.extensionId,
    },
    {
      name: "Module Key",
      value: entry.parsedRequest.context.moduleKey,
    },
    {
      name: "Local ID",
      value: entry.parsedRequest.context.localId,
    },
  ];
}

function HeadersTab({ request }: HeadersTabProps) {
  const generalDetails = getGeneralDetails(request).filter((item) => item.value != null);
  const contextDetails = getContextDetails(request).filter((item) => item.value != null);

  return (
    <div className="flex h-full w-full min-w-[320px] flex-col gap-0">
      <Accordion multiple defaultValue={["general", "context", "response", "request"]}>
        {/* General */}
        <AccordionItem value="general" className="border-none">
          <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
            General
          </AccordionTrigger>
          <AccordionContent className="p-2 text-xs">
            <Table className="text-xs">
              <TableBody>
                {generalDetails.map(({ name, value }) => (
                  <TableRow key={name} className="border-none bg-background hover:bg-background">
                    <TableHead className="h-6 w-[30%] max-w-60 min-w-35 p-0 pr-1 pb-1">{name}</TableHead>
                    <TableCell className="h-6 p-0 pb-1 break-all whitespace-normal">{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>

        {/* Context */}
        <AccordionItem value="context" className="border-none">
          <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
            Context
          </AccordionTrigger>
          <AccordionContent className="p-2 text-xs">
            <Table className="text-xs">
              <TableBody>
                {contextDetails.length === 0 && <p>No invocation context for this request.</p>}
                {contextDetails.map(({ name, value }) => (
                  <TableRow key={name} className="border-none bg-background hover:bg-background">
                    <TableHead className="h-6 w-[30%] max-w-60 min-w-35 p-0 pr-1 pb-1">{name}</TableHead>
                    <TableCell className="h-6 p-0 pb-1 break-all whitespace-normal">{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>

        {/* Response Headers */}
        {request.parsedResponse.type === "invokeRemote" && (
          <AccordionItem value="response" className="border-none">
            <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
              Response Headers
            </AccordionTrigger>
            <AccordionContent className="p-2 text-xs">
              {request.parsedResponse.success &&
              request.parsedResponse.headers != null &&
              Object.keys(request.parsedResponse.headers).length > 0 ? (
                <Table className="text-xs">
                  <TableBody>
                    {Object.entries(request.parsedResponse.headers).map(([name, value]) => (
                      <TableRow key={name} className="border-none bg-background hover:bg-background">
                        <TableHead className="h-6 w-[30%] max-w-60 min-w-35 p-0 pr-1 pb-1">{name}</TableHead>
                        <TableCell className="h-6 p-0 pb-1 wrap-break-word whitespace-normal">{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>No response headers for this request.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Request Headers */}
        {request.parsedRequest.type === "invokeRemote" && (
          <AccordionItem value="request" className="border-none">
            <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
              Request Headers
            </AccordionTrigger>
            <AccordionContent className="p-2 text-xs">
              {request.parsedRequest.headers != null && Object.keys(request.parsedRequest.headers).length > 0 ? (
                <Table className="text-xs">
                  <TableBody>
                    {Object.entries(request.parsedRequest.headers).map(([name, value]) => (
                      <TableRow key={name} className="border-none bg-background hover:bg-background">
                        <TableHead className="h-6 w-[30%] max-w-60 min-w-35 p-0 pr-1 pb-1">{name}</TableHead>
                        <TableCell className="h-6 p-0 pb-1 wrap-break-word whitespace-normal">{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>No request headers for this request.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

export default HeadersTab;
