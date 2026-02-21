import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

export interface ColumnResizeHandleProps extends ComponentProps<"div"> {
  isResizing?: boolean;
}

function ColumnResizeHandle({ isResizing, className, ...props }: ColumnResizeHandleProps) {
  return (
    <div
      className={cn(
        "absolute top-0 right-0 z-1 h-full w-1 cursor-col-resize touch-none select-none",
        isResizing && "bg-primary",
        className,
      )}
      {...props}
    />
  );
}

export default ColumnResizeHandle;
