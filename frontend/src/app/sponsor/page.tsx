"use client";

import React, { useState, useEffect } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import Link from "next/link";
import { Wallet, Lock, PlusCircle, FolderGit2 } from "lucide-react";

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
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Sponsor Console
                  </h1>
                  <Badge variant="default" className="font-mono text-[10px]">Apex Health AI</Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Manage funded initiatives, fund escrow lockers, and review ranked candidate teams.
                </p>
              </div>
              <Button variant="default" asChild className="font-semibold gap-1.5">
                <Link href="/sponsor/post-problem">
                  <PlusCircle className="h-4 w-4" />
                  <span>Post New Problem</span>
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Link href="/sponsor/wallet" className="block group">
                <Card className="h-full transition-all group-hover:border-white/[0.16] group-hover:bg-[#121218]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                      Sponsor Wallet
                    </span>
                    <Wallet className="h-4 w-4 text-[#b9a9ff]" />
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
                      {formatRupees(wallet?.balance ?? user?.wallet_balance ?? 500000)}
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-[#6f6f7b] group-hover:text-[#9d9da8] transition-colors">Simulated balance for escrows →</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/sponsor/wallet" className="block group">
                <Card className="h-full transition-all group-hover:border-white/[0.16] group-hover:bg-[#121218]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                      Committed in Locker
                    </span>
                    <Lock className="h-4 w-4 text-[#b9a9ff]" />
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-xl sm:text-2xl font-bold text-[#b9a9ff]">
                      {formatRupees(wallet?.total_locked ?? 100000)}
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-[#6f6f7b] group-hover:text-[#9d9da8] transition-colors">Locked in Milestone Escrows →</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/sponsor/projects" className="block group">
                <Card className="h-full transition-all group-hover:border-white/[0.16] group-hover:bg-[#121218]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                      Active Projects
                    </span>
                    <FolderGit2 className="h-4 w-4 text-[#9d9da8]" />
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                      2 Initiatives
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-[#6f6f7b] group-hover:text-[#9d9da8] transition-colors">Manage deliverables &amp; matchmaking →</p>
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
