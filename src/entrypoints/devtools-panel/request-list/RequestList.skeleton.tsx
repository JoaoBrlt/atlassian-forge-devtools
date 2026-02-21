import { Skeleton } from "@/components/ui/skeleton";

function RequestListSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="flex flex-row gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export default RequestListSkeleton;
