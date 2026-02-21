import ErrorPage from "@/components/error-page/ErrorPage";
import LoadingPage from "@/components/loading-page/LoadingPage";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import App from "./App";
import "@/index.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <ErrorBoundary FallbackComponent={ErrorPage}>
          <Suspense fallback={<LoadingPage />}>
            <App />
          </Suspense>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);
