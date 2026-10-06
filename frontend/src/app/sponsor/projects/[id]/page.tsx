"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { ProsConsPanel } from "@/components/pros-cons/ProsConsPanel";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Lock,
  Unlock,
  Play,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Sparkles,
  FileText,
  History,
  ShieldCheck,
  Send,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function SponsorProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [charter, setCharter] = useState<any>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Charter editing state
  const [showCharterEdit, setShowCharterEdit] = useState(false);
  const [newScope, setNewScope] = useState("");
  const [newIpClause, setNewIpClause] = useState("");
  const [newConfidentiality, setNewConfidentiality] = useState("");
  const [newExitTerms, setNewExitTerms] = useState("");
  const [newCommercialisation, setNewCommercialisation] = useState("");
  const [publishingCharter, setPublishingCharter] = useState(false);

  // Locking & starting state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAllData = async () => {
    if (!id) return;
    try {
      // 1. Project details & milestones
      const pRes = await apiFetch<any>(`/api/projects/${id}`);
      setProject(pRes.project);
      setMilestones(pRes.milestones || []);

      // 2. Charter details
      try {
        const cRes = await apiFetch<any>(`/api/projects/${id}/charter`);
        setCharter(cRes.charter);
        setNewScope(cRes.charter?.scope || "");
        setNewIpClause(cRes.charter?.ip_clause || "");
        setNewConfidentiality(cRes.charter?.confidentiality_clause || "");
        setNewExitTerms(cRes.charter?.exit_terms || "");
        setNewCommercialisation(cRes.charter?.commercialisation_clause || "");
      } catch {}

      // 3. Matchmaking
      try {
        const mRes = await apiFetch<any>(`/api/projects/${id}/matchmaking`);
        setMatchData(mRes);
      } catch (err: any) {
        // Access control error if not sponsor
      }

      // 4. Wallet & Escrow summary
      try {
        const wRes = await apiFetch<any>("/api/sponsor/wallet");
        setWallet(wRes);
      } catch {}

      // 5. Activity stream
      try {
        const actRes = await apiFetch<any>(`/api/projects/${id}/activity`);
        setActivity(actRes.activity || []);
      } catch {}
    } catch (err: any) {
      toast.error("Failed to load project: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  // Lock milestone in escrow
  const handleLockMilestone = async (milestoneId: string, budget: number) => {
    setActionLoading(`lock_${milestoneId}`);
    try {
      await apiFetch(`/api/projects/${id}/milestones/${milestoneId}/lock`, {
        method: "POST",
        body: JSON.stringify({ amount: budget }),
      });
      toast.success(`Rs ${budget.toLocaleString()} locked into milestone escrow!`);
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to lock milestone");
    } finally {
      setActionLoading(null);
    }
  };

  // Start milestone (enforcing lock)
  const handleStartMilestone = async (milestoneId: string) => {
    setActionLoading(`start_${milestoneId}`);
    try {
      await apiFetch(`/api/projects/${id}/milestones/${milestoneId}/start`, {
        method: "POST",
      });
      toast.success("Milestone started! Contributor work has commenced.");
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to start milestone");
    } finally {
      setActionLoading(null);
    }
  };

  // Invite candidate
  const handleInvite = async (candidateId: string, role: string) => {
    setActionLoading(`invite_${candidateId}`);
    try {
      await apiFetch(`/api/projects/${id}/invite`, {
        method: "POST",
        body: JSON.stringify({ candidate_id: candidateId, role }),
      });
      toast.success("Invitation sent & recorded to immutable ledger!");
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to invite candidate");
    } finally {
      setActionLoading(null);
    }
  };

  // Publish new charter version
  const handlePublishCharter = async () => {
    setPublishingCharter(true);
    try {
      const res = await apiFetch<any>(`/api/projects/${id}/charter`, {
        method: "POST",
        body: JSON.stringify({
          scope: newScope,
          ip_clause: newIpClause,
          confidentiality_clause: newConfidentiality,
          exit_terms: newExitTerms,
          commercialisation_clause: newCommercialisation,
          engagement_model: project?.engagement_model || "funded",
        }),
      });
      toast.success(`Charter version ${res.version} published! All members notified.`);
      setShowCharterEdit(false);
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish charter");
    } finally {
      setPublishingCharter(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["sponsor", "admin"]}>
        <div className="flex min-h-[calc(100vh-4rem)]">
          <RoleSidebar role="sponsor" />
          <main className="flex-1 p-8">
            <div className="mx-auto max-w-5xl space-y-4">
              <div className="h-10 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          </main>
        </div>
      </RoleGuard>
    );
  }

  if (!project) {
    return (
      <RoleGuard allowedRoles={["sponsor", "admin"]}>
        <div className="flex min-h-[calc(100vh-4rem)]">
          <RoleSidebar role="sponsor" />
          <main className="flex-1 p-12 text-center">
            <h2 className="text-xl font-bold">Project Not Found</h2>
            <Button asChild className="mt-4">
              <Link href="/sponsor/projects">Back to Initiatives</Link>
            </Button>
          </main>
        </div>
      </RoleGuard>
    );
  }

  // Calculate locker stats
  const totalBudget = project.budget || 0;
  const fundedMilestones = milestones.filter((m) => m.status === "funded" || m.status === "in_progress" || m.status === "accepted");
  const fundedAmount = fundedMilestones.reduce((sum, m) => sum + (m.budget || 0), 0);
  const releasedAmount = milestones.filter((m) => m.status === "accepted").reduce((sum, m) => sum + (m.budget || 0), 0);
  const remainingAmount = Math.max(0, totalBudget - fundedAmount);

  return (
    <RoleGuard allowedRoles={["sponsor", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="sponsor" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                    {project.title}
                  </h1>
                  <Badge variant="subtle" className="uppercase text-xs">
                    {project.engagement_model}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {project.sensitivity_label || "Confidential"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500 max-w-2xl">
                  {project.public_summary}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="text-xs font-bold">
                  <Link href={`/charters/${id}`}>
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    <span>Public Charter View</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Step 5: Locker & Escrow Card */}
            <Card className="border-teal-500/30 bg-gradient-to-br from-teal-50/40 via-white to-slate-50 dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      Escrow Locker Status
                    </span>
                    <Badge variant="subtle" className="text-[10px]">GUARANTEED RUPEES</Badge>
                  </div>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      Rs {fundedAmount.toLocaleString()} Locked
                    </span>
                    <span className="text-xs text-slate-500">
                      of Rs {totalBudget.toLocaleString()} Total Commitment
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button asChild size="sm" variant="outline" className="font-bold text-xs">
                    <Link href="/sponsor/wallet">
                      <Coins className="mr-1 h-3.5 w-3.5 text-teal-600" />
                      <span>Wallet (Rs {(wallet?.balance || 0).toLocaleString()})</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Locker Breakdown Bar */}
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-200/60 pt-4 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Funded in Escrow:</span>
                  <div className="font-bold text-teal-600 dark:text-teal-400">
                    Rs {fundedAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Released Payouts:</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    Rs {releasedAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Remaining to Fund:</span>
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Rs {remainingAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>

            {/* Milestones & Escrow Enforcement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">
                  Milestones &amp; Escrow Locking Enforcement
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Per platform rule: A funded milestone cannot start before it is locked in escrow.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {milestones.map((m) => {
                  const isLocked = m.status === "funded" || m.status === "in_progress" || m.status === "accepted";
                  const isInProgress = m.status === "in_progress";
                  return (
                    <div
                      key={m.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            M{m.sequence}
                          </Badge>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {m.title}
                          </h4>
                          <Badge
                            variant={isLocked ? "default" : "subtle"}
                            className="capitalize text-[10px]"
                          >
                            {m.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{m.description}</p>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Rs {m.budget.toLocaleString()} Escrow Target
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isLocked ? (
                          <Button
                            size="sm"
                            disabled={actionLoading === `lock_${m.id}`}
                            onClick={() => handleLockMilestone(m.id, m.budget)}
                            className="gap-1.5 font-bold text-xs"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>{actionLoading === `lock_${m.id}` ? "Locking..." : "Lock in Escrow"}</span>
                          </Button>
                        ) : !isInProgress && m.status !== "accepted" ? (
                          <Button
                            size="sm"
                            disabled={actionLoading === `start_${m.id}`}
                            onClick={() => handleStartMilestone(m.id)}
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>{actionLoading === `start_${m.id}` ? "Starting..." : "Start Milestone"}</span>
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Active / Funded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Step 2 & 3: Candidate Matchmaking & Pros/Cons */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold">
                      Ranked Matchmaking Candidates
                    </CardTitle>
                    <Badge variant="subtle" className="text-[10px]">
                      5-FACTOR ALGORITHM
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Formula: 0.50 skill + 0.25 verified projects + 0.15 stars + 0.10 availability + newbie boost.
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Conflict Notice if any */}
                {matchData?.conflicted_candidates?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-50/40 p-4 dark:bg-amber-950/20">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Excluded Candidates (Declared Conflicts of Interest Logged to Ledger)</span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {matchData.conflicted_candidates.map((c: any) => (
                        <div key={c.candidate_id} className="text-xs text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-slate-100">{c.name}</strong> ({c.role}): {c.conflict_reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ranked Students */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ranked Student Contributors ({matchData?.ranked_students?.length || 0})
                  </h4>
                  <div className="space-y-4">
                    {(matchData?.ranked_students || []).map((cand: any, idx: number) => (
                      <div
                        key={cand.candidate_id}
                        className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 space-y-4"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs font-mono">
                                #{idx + 1}
                              </Badge>
                              <h5 className="font-bold text-base text-slate-900 dark:text-white">
                                {cand.name}
                              </h5>
                              {cand.is_newbie && (
                                <Badge variant="subtle" className="text-[10px] text-teal-700">
                                  Newbie Boost
                                </Badge>
                              )}
                              {cand.stars && (
                                <span className="text-xs font-bold text-amber-600">
                                  {cand.stars}⭐
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{cand.headline}</p>
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                              <strong>Why Ranked #{idx + 1}:</strong> {cand.reason_summary}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-teal-800 dark:text-teal-200">
                              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                              <span className="text-sm font-black">{cand.score_pct}% Fit</span>
                            </div>
                            <Button
                              size="sm"
                              disabled={actionLoading === `invite_${cand.candidate_id}`}
                              onClick={() => handleInvite(cand.candidate_id, "student")}
                              className="gap-1 font-bold text-xs"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>{actionLoading === `invite_${cand.candidate_id}` ? "Inviting..." : "Invite Contributor"}</span>
                            </Button>
                          </div>
                        </div>

                        {/* Pros and Cons Panel */}
                        {cand.pros_cons && (
                          <ProsConsPanel
                            data={cand.pros_cons}
                            candidateId={cand.candidate_id}
                            candidateName={cand.name}
                            title="Candidate Track Record &amp; Review Metrics"
                            onReplyAdded={loadAllData}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ranked Experts */}
                <div className="space-y-3 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ranked Expert Advisors ({matchData?.ranked_experts?.length || 0})
                  </h4>
                  <div className="space-y-4">
                    {(matchData?.ranked_experts || []).map((cand: any, idx: number) => (
                      <div
                        key={cand.candidate_id}
                        className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 space-y-4"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs font-mono">
                                Advisor #{idx + 1}
                              </Badge>
                              <h5 className="font-bold text-base text-slate-900 dark:text-white">
                                {cand.name}
                              </h5>
                              {cand.stars && (
                                <span className="text-xs font-bold text-amber-600">
                                  {cand.stars}⭐
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{cand.headline}</p>
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                              <strong>Advisory Fit:</strong> {cand.reason_summary}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-teal-800 dark:text-teal-200">
                              <span className="text-sm font-black">{cand.score_pct}% Fit</span>
                            </div>
                            <Button
                              size="sm"
                              disabled={actionLoading === `invite_${cand.candidate_id}`}
                              onClick={() => handleInvite(cand.candidate_id, "expert")}
                              className="gap-1 font-bold text-xs"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>{actionLoading === `invite_${cand.candidate_id}` ? "Inviting..." : "Invite as Lead Expert"}</span>
                            </Button>
                          </div>
                        </div>

                        {/* Pros and Cons Panel */}
                        {cand.pros_cons && (
                          <ProsConsPanel
                            data={cand.pros_cons}
                            candidateId={cand.candidate_id}
                            candidateName={cand.name}
                            title="Expert Track Record &amp; Review Metrics"
                            onReplyAdded={loadAllData}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charter Editor & Versioning */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">
                    Charter Governance &amp; Version History (v{charter?.version || 1})
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Updating any clause creates an incremented version and requires contributors to re-accept terms before accessing the brief.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCharterEdit(!showCharterEdit)}
                  className="font-bold text-xs"
                >
                  {showCharterEdit ? "Cancel Editing" : "Edit & Publish New Version"}
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {showCharterEdit ? (
                  <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Scope of Work
                      </label>
                      <textarea
                        rows={2}
                        value={newScope}
                        onChange={(e) => setNewScope(e.target.value)}
                        className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          IP Clause
                        </label>
                        <textarea
                          rows={2}
                          value={newIpClause}
                          onChange={(e) => setNewIpClause(e.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Confidentiality Clause
                        </label>
                        <textarea
                          rows={2}
                          value={newConfidentiality}
                          onChange={(e) => setNewConfidentiality(e.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Exit Terms
                        </label>
                        <textarea
                          rows={2}
                          value={newExitTerms}
                          onChange={(e) => setNewExitTerms(e.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Commercialisation Clause
                        </label>
                        <textarea
                          rows={2}
                          value={newCommercialisation}
                          onChange={(e) => setNewCommercialisation(e.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        disabled={publishingCharter}
                        onClick={handlePublishCharter}
                        className="gap-1.5 font-bold"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{publishingCharter ? "Publishing..." : `Publish Charter v${(charter?.version || 1) + 1}`}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Current Scope:</span>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">{charter?.scope}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                      <span className="font-bold text-slate-700 dark:text-slate-300">IP Terms:</span>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">{charter?.ip_clause}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 6: Immutable Ledger Activity Stream */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-base font-bold">
                    Project Ledger Activity Stream
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500">
                  Every milestone, charter revision, top-up, application, and payout is cryptographically chained.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {activity.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No ledger entries recorded yet.</p>
                ) : (
                  activity.map((act) => (
                    <div
                      key={act.seq}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="subtle" className="font-mono text-[10px]">
                          #{act.seq}
                        </Badge>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {act.action}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-mono text-[11px]">{act.actor}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {act.timestamp}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
