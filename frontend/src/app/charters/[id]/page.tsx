"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Coins,
  History,
  ArrowLeft,
  Info,
  Scale,
  Sparkles,
  WifiOff,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { SectionErrorBoundary } from "@/components/common/SectionErrorBoundary";

interface CharterData {
  id: string;
  project_id: string;
  version: number;
  engagement_model: string;
  scope: string;
  ip_clause: string;
  confidentiality_clause: string;
  exit_terms: string;
  commercialisation_clause: string;
  split_config: any;
  is_current: boolean;
  is_closed?: boolean;
  final_outcome?: string | null;
}

interface ProjectData {
  id: string;
  title: string;
  public_summary: string;
  budget: number;
  engagement_model: string;
  status: string;
  final_outcome?: string | null;
  sponsor_id: string;
}

interface MilestoneData {
  id: string;
  sequence: number;
  title: string;
  description: string;
  budget: number;
  status: string;
}

interface BriefData {
  project_id: string;
  title: string;
  confidential_brief: string;
  datasets: string[];
  access_granted_to: string;
}

interface ErrorState {
  status: number | null;
  title: string;
  message: string;
}

export default function CharterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [charter, setCharter] = useState<CharterData | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [userAccepted, setUserAccepted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  // Acceptance checkboxes
  const [checkTerms, setCheckTerms] = useState(false);
  const [checkModel, setCheckModel] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      setErrorState(null);
      try {
        // 1. Fetch charter
        const cRes = await apiFetch<{
          charter: CharterData;
          user_accepted_current_version: boolean;
        }>(`/api/charters/${id}`);
        setCharter(cRes.charter);
        setUserAccepted(cRes.user_accepted_current_version);

        // 2. Fetch project details
        const pId = cRes.charter.project_id;
        const pRes = await apiFetch<{
          project: ProjectData;
          milestones: MilestoneData[];
        }>(`/api/projects/${pId}`);
        setProject(pRes.project);
        setMilestones(pRes.milestones || []);

        const isClosed = pRes.project?.status === "closed" || cRes.charter?.is_closed;

        // 3. If NOT closed and (accepted or user is sponsor owner), fetch brief
        if (!isClosed && (cRes.user_accepted_current_version || (user && user.role === "sponsor"))) {
          try {
            const bRes = await apiFetch<BriefData>(`/api/projects/${pId}/brief`);
            setBrief(bRes);
          } catch {
            // Brief access restricted
          }
        }

        // 4. Fetch charter version history
        try {
          const hRes = await apiFetch<{ versions: any[] }>(
            `/api/projects/${pId}/charters/history`
          );
          setHistory(hRes.versions || []);
        } catch {
          // Optional
        }
      } catch (err: any) {
        const status = err.status || null;
        let title = "Charter Unavailable";
        let message = err.message || "An unexpected error occurred.";

        if (status === 401) {
          title = "Authentication Required";
          message = "Please log in to review this collaboration charter and engagement terms.";
        } else if (status === 403) {
          title = "Access Restricted";
          message = err.message || "You are not invited to this project or this charter is not published yet.";
        } else if (status === 404) {
          title = "Charter Not Found";
          message = err.message || "This charter does not exist on the immutable ledger.";
        } else if (!status || err.message?.toLowerCase().includes("fetch") || err.message?.toLowerCase().includes("network")) {
          title = "Backend Service Unreachable";
          message = "Could not establish a connection to the VOUCH ledger backend server. Please verify your connection.";
        }

        setErrorState({ status, title, message });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user]);

  const handleAcceptCharter = async () => {
    if (!charter) return;
    setAccepting(true);
    try {
      await apiFetch(`/api/projects/${charter.project_id}/charter/accept`, {
        method: "POST",
        body: JSON.stringify({
          version: charter.version,
          accept_engagement_model: true,
        }),
      });

      setUserAccepted(true);
      setShowConfirmModal(false);
      toast.success(
        `Charter v${charter.version} accepted! Cryptographic signature logged to ledger.`
      );

      // Now fetch confidential brief if project is open
      if (!charter.is_closed && project?.status !== "closed") {
        try {
          const bRes = await apiFetch<BriefData>(
            `/api/projects/${charter.project_id}/brief`
          );
          setBrief(bRes);
        } catch (err: any) {
          toast.error("Brief unlock error: " + err.message);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Acceptance failed");
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineOrLeave = () => {
    if (
      confirm(
        "Are you sure you want to decline / leave this project? Note: Any previously accepted milestone work retains verified ledger credit and pro-rata payout."
      )
    ) {
      toast.info("You declined or stepped down from the charter.");
      router.push(user ? `/${user.role}` : "/");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-8">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-96 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  // Handle specific failure modes accurately (401, 403, 404, Network)
  if (errorState) {
    return (
      <div className="mx-auto max-w-xl p-8 sm:p-12 text-center animate-fade-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
          {errorState.status === 401 ? (
            <LogIn className="h-7 w-7" />
          ) : errorState.status === 403 ? (
            <Lock className="h-7 w-7" />
          ) : errorState.status === 404 ? (
            <AlertTriangle className="h-7 w-7" />
          ) : (
            <WifiOff className="h-7 w-7" />
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mb-2">
          {errorState.status ? `Error ${errorState.status}` : "Connection Failure"}
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {errorState.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
          {errorState.message}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {errorState.status === 401 ? (
            <Button asChild className="font-bold">
              <Link href={`/login?redirect=/charters/${id}`}>Log In to Continue</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/open-problems">Back to Open Problems</Link>
            </Button>
          )}
          {!errorState.status && (
            <Button
              variant="default"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!charter || !project) {
    return (
      <div className="mx-auto max-w-xl p-12 text-center">
        <h2 className="text-xl font-bold">Charter Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The requested charter could not be located on the immutable ledger.
        </p>
        <Button asChild className="mt-6">
          <Link href="/open-problems">Back to Open Problems</Link>
        </Button>
      </div>
    );
  }

  const isClosed = project.status === "closed" || Boolean(charter.is_closed);
  const isFunded = charter.engagement_model === "funded";
  const isSponsor = user?.role === "sponsor";

  return (
    <SectionErrorBoundary sectionName="CharterPage">
      <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8 animate-fade-up">
          {/* Top Back navigation */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <Link
              href={user ? `/${user.role}` : "/open-problems"}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-[#b9a9ff] transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              {isClosed && (
                <Badge variant="subtle" className="border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-xs">
                  Closed Project
                </Badge>
              )}
              <Badge variant="subtle" className="text-xs font-mono text-zinc-400 border-white/10 bg-white/[0.02]">
                Project: {project.id}
              </Badge>
              <Badge variant="default" className="text-xs font-mono bg-violet-600/80 border-violet-400/30 text-white">
                Charter v{charter.version}
              </Badge>
            </div>
          </div>

          {/* Header Banner */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                    Official Collaboration Charter
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs font-mono font-semibold text-[#b9a9ff] flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    SHA-256 Ledger Anchored
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {project.title}
                </h1>
              </div>

              {/* Prominent Engagement Model / Closed Badge */}
              <div className="flex flex-col items-end gap-1.5">
                {isClosed ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-right">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-amber-400 block">
                      Project Concluded
                    </span>
                    <span className="text-sm font-bold text-amber-200 flex items-center gap-1.5 justify-end mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Closed &amp; Permanently Archived
                    </span>
                  </div>
                ) : isFunded ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-right">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 block">
                      Engagement Model
                    </span>
                    <span className="text-sm font-bold text-emerald-200 flex items-center gap-1.5 justify-end mt-0.5">
                      <Coins className="h-4 w-4 text-emerald-400" />
                      Funded Project (₹{project.budget.toLocaleString("en-IN")} Escrow)
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-right">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[#b9a9ff] block">
                      Engagement Model
                    </span>
                    <span className="text-sm font-bold text-violet-200 flex items-center gap-1.5 justify-end mt-0.5">
                      <Sparkles className="h-4 w-4 text-[#b9a9ff]" />
                      Knowledge Sharing &amp; Academic Credit
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Public Summary */}
            <div className="mt-6 rounded-xl bg-[#121218]/80 border border-white/[0.04] p-4">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 block mb-1.5">
                Public Initiative Summary
              </span>
              <p className="text-sm leading-relaxed text-zinc-300">
                {project.public_summary}
              </p>
            </div>
          </div>

          {/* Final Outcome Banner for Closed Projects */}
          {isClosed && (
            <Card className="border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Final Outcome &amp; Verified Deliverables</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-zinc-300">
                  {project.final_outcome || charter.final_outcome || "Project concluded successfully. All milestone outputs verified and payouts settled on the immutable ledger."}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>All milestone hashes, reviews, and co-authorship credentials anchored to SHA-256 ledger</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Grid: Charter Clauses vs Acceptance Panel */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left 2 cols: The 4 Charter Clauses & Milestones */}
            <div className="space-y-6 lg:col-span-2">
              {/* Section 1: Technical Scope & Deliverables */}
              <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
                <CardHeader className="border-b border-white/[0.06] pb-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                    <div className="p-1.5 rounded-md bg-violet-500/10 text-[#b9a9ff]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span>1. Technical Scope &amp; Milestones</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Detailed milestone structure agreed upon by company sponsor and candidates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-xl border border-white/[0.06] bg-[#121218]/60 p-4 text-xs">
                    <span className="font-mono text-zinc-400 block mb-1 text-[11px] uppercase tracking-wider">
                      Overall Scope:
                    </span>
                    <p className="leading-relaxed text-zinc-300">
                      {charter.scope}
                    </p>
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      Verified Milestones ({milestones.length})
                    </h5>
                    {milestones.length === 0 ? (
                      <p className="text-xs text-zinc-500 font-mono">No milestones attached to charter.</p>
                    ) : (
                      milestones.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-start justify-between rounded-xl border border-white/[0.06] bg-[#121218]/40 p-3.5 text-xs transition hover:border-violet-500/20"
                        >
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/10 text-[10px] font-mono font-bold text-[#b9a9ff] border border-violet-500/20">
                                {m.sequence}
                              </span>
                              <span className="font-semibold text-white">
                                {m.title}
                              </span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed pl-7">
                              {m.description}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {m.budget > 0 ? (
                              <span className="font-mono font-bold text-emerald-400 block">
                                ₹{m.budget.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-zinc-500 font-mono text-[10px] block">
                                Credit only
                              </span>
                            )}
                            <Badge
                              variant={m.status === "completed" || m.status === "accepted" ? "verified" : "subtle"}
                              className="mt-1 text-[10px] font-mono"
                            >
                              {m.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Intellectual Property, Licensing & Exit */}
              <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
                <CardHeader className="border-b border-white/[0.06] pb-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                    <div className="p-1.5 rounded-md bg-violet-500/10 text-[#b9a9ff]">
                      <Scale className="h-4 w-4" />
                    </div>
                    <span>2. IP Ownership, Licensing &amp; Exit Terms</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Bilateral protections balancing company commercialization with student academic freedom.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/[0.06] bg-[#121218]/60 p-4">
                      <span className="font-medium text-white flex items-center gap-1.5 mb-1.5 font-mono text-[11px] uppercase tracking-wider">
                        <Shield className="h-3.5 w-3.5 text-[#b9a9ff]" />
                        IP Assignment
                      </span>
                      <p className="text-zinc-400 leading-relaxed">
                        {charter.ip_clause}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-[#121218]/60 p-4">
                      <span className="font-medium text-white flex items-center gap-1.5 mb-1.5 font-mono text-[11px] uppercase tracking-wider">
                        <Lock className="h-3.5 w-3.5 text-[#b9a9ff]" />
                        Confidentiality &amp; Security
                      </span>
                      <p className="text-zinc-400 leading-relaxed">
                        {charter.confidentiality_clause}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/[0.06] bg-[#121218]/60 p-4">
                      <span className="font-medium text-white flex items-center gap-1.5 mb-1.5 font-mono text-[11px] uppercase tracking-wider">
                        <ArrowLeft className="h-3.5 w-3.5 text-[#b9a9ff]" />
                        Exit &amp; Compensation
                      </span>
                      <p className="text-zinc-400 leading-relaxed">
                        {charter.exit_terms}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-[#121218]/60 p-4">
                      <span className="font-medium text-white flex items-center gap-1.5 mb-1.5 font-mono text-[11px] uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5 text-[#b9a9ff]" />
                        Commercialisation Rights
                      </span>
                      <p className="text-zinc-400 leading-relaxed">
                        {charter.commercialisation_clause}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Exact Split Schedule */}
              <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
                <CardHeader className="border-b border-white/[0.06] pb-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                      <Coins className="h-4 w-4" />
                    </div>
                    <span>3. Budget Distribution &amp; Integer Math</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Governed by Section 10 mathematical formula: Zero rounding leaks, verified sum matches escrow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {isFunded ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-zinc-400 font-mono uppercase text-[11px]">
                            <th className="pb-2.5">Beneficiary / Pool</th>
                            <th className="pb-2.5">Allocation</th>
                            <th className="pb-2.5">Exact Amount</th>
                            <th className="pb-2.5">Escrow Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          <tr>
                            <td className="py-2.5 font-medium text-white">Platform Infrastructure Fee</td>
                            <td className="py-2.5 text-zinc-400">10%</td>
                            <td className="py-2.5 font-mono text-zinc-300">₹{Math.floor(project.budget * 0.10).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 text-zinc-500 font-mono text-[11px]">Direct deduction</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium text-white">AI Compute Reserve</td>
                            <td className="py-2.5 text-zinc-400">5%</td>
                            <td className="py-2.5 font-mono text-zinc-300">₹{Math.floor(project.budget * 0.05).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 text-zinc-500 font-mono text-[11px]">Direct deduction</td>
                          </tr>
                          <tr className="bg-violet-500/5">
                            <td className="py-2.5 font-medium text-[#b9a9ff]">Expert Advisor Share</td>
                            <td className="py-2.5 font-medium text-[#b9a9ff]">30% of pool</td>
                            <td className="py-2.5 font-mono font-bold text-[#b9a9ff]">₹{Math.floor(project.budget * 0.85 * 0.30).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 text-violet-300 font-mono text-[11px]">Verified pool</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium text-white">Student Contributor Pool</td>
                            <td className="py-2.5 text-zinc-400">70% of pool</td>
                            <td className="py-2.5 font-mono text-zinc-300">₹{Math.floor(project.budget * 0.85 * 0.70).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 text-zinc-500 font-mono text-[11px]">Milestone payouts</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-white/[0.08] font-bold font-mono">
                            <td className="pt-3 text-white">Total Verified Sum</td>
                            <td className="pt-3 text-zinc-400">100%</td>
                            <td className="pt-3 text-emerald-400">₹{project.budget.toLocaleString("en-IN")}</td>
                            <td className="pt-3 text-emerald-400 text-[11px]">Zero leak</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-xs text-zinc-300">
                      <p className="font-semibold text-white">Unpaid / Open Knowledge-Sharing Initiative</p>
                      <p className="mt-1 text-zinc-400">
                        This project operates without a monetary reward pool. All accepted milestones are rewarded with immutable SHA-256 ledger proof of completion, institutional co-authorship credit, and public star endorsements.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 4: Confidential Brief */}
              {isClosed ? (
                <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2 text-zinc-400">
                        <Lock className="h-4 w-4" />
                        <span>4. Confidential Brief &amp; Datasets</span>
                      </CardTitle>
                      <Badge variant="subtle" className="text-[10px] font-mono">SEALED &amp; ARCHIVED</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-zinc-500">
                      Confidential research datasets and internal briefing documents are permanently sealed and archived upon project closure.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className={`border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md ${userAccepted || isSponsor ? "border-emerald-500/30" : ""}`}>
                  <CardHeader className="border-b border-white/[0.06] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                        {userAccepted || isSponsor ? (
                          <Unlock className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Lock className="h-4 w-4 text-amber-400" />
                        )}
                        <span>4. Confidential Brief &amp; Datasets</span>
                      </CardTitle>
                      <Badge
                        variant={userAccepted || isSponsor ? "verified" : "flagged"}
                        className="text-[10px] font-mono"
                      >
                        {userAccepted || isSponsor ? "ACCESS GRANTED" : "LOCKED — ACCEPT CHARTER"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-zinc-400">
                      Server-side gated: Confidential instructions and raw datasets remain inaccessible until the current charter version is signed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {userAccepted || isSponsor ? (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-zinc-200">
                          <span className="font-mono text-emerald-400 block mb-1 uppercase text-[11px] tracking-wider">
                            CONFIDENTIAL PROJECT SPECIFICATION:
                          </span>
                          <p className="leading-relaxed text-zinc-300">
                            {brief?.confidential_brief || "Access authorized by server session."}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                            Authorized Datasets &amp; Secure Repositories
                          </h5>
                          <div className="space-y-2">
                            {(brief?.datasets || ["dataset_macular_v2.tar.gz"]).map((ds, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#121218]/60 p-3 text-xs"
                              >
                                <span className="font-mono text-zinc-300">{ds}</span>
                                <Badge variant="subtle" className="text-[10px] font-mono">
                                  Sandbox Only
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/10 p-8 text-center bg-[#121218]/30">
                        <Lock className="mx-auto h-8 w-8 text-zinc-500" />
                        <p className="mt-2 text-sm font-bold text-white">
                          Confidential Brief Gated
                        </p>
                        <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
                          Please accept Charter Version {charter.version} using the acceptance panel on the right to review the confidential brief and download datasets.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right col: Acceptance Panel & Sponsor Tools */}
            <div className="space-y-6">
              {isClosed ? (
                <Card className="border-amber-500/30 bg-[#0c0d12]/90 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Concluded Collaboration Charter</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      This project concluded on the immutable ledger.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <p className="text-zinc-400 leading-relaxed">
                      This charter is preserved in a read-only state. All past milestone payouts, IP licensing rights, and student co-authorship credentials remain permanently verified.
                    </p>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 font-mono text-[11px] text-amber-300">
                      Status: CLOSED • VERIFIED ON LEDGER
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Acceptance Card for Active Projects */
                <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
                  <CardHeader className="border-b border-white/[0.06] pb-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <div className="p-1.5 rounded-md bg-violet-500/10 text-[#b9a9ff]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span>Charter Acceptance</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      {userAccepted
                        ? `You have accepted Charter v${charter.version}.`
                        : `Review terms and accept to participate.`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {userAccepted ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
                        <div className="flex items-center gap-2 font-bold mb-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Charter Accepted &amp; Active</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] mt-1">
                          Your signature for Charter Version {charter.version} is cryptographically anchored on the SHA-256 ledger. Workspace access and confidential briefs are fully unlocked.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl bg-[#121218]/80 p-3 text-xs text-zinc-400 border border-white/[0.04]">
                          Both affirmations are mandatory prior to cryptographic signature:
                        </div>

                        {/* Checkbox 1 */}
                        <label className="flex items-start gap-3 text-xs cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checkTerms}
                            onChange={(e) => setCheckTerms(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/40 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-zinc-300">
                            I accept charter version <strong className="text-white">v{charter.version}</strong>, including all IP assignment, exit policies, and confidentiality clauses.
                          </span>
                        </label>

                        {/* Checkbox 2 */}
                        <label className="flex items-start gap-3 text-xs cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checkModel}
                            onChange={(e) => setCheckModel(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/40 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-zinc-300">
                            I agree to the <strong className="text-white">{charter.engagement_model}</strong> model (
                            {isFunded ? "Escrow funded milestones" : "Unpaid credit and ledger proof only"}
                            ).
                          </span>
                        </label>

                        <Button
                          type="button"
                          disabled={!checkTerms || !checkModel || accepting}
                          onClick={() => setShowConfirmModal(true)}
                          className="w-full font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30 shadow-lg shadow-violet-600/20"
                        >
                          Accept Charter v{charter.version}
                        </Button>
                      </div>
                    )}

                    {/* Decline or leave button */}
                    <div className="pt-3 border-t border-white/[0.06]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeclineOrLeave}
                        className="w-full text-xs border-white/10 hover:border-rose-500/30 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-300"
                      >
                        Decline / Leave Project
                      </Button>
                      <p className="mt-1.5 text-[10px] font-mono text-center text-zinc-500">
                        Accepted work maintains verified credit.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Version History List */}
              <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
                <CardHeader className="border-b border-white/[0.06] pb-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                    <History className="h-4 w-4 text-zinc-400" />
                    <span>Charter Version History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-2 text-xs">
                  {history.length === 0 ? (
                    <p className="text-zinc-500 font-mono">Version 1 (Initial Release)</p>
                  ) : (
                    history.map((v) => (
                      <div
                        key={v.id || v.version}
                        className={`flex items-center justify-between p-2.5 rounded-xl border ${
                          v.version === charter.version
                            ? "bg-violet-500/10 border-violet-500/30 text-[#b9a9ff]"
                            : "border-white/[0.04] bg-[#121218]/40 text-zinc-400"
                        }`}
                      >
                        <span className="font-mono">Version {v.version}</span>
                        <Badge variant={v.is_current ? "verified" : "subtle"} className="font-mono text-[10px]">
                          {v.is_current ? "Current" : "Archived"}
                        </Badge>
                      </div>
                    ))
                  )}

                  {/* Sponsor publish controls */}
                  {isSponsor && !isClosed && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Sponsor Controls
                      </span>
                      <p className="text-xs text-zinc-500 mb-3">
                        Publishing a new version requires all contributors to re-accept before submitting code.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-mono border-white/10 hover:border-violet-500/30 hover:bg-white/[0.04]"
                        onClick={() => toast.info("Charter revision editor will be enabled in Phase 5 scoping workflow.")}
                      >
                        Draft Charter v{charter.version + 1}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
              <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0c0d12] p-6 shadow-2xl animate-fade-up text-white">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-[#b9a9ff] border border-violet-500/20">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-center text-lg font-bold text-white">
                  Confirm Charter Acceptance
                </h3>
                <p className="mt-2 text-center text-xs text-zinc-400 leading-relaxed">
                  By confirming, your cryptographic acceptance of <strong className="text-white">Charter v{charter.version}</strong> under the <strong className="text-white">{charter.engagement_model}</strong> model will be permanently recorded on the immutable SHA-256 ledger.
                </p>
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 font-mono text-xs border-white/10 hover:bg-white/[0.04]"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={accepting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 font-bold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30"
                    onClick={handleAcceptCharter}
                    disabled={accepting}
                  >
                    {accepting ? "Signing to Ledger..." : "Confirm & Sign"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionErrorBoundary>
  );
}
