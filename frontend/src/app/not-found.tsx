"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Compass, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const { user } = useAuth();
  const dashboardLink = user ? `/${user.role}` : "/";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white flex flex-col items-center justify-center px-4 py-16 text-center animate-fade-up">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10 text-[#b9a9ff] border border-violet-500/20 shadow-2xl shadow-violet-500/10">
        <Compass className="h-10 w-10 animate-spin" style={{ animationDuration: "16s" }} />
      </div>

      <span className="text-xs font-mono uppercase tracking-widest text-[#b9a9ff] px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 mb-2">
        404 — NOT FOUND
      </span>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
        Page Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-zinc-400 leading-relaxed">
        The page you are looking for does not exist on the VOUCH platform, or access has been restricted by cryptographic permissions.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="default" asChild className="font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30 shadow-lg shadow-violet-600/20 text-xs">
          <Link href={dashboardLink} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>
              {user ? `Return to ${user.role.toUpperCase()} Dashboard` : "Return to Home"}
            </span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="text-xs font-mono border-white/10 hover:border-violet-500/30 hover:bg-white/[0.04]">
          <Link href="/open-problems" className="flex items-center gap-2">
            <span>Explore Open Problems</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
