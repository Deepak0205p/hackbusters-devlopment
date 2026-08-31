import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-gray-200 bg-gray-100 text-gray-900",
        secondary:
          "border-gray-200 bg-gray-50 text-gray-600",
        active:
          "border-blue-200 bg-blue-50 text-blue-700 font-semibold",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 font-semibold",
        destructive:
          "border-red-200 bg-red-50 text-red-700 font-semibold",
        outline:
          "border-gray-200 bg-transparent text-gray-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
