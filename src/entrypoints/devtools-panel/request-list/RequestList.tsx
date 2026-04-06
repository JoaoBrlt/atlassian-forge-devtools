import ResponseStatusBadge from "@/components/response-status-badge/ResponseStatusBadge";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ColumnResizeHandle from "@/entrypoints/devtools-panel/request-list/column-resize-handle/ColumnResizeHandle";
import { cn } from "@/lib/utils";
import { AtlassianEntry } from "@/types/atlassian";
import { formatSize } from "@/utils/size-utils";
import { requestListColumnVisibility } from "@/utils/storage-utils";
import { isBlank } from "@/utils/string-utils";
import { formatDuration } from "@/utils/time-utils";
import {
  createColumnHelper,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  Updater,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";

export interface RequestListProps {
  filter: string;
  requests: AtlassianEntry[];
  selectedRequest?: AtlassianEntry;
  onSelectRequest: (request: AtlassianEntry) => void;
}

const columnHelper = createColumnHelper<AtlassianEntry>();

const columns = [
  columnHelper.accessor("parsedRequest.type", {
    id: "type",
    header: "Type",
    size: 90,
  }),
  columnHelper.accessor("parsedResponse.status", {
    id: "status",
    header: "Status",
    size: 80,
    cell: (props) => {
      const entry = props.row.original;
      return <ResponseStatusBadge response={entry.parsedResponse} />;
    },
  }),
  columnHelper.accessor("parsedRequest.functionKey", {
    id: "functionKey",
    header: "Function",
    size: 80,
  }),
  columnHelper.accessor("parsedRequest.method", {
    id: "method",
    header: "Method",
    size: 80,
  }),
  columnHelper.accessor("parsedRequest.path", {
    id: "path",
    header: "Path",
    size: 160,
  }),
  columnHelper.accessor("parsedRequest.context.siteUrl", {
    id: "siteUrl",
    header: "Site URL",
    size: 220,
  }),
  columnHelper.accessor("parsedRequest.context.cloudId", {
    id: "cloudId",
    header: "Cloud ID",
    size: 260,
  }),
  columnHelper.accessor("parsedRequest.context.appVersion", {
    id: "appVersion",
    header: "App Version",
    size: 80,
  }),
  columnHelper.accessor("parsedRequest.context.environmentType", {
    id: "environmentType",
    header: "Environment Type",
    size: 120,
  }),
  columnHelper.accessor("parsedRequest.context.environmentId", {
    id: "environmentId",
    header: "Environment ID",
    size: 260,
  }),
  columnHelper.accessor("parsedRequest.context.extensionType", {
    id: "extensionType",
    header: "Extension Type",
    size: 220,
  }),
  columnHelper.accessor("parsedRequest.context.extensionId", {
    id: "extensionId",
    header: "Extension ID",
    size: 260,
  }),
  columnHelper.accessor("parsedRequest.context.moduleKey", {
    id: "moduleKey",
    header: "Module Key",
    size: 120,
  }),
  columnHelper.accessor("parsedRequest.context.localId", {
    id: "localId",
    header: "Local ID",
    size: 220,
  }),
  columnHelper.accessor("parsedResponse.transferredSize", {
    id: "transferredSize",
    header: "Size",
    size: 80,
    cell: (props) => {
      const value = props.getValue<number | undefined>();
      if (value == null) {
        return null;
      }
      return formatSize(value);
    },
  }),
  columnHelper.accessor("parsedResponse.duration", {
    id: "time",
    header: "Time",
    size: 80,
    cell: (props) => {
      const value = props.getValue<number | undefined>();
      if (value == null) {
        return null;
      }
      return formatDuration(value);
    },
  }),
];

const filterByPathOrFunctionKey: FilterFn<AtlassianEntry> = (row, _columnId, filterValue: string) => {
  const normalizedFilter = (filterValue ?? "").trim().toLowerCase();
  if (isBlank(normalizedFilter)) {
    return true;
  }
  const path = (row.getValue<string>("path") ?? "").toLowerCase();
  const functionKey = (row.getValue<string>("functionKey") ?? "").toLowerCase();
  return path.includes(normalizedFilter) || functionKey.includes(normalizedFilter);
};

function RequestList({ filter, requests, selectedRequest, onSelectRequest }: RequestListProps) {
  const globalFilter = filter ?? "";
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    type: false,
    status: true,
    functionKey: true,
    method: true,
    path: true,
    siteUrl: false,
    cloudId: false,
    appVersion: false,
    environmentType: false,
    environmentId: false,
    extensionType: false,
    extensionId: false,
    moduleKey: false,
    localId: false,
    transferredSize: true,
    time: true,
  });

  useEffect(() => {
    // Retrieve the column visibility state from extension storage
    requestListColumnVisibility
      .getValue()
      .then((value) => {
        if (value != null) {
          console.info("Successfully retrieved column visibility from extension storage.");
          setColumnVisibility(value);
        }
      })
      .catch((error) => {
        console.error("Failed to retrieve column visibility from extension storage:", error);
      });
  }, []);

  const handleColumnVisibilityChange = (updater: Updater<VisibilityState>) => {
    // Update the column visibility state
    setColumnVisibility((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      // Store the updated column visibility state in extension storage
      requestListColumnVisibility
        .setValue(next)
        .then(() => console.info("Successfully stored column visibility in extension storage."))
        .catch((error) => console.error("Failed to store column visibility in extension storage:", error));

      return next;
    });
  };

  const table = useReactTable({
    data: requests,
    columns: columns,
    state: {
      globalFilter,
      columnVisibility,
    },
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: filterByPathOrFunctionKey,
    onGlobalFilterChange: () => {},
    onColumnVisibilityChange: handleColumnVisibilityChange,
    defaultColumn: {
      minSize: 60,
      size: 80,
    },
  });

  return (
    <div className="relative h-full w-full overflow-auto">
      <Table className="w-full table-fixed border-separate border-spacing-0 text-xs">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <ContextMenu key={headerGroup.id}>
              <ContextMenuTrigger render={<TableRow className="sticky top-0 z-10 bg-muted hover:bg-muted" />}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative h-8 border-r border-b border-border p-1 last:border-r-0"
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanResize() && (
                      <ColumnResizeHandle
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => header.column.resetSize()}
                        isResizing={header.column.getIsResizing()}
                      />
                    )}
                  </TableHead>
                ))}
              </ContextMenuTrigger>
              <ContextMenuContent>
                {table.getAllLeafColumns().map((column) => (
                  <ContextMenuCheckboxItem
                    key={column.id}
                    className="cursor-pointer"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}
                  >
                    {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                  </ContextMenuCheckboxItem>
                ))}
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(row.original === selectedRequest && "bg-muted hover:bg-muted")}
              onClick={() => onSelectRequest(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="cursor-pointer truncate border-r border-b border-border p-1 last:border-r-0"
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default RequestList;
