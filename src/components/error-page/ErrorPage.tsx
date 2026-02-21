import { Button } from "@/components/ui/button";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { FallbackProps } from "react-error-boundary";

function getErrorStack(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return "An unexpected error has occurred.";
}

function ErrorPage({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive dark:bg-destructive/20">
        <TriangleAlert size="3rem" />
      </div>

      <div>
        <h1 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">Please try again or report the issue.</p>
      </div>

      <div className="w-full overflow-auto rounded-md border p-4 text-sm">
        <pre>{getErrorStack(error)}</pre>
      </div>

      <Button variant="destructive" onClick={resetErrorBoundary}>
        <RotateCcw />
        Try again
      </Button>
    </div>
  );
}

export default ErrorPage;
