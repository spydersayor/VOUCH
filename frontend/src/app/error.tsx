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
    <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white flex items-center justify-center p-6 animate-fade-up">
      <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-[#0c0d12]/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-500/10">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">
            Something went wrong
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {error?.message || "An unexpected error occurred while rendering this page."}
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-zinc-500">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 text-xs font-mono border-white/10 hover:bg-white/[0.04] text-zinc-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>

          <Button
            asChild
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs border border-violet-400/30"
          >
            <Link href="/">
              <Home className="h-3.5 w-3.5" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
