"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
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
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="border-b border-white/[0.06] pb-6">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                My Project Applications
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                Track active project workspaces and review verified past initiatives with immutable ledger proofs.
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-28 animate-pulse rounded-2xl border border-white/[0.08] bg-[#0c0d12]" />
                <div className="h-28 animate-pulse rounded-2xl border border-white/[0.08] bg-[#0c0d12]" />
              </div>
            ) : applications.length === 0 ? (
              <Card className="p-12 text-center border-white/[0.08] bg-[#0c0d12]">
                <FileText className="mx-auto h-10 w-10 text-[#6f6f7b]" />
                <h3 className="mt-4 text-base font-bold text-white">No Applications Found</h3>
                <p className="mt-1 text-xs text-[#9d9da8]">
                  You haven&apos;t applied to any initiatives yet. Browse open industry problems to match with sponsors.
                </p>
                <Button asChild className="mt-6 font-semibold" size="sm">
                  <Link href="/open-problems">Browse Open Problems</Link>
                </Button>
              </Card>
            ) : (
              <>
                {/* SECTION 1: ACTIVE PROJECTS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">
                        Active Initiatives ({activeApplications.length})
                      </h2>
                      <Badge variant="teal" className="font-mono text-[10px]">
                        Workspace Available
                      </Badge>
                    </div>
                  </div>

                  {activeApplications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center text-xs text-[#6f6f7b]">
                      No currently active projects. Check back after matching or review invitations.
                    </div>
                  ) : (
                    activeApplications.map((app) => {
                      const canEnterWorkspace = app.member_status === "accepted" && app.charter_accepted;
                      return (
                        <Card
                          key={app.id}
                          className="p-6 transition-all border-white/[0.08] bg-[#0c0d12]/90 hover:border-white/[0.16]"
                        >
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div className="space-y-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-white">
                                  {app.title}
                                </h3>
                                <Badge
                                  variant={
                                    app.member_status === "accepted"
                                      ? "default"
                                      : app.member_status === "invited"
                                      ? "outline"
                                      : "subtle"
                                  }
                                  className="capitalize font-mono text-[10px]"
                                >
                                  {app.member_status}
                                </Badge>
                                <Badge variant="subtle" className="font-mono text-[10px] uppercase">
                                  {app.engagement_model}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#9d9da8] max-w-2xl leading-relaxed">
                                {app.public_summary}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9d9da8]">
                                <span>
                                  Sponsor: <strong className="text-white">{app.sponsor_name}</strong>
                                </span>
                                <span className="text-[#6f6f7b]">•</span>
                                {app.budget > 0 ? (
                                  <span className="font-bold text-emerald-400">
                                    ₹{app.budget.toLocaleString("en-IN")} Pool
                                  </span>
                                ) : (
                                  <span className="font-semibold text-[#b9a9ff]">
                                    Co-Authorship &amp; Credit
                                  </span>
                                )}
                                <span className="text-[#6f6f7b]">•</span>
                                <span suppressHydrationWarning>Applied on {new Date(app.joined_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2.5 shrink-0">
                              {app.charter_accepted ? (
                                <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
                                  <Unlock className="h-3.5 w-3.5" />
                                  <span>Charter v{app.charter_version} Accepted</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-1 font-mono text-xs font-semibold text-amber-300">
                                  <Lock className="h-3.5 w-3.5" />
                                  <span>Charter Acceptance Pending</span>
                                </div>
                              )}

                              {canEnterWorkspace ? (
                                <Button
                                  asChild
                                  id={`btn-enter-workspace-${app.project_id}`}
                                  size="sm"
                                  className="mt-1 gap-1.5 font-bold"
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
                                  className="mt-1 gap-1.5 font-bold text-amber-400 border-amber-500/30 hover:bg-amber-950/30"
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
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">
                        Completed Projects ({completedApplications.length})
                      </h2>
                      <Badge variant="subtle" className="font-mono text-[10px]">
                        Archived on Ledger
                      </Badge>
                    </div>
                  </div>

                  {completedApplications.map((app) => (
                    <Card
                      key={app.id}
                      className="p-6 border-white/[0.08] bg-[#0c0d12]/50"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-white">
                              {app.title}
                            </h3>
                            <Badge className="bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                              Closed
                            </Badge>
                            <Badge variant="subtle" className="font-mono text-[10px] uppercase">
                              {app.engagement_model}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#9d9da8] max-w-2xl leading-relaxed">
                            {app.public_summary}
                          </p>

                          {/* Final Outcome */}
                          {app.final_outcome && (
                            <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3 text-xs text-[#9d9da8]">
                              <strong className="text-white">Final Outcome: </strong>
                              {app.final_outcome}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9d9da8]">
                            <span>
                              Sponsor: <strong className="text-white">{app.sponsor_name}</strong>
                            </span>
                            <span className="text-[#6f6f7b]">•</span>
                            <span className="font-bold text-emerald-400">
                              ₹{app.budget.toLocaleString("en-IN")} Settled
                            </span>
                            <span className="text-[#6f6f7b]">•</span>
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
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
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
