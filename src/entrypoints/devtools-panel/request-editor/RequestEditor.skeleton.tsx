import { Skeleton } from "@/components/ui/skeleton";

function RequestEditorSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-2">
      <Skeleton className="h-4 w-full" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-[40%]" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
      ))}
    </div>
  );
}

export default RequestEditorSkeleton;
