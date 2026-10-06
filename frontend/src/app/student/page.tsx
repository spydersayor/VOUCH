"use client";

import React, { useState, useEffect } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
<<<<<<< HEAD
import { Award, Wallet, Clock, Lock, ArrowRight, FolderGit2, ShieldCheck } from "lucide-react";
=======
import { Award, Wallet, Clock, Lock, CheckCircle2, ArrowRight, HelpCircle, Star, History } from "lucide-react";
>>>>>>> bc6518a (feat: implement Phase 7 shared rules, rehearsal engine, demo guide, admin governance, and exit flows)
import { RoleSidebar } from "@/components/shell/RoleSidebar";

interface ApplicationItem {
  id: string;
  project_id: string;
  role: string;
  member_status: string;
  title: string;
  public_summary: string;
  budget: number;
  engagement_model: string;
  project_status: string;
  charter_version: number;
  charter_accepted: boolean;
}

export default function StudentDashboard() {
  const { user } = useAuth();
<<<<<<< HEAD
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      try {
        const res = await apiFetch<{ applications: ApplicationItem[] }>(
          "/api/student/applications"
        );
        setApplications(res.applications || []);
      } catch {
        // Fallback to empty on error
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, []);

  const activeWorkspaces = applications.filter(
    (a) =>
      a.project_status !== "closed" &&
      !a.project_id.startsWith("proj_past_") &&
      a.member_status === "accepted" &&
      a.charter_accepted
  );

  const pendingCharters = applications.filter(
    (a) =>
      a.project_status !== "closed" &&
      !a.project_id.startsWith("proj_past_") &&
      (!a.charter_accepted || a.member_status !== "accepted")
  );
=======
  const [ratingHistory, setRatingHistory] = useState<any[]>([]);
  const [showRatingHelp, setShowRatingHelp] = useState(false);

  useEffect(() => {
    if (user?.id) {
      apiFetch<any>(`/api/users/${user.id}/public`)
        .then((res) => {
          if (res?.rating_timeline) setRatingHistory(res.rating_timeline);
        })
        .catch(() => {});
    }
  }, [user?.id]);
>>>>>>> bc6518a (feat: implement Phase 7 shared rules, rehearsal engine, demo guide, admin governance, and exit flows)

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="student" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                    Student Workspace
                  </h1>
                  <Badge variant={user?.newbie_badge ? "newbie" : "gold"}>
                    {user?.newbie_badge ? "NEWBIE BADGE" : `${user?.stars || "4.6"} ⭐`}
                  </Badge>
                  <button
                    onClick={() => setShowRatingHelp(!showRatingHelp)}
                    className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300"
                  >
                    <HelpCircle className="h-3 w-3" />
                    <span>Why did my rating change?</span>
                  </button>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Welcome, {user?.name}. Track your open applications, locked milestones, and verified credentials.
                </p>
              </div>
              <Button variant="default" asChild>
                <Link href="/open-problems">
                  <span>Browse Open Problems</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

<<<<<<< HEAD
            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Paid Earnings
                  </span>
                  <Wallet className="h-4 w-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {formatRupees(25783)}
=======
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
                  Ratings in VOUCH are governed strictly by immutable rules and closed milestone reviews across 5 explicit dimensions. Every star modification is tracked below with its rationale:
                </p>

                {ratingHistory.length === 0 ? (
                  <div className="mt-3 text-xs text-slate-500 italic">
                    No rating adjustments recorded yet. Current base rating: {user?.stars || 4.6} ⭐.
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

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Paid Earnings
              </span>
              <Wallet className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {formatRupees(25783)}
              </div>
              <p className="mt-1 text-xs text-slate-500">From closed project milestones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Locked in Escrow
              </span>
              <Lock className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {formatRupees(59500)}
              </div>
              <p className="mt-1 text-xs text-slate-500">Retinopathy initiative pool</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Actions
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                1 Charter
              </div>
              <p className="mt-1 text-xs text-slate-500">Review terms to unlock brief</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Simulated Wallet
              </span>
              <Award className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatRupees(user?.wallet_balance || 25000)}
              </div>
              <p className="mt-1 text-xs text-slate-500">Transferable balance</p>
            </CardContent>
          </Card>
        </div>

        {/* Needs My Action Card */}
        <div className="mt-8">
          <Card className="border-teal-200 bg-teal-50/40 dark:border-teal-900 dark:bg-teal-950/20">
            <CardHeader>
              <CardTitle className="text-lg text-teal-950 dark:text-teal-200">
                ⚡ Needs My Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-teal-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Accept Charter v1: Diabetic Retinopathy Detection
>>>>>>> bc6518a (feat: implement Phase 7 shared rules, rehearsal engine, demo guide, admin governance, and exit flows)
                  </div>
                  <p className="mt-1 text-xs text-slate-500">From closed project milestones</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Locked in Escrow
                  </span>
                  <Lock className="h-4 w-4 text-sky-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                    {formatRupees(59500)}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Retinopathy initiative pool</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pending Actions
                  </span>
                  <Clock className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {loading ? "..." : `${pendingCharters.length} Charter${pendingCharters.length === 1 ? "" : "s"}`}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Review terms to unlock brief</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Simulated Wallet
                  </span>
                  <Award className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {formatRupees(user?.wallet_balance || 25000)}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Transferable balance</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Project Workspace */}
            <div className="mt-8 space-y-4">
              <Card className="border-teal-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FolderGit2 className="h-5 w-5 text-teal-600" />
                    <span>Active Project Workspaces ({activeWorkspaces.length})</span>
                  </CardTitle>
                  <Badge className="bg-emerald-600 text-white text-xs">Live</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                  ) : activeWorkspaces.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
                      No active workspaces yet. Review pending charters below or explore open problems.
                    </div>
                  ) : (
                    activeWorkspaces.map((proj) => (
                      <div
                        key={proj.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {proj.title}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Accepted Member &bull; {proj.budget > 0 ? `Rs ${proj.budget.toLocaleString()} Escrow Pool` : "Knowledge-Sharing & Credit"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            asChild
                            id={`btn-dashboard-workspace-${proj.project_id}`}
                            className="gap-1.5 font-bold bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            <Link href={`/projects/${proj.project_id}/workspace`}>
                              <span>Enter Workspace</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            id={`btn-dashboard-timeline-${proj.project_id}`}
                            className="gap-1.5 font-semibold text-xs"
                          >
                            <Link href={`/projects/${proj.project_id}/timeline`}>
                              <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                              <span>Timeline</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Pending Charter Acceptance Card */}
              {pendingCharters.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
                  <CardHeader>
                    <CardTitle className="text-base text-amber-950 dark:text-amber-200">
                      ⚡ Pending Charter Acceptance ({pendingCharters.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingCharters.map((proj) => (
                      <div
                        key={proj.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {proj.title}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Review terms &amp; engagement model to unlock the confidential workspace and brief.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          id={`btn-dashboard-review-${proj.project_id}`}
                          className="border-amber-400 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                        >
                          <Link href={`/charters/${proj.project_id}`}>Review charter and accept</Link>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
