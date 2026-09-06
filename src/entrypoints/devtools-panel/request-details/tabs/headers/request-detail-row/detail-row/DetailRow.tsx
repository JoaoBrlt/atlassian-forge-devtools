import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface DetailRowProps {
  name: ReactNode;
  value: ReactNode;
  className?: string;
  isSeparated?: boolean;
}

function DetailRow({ name, value, className, isSeparated }: DetailRowProps) {
  const separatorClassName = isSeparated ? "border-t border-border pt-1" : undefined;
  return (
    <TableRow className="border-none bg-background hover:bg-background">
      <TableHead className={cn("h-6 w-[30%] max-w-60 min-w-35 p-0 pr-1 pb-1", separatorClassName, className)}>
        {name}
      </TableHead>
      <TableCell className={cn("h-6 p-0 pb-1 break-all whitespace-normal", separatorClassName)}>{value}</TableCell>
    </TableRow>
  );
}

export default DetailRow;
