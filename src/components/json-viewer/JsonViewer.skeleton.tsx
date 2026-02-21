import { Skeleton } from "@/components/ui/skeleton";

const LINE_WIDTHS = [
  "10%",
  "20%",
  "50%",
  "30%",
  "40%",
  "30%",
  "40%",
  "60%",
  "30%",
  "40%",
  "30%",
  "40%",
  "50%",
  "20%",
  "10%",
];

function JsonViewerSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {LINE_WIDTHS.map((width, index) => (
        <div key={index} className="flex flex-row gap-2 overflow-hidden">
          {/* Line numbers */}
          <Skeleton className="h-3 w-10" />

          {/* Code lines */}
          <Skeleton className="h-3" style={{ width }} />
        </div>
      ))}
    </div>
  );
}

export default JsonViewerSkeleton;
