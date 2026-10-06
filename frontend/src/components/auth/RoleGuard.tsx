"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("student" | "expert" | "sponsor" | "admin")[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm dark:border-rose-900 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
            <ShieldAlert className="h-7 w-7 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Access Restricted
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Your current account role (<strong>{user.role}</strong>) does not
            have permission to view this view. Required role:{" "}
            <strong>{allowedRoles.join(" or ")}</strong>.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="default"
              onClick={() => router.push(`/${user.role}`)}
            >
              Go to My {user.role.toUpperCase()} Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
