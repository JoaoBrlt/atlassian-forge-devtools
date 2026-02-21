import { Skeleton } from "@/components/ui/skeleton";

function RequestDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-2">
      <Skeleton className="h-4 w-full" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-[40%]" />
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-4 w-[70%]" />
          <Skeleton className="h-4 w-[50%]" />
        </div>
      ))}
    </div>
  );
}

export default RequestDetailsSkeleton;
