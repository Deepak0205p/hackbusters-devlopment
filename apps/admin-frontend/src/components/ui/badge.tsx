import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-[#333333] bg-[#1f1f1f] text-[#ededed]",
        secondary:
          "border-[#262626] bg-[#171717] text-[#888888]",
        active:
          "border-[#0070f3]/40 bg-[#0070f3]/10 text-[#0070f3] font-semibold",
        success:
          "border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] font-semibold",
        warning:
          "border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623] font-semibold",
        destructive:
          "border-[#e5484d]/40 bg-[#e5484d]/10 text-[#e5484d] font-semibold",
        outline:
          "border-[#262626] bg-transparent text-[#888888]",
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
