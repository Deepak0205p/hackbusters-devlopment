import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0070f3] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-[#ededed] text-[#000000] hover:bg-[#ffffff] active:bg-[#d4d4d4]",
        primary:
          "bg-[#0070f3] text-white hover:bg-[#0060df] active:bg-[#0050bf]",
        destructive:
          "bg-[#e5484d] text-white hover:bg-[#d63b40]",
        outline:
          "border border-[#262626] bg-[#111111] text-[#ededed] hover:bg-[#171717] hover:border-[#333333]",
        secondary:
          "bg-[#1f1f1f] text-[#ededed] border border-[#262626] hover:bg-[#262626]",
        ghost: "text-[#888888] hover:text-[#ededed] hover:bg-[#171717]",
        link: "text-[#0070f3] underline-offset-4 hover:underline",
        sovereign:
          "bg-[#00e599] text-[#000000] font-medium hover:bg-[#00cc88]",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        sm: "h-7 rounded px-2.5 text-[11px]",
        lg: "h-9 rounded px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
