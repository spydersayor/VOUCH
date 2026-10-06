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
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
        <Compass className="h-10 w-10 animate-spin" style={{ animationDuration: "12s" }} />
      </div>

      <span className="text-sm font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
        404 — Not Found
      </span>

      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        Page Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400">
        The page you are looking for does not exist on the VOUCH platform, or access has been restricted by cryptographic permissions.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="default" asChild className="font-bold">
          <Link href={dashboardLink} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>
              {user ? `Return to ${user.role.toUpperCase()} Dashboard` : "Return to Home"}
            </span>
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/open-problems" className="flex items-center gap-2">
            <span>Explore Open Problems</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
