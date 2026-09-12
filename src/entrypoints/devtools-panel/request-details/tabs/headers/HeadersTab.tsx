import ResponseStatusBadge from "@/components/response-status-badge/ResponseStatusBadge";
import TrpcResponseStatusBadge from "@/components/trpc-response-status-badge/TrpcResponseStatusBadge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import type { AtlassianEntry } from "@/types/atlassian";
import { isForgeTrpcRequest } from "@/utils/forge-trpc-utils";
import { parseUrl } from "@/utils/http-utils";
import { formatSize } from "@/utils/size-utils";
import { formatDuration } from "@/utils/time-utils";
import RequestDetailRow, { type RequestDetail } from "./request-detail-row/RequestDetailRow";

export interface HeadersTabProps {
  request: AtlassianEntry;
}

function getPathParts(pathString: string): RequestDetail[] {
  const { protocol, host, pathname, searchParams = [], hash } = parseUrl(pathString);
  return [
    { name: "Protocol", value: protocol },
    { name: "Host", value: host },
    { name: "Pathname", value: pathname },
    ...searchParams,
    { name: "Hash", value: hash },
  ].filter((part) => part.value != null);
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
      parts: entry.parsedRequest.type === "invokeRemote" ? getPathParts(entry.parsedRequest.path) : undefined,
    },
    {
      name: "Status",
      value: <ResponseStatusBadge response={entry.parsedResponse} />,
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

function getForgeTrpcDetails(entry: AtlassianEntry): RequestDetail[] {
  if (!isForgeTrpcRequest(entry.parsedRequest)) {
    return [];
  }
  return [
    {
      name: "tRPC Type",
      value: entry.parsedRequest.trpc.type,
    },
    {
      name: "tRPC Path",
      value: entry.parsedRequest.trpc.path,
    },
    {
      name: "tRPC Status",
      value: <TrpcResponseStatusBadge response={entry.parsedResponse} />,
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
  return (
    <div className="flex h-full w-full min-w-[320px] flex-col gap-0">
      <Accordion multiple defaultValue={["general", "forge-trpc", "context", "response", "request"]}>
        {/* General */}
        <AccordionItem value="general" className="border-none">
          <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
            General
          </AccordionTrigger>
          <AccordionContent className="p-2 text-xs">
            <Table className="text-xs">
              <TableBody>
                {getGeneralDetails(request)
                  .filter((item) => item.value != null)
                  .map((detail) => (
                    <RequestDetailRow key={detail.name} detail={detail} />
                  ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>

        {/* Forge tRPC */}
        {isForgeTrpcRequest(request.parsedRequest) && (
          <AccordionItem value="forge-trpc" className="border-none">
            <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
              Forge tRPC
            </AccordionTrigger>
            <AccordionContent className="p-2 text-xs">
              <Table className="text-xs">
                <TableBody>
                  {getForgeTrpcDetails(request)
                    .filter((item) => item.value != null)
                    .map((detail) => (
                      <RequestDetailRow key={detail.name} detail={detail} />
                    ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Context */}
        <AccordionItem value="context" className="border-none">
          <AccordionTrigger className="cursor-pointer rounded-none border-0 border-y border-border bg-muted p-1.5 text-xs hover:no-underline">
            Context
          </AccordionTrigger>
          <AccordionContent className="p-2 text-xs">
            <Table className="text-xs">
              <TableBody>
                {getContextDetails(request)
                  .filter((item) => item.value != null)
                  .map((detail) => (
                    <RequestDetailRow key={detail.name} detail={detail} />
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
