"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the real error to the browser console as requested
    console.error("VOUCH Application Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-900/60 dark:bg-slate-900 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {error?.message || "An unexpected error occurred while rendering this page."}
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-slate-400">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>

          <Button
            asChild
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs"
          >
            <Link href="/">
              <Home className="h-3.5 w-3.5" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
