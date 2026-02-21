import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      default: "size-4",
      xs: "size-2",
      sm: "size-3",
      lg: "size-7",
      xl: "size-9",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

function Spinner({ className, size, ...props }: React.ComponentProps<"svg"> & VariantProps<typeof spinnerVariants>) {
  return (
    <Loader2Icon role="status" aria-label="Loading" className={cn(spinnerVariants({ size, className }))} {...props} />
  );
}

export { Spinner };
