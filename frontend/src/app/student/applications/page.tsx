"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  Coins,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FolderGit2,
} from "lucide-react";
import { toast } from "sonner";

interface ApplicationItem {
  id: string;
  project_id: string;
  role: string;
  member_status: string;
  joined_at: string;
  title: string;
  public_summary: string;
  budget: number;
  engagement_model: string;
  project_status: string;
  final_outcome?: string;
  sponsor_name: string;
  charter_version: number;
  charter_accepted: boolean;
}

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      try {
        const res = await apiFetch<{ applications: ApplicationItem[] }>(
          "/api/student/applications"
        );
        setApplications(res.applications || []);
      } catch (err: any) {
        toast.error("Failed to load applications: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, []);

  const activeApplications = applications.filter(
    (a) => a.project_status !== "closed" && !a.project_id.startsWith("proj_past_")
  );

  const completedApplications = applications.filter(
    (a) => a.project_status === "closed" || a.project_id.startsWith("proj_past_")
  );

  return (
    <RoleGuard allowedRoles={["student", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="student" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                My Project Applications
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Track active project workspaces and review verified past initiatives with immutable ledger proofs.
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : applications.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-base font-bold">No Applications Found</h3>
                <p className="mt-1 text-xs text-slate-500">
                  You haven&apos;t applied to any initiatives yet. Browse open industry problems to match with sponsors.
                </p>
                <Button asChild className="mt-6 font-bold" size="sm">
                  <Link href="/open-problems">Browse Open Problems</Link>
                </Button>
              </Card>
            ) : (
              <>
                {/* SECTION 1: ACTIVE PROJECTS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Active Initiatives ({activeApplications.length})
                      </h2>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        Workspace Available
                      </Badge>
                    </div>
                  </div>

                  {activeApplications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
                      No currently active projects. Check back after matching or review invitations.
                    </div>
                  ) : (
                    activeApplications.map((app) => {
                      const canEnterWorkspace = app.member_status === "accepted" && app.charter_accepted;
                      return (
                        <Card
                          key={app.id}
                          className="p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                  {app.title}
                                </h3>
                                <Badge
                                  variant={app.member_status === "accepted" ? "default" : "outline"}
                                  className="capitalize text-xs font-bold"
                                >
                                  {app.member_status}
                                </Badge>
                                <Badge variant="subtle" className="text-xs uppercase">
                                  {app.engagement_model}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                                {app.public_summary}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                <span>
                                  Sponsor: <strong className="text-slate-700 dark:text-slate-300">{app.sponsor_name}</strong>
                                </span>
                                <span>•</span>
                                {app.budget > 0 ? (
                                  <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                    <Coins className="h-3.5 w-3.5" />
                                    Rs {app.budget.toLocaleString()} Pool
                                  </span>
                                ) : (
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    Co-Authorship &amp; Credit
                                  </span>
                                )}
                                <span>•</span>
                                <span suppressHydrationWarning>Applied on {new Date(app.joined_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              {app.charter_accepted ? (
                                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-50/60 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                                  <Unlock className="h-3.5 w-3.5" />
                                  <span>Charter v{app.charter_version} Accepted</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-50/60 px-3 py-1.5 text-xs font-bold text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                                  <Lock className="h-3.5 w-3.5" />
                                  <span>Charter Acceptance Pending</span>
                                </div>
                              )}

                              {canEnterWorkspace ? (
                                <Button
                                  asChild
                                  id={`btn-enter-workspace-${app.project_id}`}
                                  size="sm"
                                  className="mt-1 gap-1.5 font-bold bg-teal-600 hover:bg-teal-700 text-white"
                                >
                                  <Link href={`/projects/${app.project_id}/workspace`}>
                                    <FolderGit2 className="h-3.5 w-3.5" />
                                    <span>Enter Workspace</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              ) : (
                                <Button
                                  asChild
                                  id={`btn-review-charter-${app.project_id}`}
                                  size="sm"
                                  variant="outline"
                                  className="mt-1 gap-1.5 font-bold border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                                >
                                  <Link href={`/charters/${app.project_id}`}>
                                    <span>Review charter and accept</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>

                {/* SECTION 2: COMPLETED PROJECTS */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Completed Projects ({completedApplications.length})
                      </h2>
                      <Badge variant="subtle" className="text-[10px]">
                        Archived on Ledger
                      </Badge>
                    </div>
                  </div>

                  {completedApplications.map((app) => (
                    <Card
                      key={app.id}
                      className="p-6 border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {app.title}
                            </h3>
                            <Badge className="bg-slate-700 text-white text-xs font-bold">
                              Closed
                            </Badge>
                            <Badge variant="subtle" className="text-xs uppercase">
                              {app.engagement_model}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                            {app.public_summary}
                          </p>

                          {/* Final Outcome */}
                          {app.final_outcome && (
                            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                              <strong className="text-slate-900 dark:text-slate-100">Final Outcome: </strong>
                              {app.final_outcome}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span>
                              Sponsor: <strong className="text-slate-700 dark:text-slate-300">{app.sponsor_name}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              Rs {app.budget.toLocaleString()} Settled
                            </span>
                            <span>•</span>
                            <span suppressHydrationWarning>Closed project</span>
                          </div>
                        </div>

                        {/* Closed project buttons: View closed charter and View timeline. NEVER Enter Workspace */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                          <Button
                            asChild
                            id={`btn-view-closed-charter-${app.project_id}`}
                            size="sm"
                            variant="outline"
                            className="gap-1.5 font-semibold text-xs"
                          >
                            <Link href={`/charters/${app.project_id}`}>
                              <span>View closed charter</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            id={`btn-view-timeline-${app.project_id}`}
                            size="sm"
                            variant="outline"
                            className="gap-1.5 font-semibold text-xs"
                          >
                            <Link href={`/projects/${app.project_id}/timeline`}>
                              <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                              <span>View timeline</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
