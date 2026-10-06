"use client";

import React, { useState, useEffect } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import Link from "next/link";
import { Building2, Wallet, Lock, PlusCircle, ArrowRight, FolderGit2 } from "lucide-react";

export default function SponsorDashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch<any>("/api/sponsor/wallet");
        setWallet(res);
      } catch {}
    }
    loadData();
  }, []);

  return (
    <RoleGuard allowedRoles={["sponsor"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="sponsor" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                    Sponsor Console
                  </h1>
                  <Badge variant="default">Apex Health AI</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Manage funded initiatives, fund escrow lockers, and review ranked candidate teams.
                </p>
              </div>
              <Button variant="default" asChild>
                <Link href="/sponsor/post-problem">
                  <PlusCircle className="h-4 w-4" />
                  <span>Post New Problem</span>
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Link href="/sponsor/wallet" className="block transition hover:scale-[1.01]">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Sponsor Wallet
                    </span>
                    <Wallet className="h-4 w-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                      {formatRupees(wallet?.balance ?? user?.wallet_balance ?? 500000)}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Simulated balance for escrows &rarr;</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/sponsor/wallet" className="block transition hover:scale-[1.01]">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Committed in Locker
                    </span>
                    <Lock className="h-4 w-4 text-sky-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                      {formatRupees(wallet?.total_locked ?? 100000)}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Locked in Milestone Escrows &rarr;</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/sponsor/projects" className="block transition hover:scale-[1.01]">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Active Projects
                    </span>
                    <FolderGit2 className="h-4 w-4 text-slate-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      2 Initiatives
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Manage deliverables &amp; matchmaking &rarr;</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
