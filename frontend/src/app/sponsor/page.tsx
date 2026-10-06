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
import { Building2, Wallet, Lock, PlusCircle, ArrowRight, FolderGit2, HelpCircle, History } from "lucide-react";

export default function SponsorDashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [ratingHistory, setRatingHistory] = useState<any[]>([]);
  const [showRatingHelp, setShowRatingHelp] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch<any>("/api/sponsor/wallet");
        setWallet(res);
      } catch {}
      if (user?.id) {
        apiFetch<any>(`/api/users/${user.id}/public`)
          .then((res) => {
            if (res?.rating_timeline) setRatingHistory(res.rating_timeline);
          })
          .catch(() => {});
      }
    }
    loadData();
  }, [user?.id]);

  return (
    <RoleGuard allowedRoles={["sponsor"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="sponsor" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                    Sponsor Console
                  </h1>
                  <Badge variant="default">Apex Health AI</Badge>
                  <button
                    onClick={() => setShowRatingHelp(!showRatingHelp)}
                    className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300"
                  >
                    <HelpCircle className="h-3 w-3" />
                    <span>Why did my rating change?</span>
                  </button>
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

            {/* Why did my rating change card */}
            {showRatingHelp && (
              <div className="mb-8 rounded-2xl border border-teal-200 bg-teal-50/50 p-6 shadow-sm dark:border-teal-900/60 dark:bg-teal-950/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span>Why did my rating change? (Rating Audit History)</span>
                  </h3>
                  <button
                    onClick={() => setShowRatingHelp(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Every sponsor rating adjustment (e.g. withdrawal penalties, closed reviews, or mediator waivers) is anchored directly to the immutable ledger.
                </p>

                {ratingHistory.length === 0 ? (
                  <div className="mt-3 text-xs text-slate-500 italic">
                    No rating adjustments recorded yet. Current company rating: 4.7 ⭐.
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {ratingHistory.map((h, i) => (
                      <div
                        key={h.id || i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {h.reason}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(h.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500">
                            {h.old_rating?.toFixed(1)} &rarr; {h.new_rating?.toFixed(1)}
                          </span>
                          <span
                            className={`font-bold font-mono px-1.5 py-0.5 rounded text-[11px] ${
                              h.delta >= 0
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {h.delta >= 0 ? `+${h.delta?.toFixed(1)}` : h.delta?.toFixed(1)} ⭐
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
