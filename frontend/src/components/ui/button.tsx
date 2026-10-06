import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-gradient-to-r from-violet-900/60 via-[#181232] to-violet-950/60 text-white border border-violet-400/50 shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:border-violet-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:-translate-y-0.5",
        secondary:
          "rounded-full bg-white/[0.05] text-[#f3f2ff] border border-white/10 hover:bg-white/[0.09] hover:border-violet-400/40 hover:text-white",
        accent:
          "rounded-full bg-rose-600/80 text-white border border-rose-400/40 hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]",
        destructive:
          "rounded-full bg-rose-600/80 text-white border border-rose-400/40 hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]",
        outline:
          "rounded-full border border-white/15 bg-transparent text-[#f3f2ff] hover:bg-white/[0.05] hover:border-violet-400/50 hover:text-white",
        ghost:
          "rounded-lg hover:bg-white/[0.06] text-slate-300 hover:text-white",
        link: "text-violet-300 underline-offset-4 hover:underline hover:text-violet-200 normal-case font-sans",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-[11px]",
        lg: "h-12 px-7 text-xs tracking-widest",
        icon: "h-9 w-9 rounded-full",
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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
