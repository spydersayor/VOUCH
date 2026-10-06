import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] transition-colors border",
  {
    variants: {
      variant: {
        default:
          "bg-violet-950/40 text-violet-300 border-violet-400/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]",
        newbie:
          "bg-sky-950/40 text-sky-300 border-sky-400/30",
        verified:
          "bg-emerald-950/40 text-emerald-300 border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
        flagged:
          "bg-rose-950/50 text-rose-300 border-rose-400/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]",
        gold:
          "bg-amber-950/40 text-amber-300 border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
        warning:
          "bg-amber-950/40 text-amber-300 border-amber-400/30",
        outline:
          "border-white/15 text-slate-300 bg-transparent hover:border-violet-400/40",
        subtle:
          "bg-white/[0.04] text-slate-400 border-white/[0.08]",
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

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
