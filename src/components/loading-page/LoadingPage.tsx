import { Spinner } from "@/components/ui/spinner";

function LoadingPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <Spinner size="xl" />
    </div>
  );
}

export default LoadingPage;
