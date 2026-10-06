"use client";

import React, { useState, useEffect } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import Link from "next/link";
import { Award, Wallet, Clock, Lock, ArrowRight, FolderGit2, ShieldCheck } from "lucide-react";
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

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="student" />
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Student Workspace
                  </h1>
                  <Badge variant={user?.newbie_badge ? "newbie" : "gold"}>
                    {user?.newbie_badge ? "NEWBIE BADGE" : `${user?.stars || "4.6"} ⭐`}
                  </Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Welcome, {user?.name}. Track your open applications, locked milestones, and verified credentials.
                </p>
              </div>
              <Button variant="default" asChild className="font-semibold">
                <Link href="/open-problems">
                  <span>Browse Open Problems</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Paid Earnings
                  </span>
                  <Wallet className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
                    {formatRupees(25783)}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">From closed project milestones</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Locked in Escrow
                  </span>
                  <Lock className="h-4 w-4 text-[#b9a9ff]" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-[#b9a9ff]">
                    {formatRupees(59500)}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Retinopathy initiative pool</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Pending Actions
                  </span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-amber-400">
                    {loading ? "..." : `${pendingCharters.length} Charter${pendingCharters.length === 1 ? "" : "s"}`}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Review terms to unlock brief</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Simulated Wallet
                  </span>
                  <Award className="h-4 w-4 text-[#9d9da8]" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                    {formatRupees(user?.wallet_balance || 25000)}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Transferable balance</p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Charter Acceptance Card */}
            {pendingCharters.length > 0 && (
              <Card className="border-[#8f7cff]/30 bg-[#8f7cff]/[0.06] p-6 backdrop-blur-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#b9a9ff]">
                      ⚡ Needs My Action: Pending Charter Acceptance ({pendingCharters.length})
                    </span>
                  </div>
                  {pendingCharters.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                    >
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">
                          Accept Charter v{proj.charter_version || 1}: {proj.title}
                        </h3>
                        <p className="text-xs text-[#9d9da8] max-w-2xl leading-relaxed">
                          Sponsor published Charter Agreement v{proj.charter_version || 1}. Accept the charter &amp; engagement model to unlock the confidential workspace and brief.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        asChild
                        id={`btn-dashboard-review-${proj.project_id}`}
                        className="font-semibold"
                      >
                        <Link href={`/charters/${proj.project_id}`}>Review Charter &amp; Accept</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Active Project Workspaces */}
            <div className="space-y-4">
              <Card className="border-white/[0.08] bg-[#0b0c10]/80">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <FolderGit2 className="h-5 w-5 text-emerald-400" />
                    <span>Active Project Workspaces ({activeWorkspaces.length})</span>
                  </CardTitle>
                  <Badge variant="subtle" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">Live</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
                  ) : activeWorkspaces.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center text-xs text-[#6f6f7b]">
                      No active workspaces yet. Review pending charters above or explore open problems.
                    </div>
                  ) : (
                    activeWorkspaces.map((proj) => (
                      <div
                        key={proj.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                      >
                        <div>
                          <div className="font-bold text-white">
                            {proj.title}
                          </div>
                          <p className="text-xs text-[#9d9da8] mt-0.5">
                            Accepted Member &bull; {proj.budget > 0 ? `Rs ${proj.budget.toLocaleString()} Escrow Pool` : "Knowledge-Sharing & Credit"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            asChild
                            id={`btn-dashboard-workspace-${proj.project_id}`}
                            className="gap-1.5 font-semibold"
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
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Timeline</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
