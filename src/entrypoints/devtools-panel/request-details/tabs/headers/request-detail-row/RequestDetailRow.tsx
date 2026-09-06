import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { type ReactNode, useState } from "react";
import DetailRow from "./detail-row/DetailRow";

export interface RequestDetail {
  name: string;
  value: ReactNode;
  parts?: RequestDetail[];
}

export interface RequestDetailRowProps {
  detail: RequestDetail;
}

function RequestDetailRow({ detail: { name, value, parts } }: RequestDetailRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandable = parts != null && parts.length > 0;

  const handleToggle = () => {
    setIsExpanded((expanded) => !expanded);
  };

  return (
    <>
      <DetailRow
        name={
          isExpandable ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-4 rounded-sm text-muted-foreground"
                aria-expanded={isExpanded}
                title={isExpanded ? "Collapse" : "Expand"}
                onClick={handleToggle}
              >
                {isExpanded ? <ChevronDown /> : <ChevronRight />}
              </Button>
              <span>{name}</span>
            </div>
          ) : (
            name
          )
        }
        value={value}
      />
      {isExpanded &&
        parts?.map((part, index) => (
          <DetailRow key={`${part.name}-${index}`} name={part.name} value={part.value} className="pl-5" />
        ))}
    </>
  );
}

export default RequestDetailRow;
