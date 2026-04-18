import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AtlassianEntry } from "@/types/atlassian";
import { formatDuration } from "@/utils/time-utils";
import { CircleQuestionMark } from "lucide-react";
import { ReactNode } from "react";

export interface TimingsTabProps {
  request: AtlassianEntry;
}

interface RequestTiming {
  name: string;
  helpMessage?: string;
  value: ReactNode;
}

function getRequestTimings(entry: AtlassianEntry): RequestTiming[] {
  return [
    {
      name: "Blocked",
      helpMessage: "Time spent in a queue waiting for a network connection.",
      value: formatDuration(entry.timings.blocked, 2, "-"),
    },
    {
      name: "DNS",
      helpMessage: "Time taken to resolve a host name.",
      value: formatDuration(entry.timings.dns, 2, "-"),
    },
    {
      name: "Connect",
      helpMessage: "Time taken to create a TCP connection.",
      value: formatDuration(entry.timings.connect, 2, "-"),
    },
    {
      name: "TLS",
      helpMessage: "Time taken for SSL/TLS negotiation.",
      value: formatDuration(entry.timings.ssl, 2, "-"),
    },
    {
      name: "Send",
      helpMessage: "Time taken to send the HTTP request to the server.",
      value: formatDuration(entry.timings.send, 2, "-"),
    },
    {
      name: "Wait",
      helpMessage: "Time spent waiting for a response from the server.",
      value: formatDuration(entry.timings.wait, 2, "-"),
    },
    {
      name: "Receive",
      helpMessage: "Time taken to read the entire response from the server (or cache).",
      value: formatDuration(entry.timings.receive, 2, "-"),
    },
    {
      name: "Total",
      value: formatDuration(entry.parsedResponse.duration),
    },
  ];
}

function TimingsTab({ request }: TimingsTabProps) {
  const timings = getRequestTimings(request);
  return (
    <div className="flex flex-col gap-0 p-2">
      <Table className="text-xs">
        <TableBody>
          {timings.map(({ name, helpMessage, value }) => (
            <TableRow key={name} className="border-none bg-background hover:bg-background">
              <TableHead className="h-6 w-[30%] max-w-60 min-w-35 p-0 pr-1 pb-1">
                <div className="flex items-center gap-1">
                  <span>{name}</span>
                  {helpMessage != null && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button variant="ghost" size="icon-xs">
                            <CircleQuestionMark />
                          </Button>
                        }
                      />
                      <TooltipContent>
                        <p>{helpMessage}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableHead>
              <TableCell className="h-6 p-0 pb-1 wrap-break-word whitespace-normal">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TimingsTab;
