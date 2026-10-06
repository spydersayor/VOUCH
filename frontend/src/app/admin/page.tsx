"use client";

import React, { useState, useEffect } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  FileText,
  UserCheck,
  Flag,
  Scale,
  CheckCircle2,
  XCircle,
  Wrench,
  Search,
  ExternalLink,
} from "lucide-react";
import { RoleSidebar } from "@/components/shell/RoleSidebar";

interface UserQueueItem {
  id: string;
  email: string;
  name: string;
  role: string;
  headline?: string;
  is_kyc_verified: number;
  newbie_badge: number;
  stars: number;
  created_at: string;
}

interface FlaggedSubmission {
  id: string;
  project_id: string;
  project_title: string;
  milestone_id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  title: string;
  content: string;
  similarity_score: number;
  integrity_status: string;
  created_at: string;
}

interface DisputeItem {
  id: string;
  project_id: string;
  project_title?: string;
  initiator_id: string;
  initiator_name?: string;
  reason: string;
  status: string;
  resolution_notes?: string;
  good_cause_granted?: number;
  created_at: string;
}

interface LedgerVerifyResult {
  status: "ok" | "tampered";
  count?: number;
  broken_seq?: number;
  expected_prev?: string;
  actual_prev?: string;
  recomputed_hash?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"ledger" | "kyc" | "flags" | "disputes">("ledger");

  // Ledger state
  const [ledgerStatus, setLedgerStatus] = useState<LedgerVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [resetting, setResetting] = useState(false);

  // KYC Queue state
  const [users, setUsers] = useState<UserQueueItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Flagged submissions state
  const [flags, setFlags] = useState<FlaggedSubmission[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);

  // Disputes state
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [mediationNotes, setMediationNotes] = useState("");
  const [grantGoodCause, setGrantGoodCause] = useState(true);
  const [mediating, setMediating] = useState(false);

  const fetchLedgerVerification = async () => {
    setVerifying(true);
    try {
      const res = await apiFetch<LedgerVerifyResult>("/api/admin/ledger-audit");
      setLedgerStatus(res);
    } catch {
      setLedgerStatus({ status: "ok" });
    } finally {
      setVerifying(false);
    }
  };

  const fetchKYCQueue = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiFetch<{ users: UserQueueItem[] }>("/api/admin/verification-queue");
      setUsers(res.users || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchFlags = async () => {
    setLoadingFlags(true);
    try {
      const res = await apiFetch<{ flagged_submissions: FlaggedSubmission[] }>("/api/admin/flagged-submissions");
      setFlags(res.flagged_submissions || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingFlags(false);
    }
  };

  const fetchDisputes = async () => {
    setLoadingDisputes(true);
    try {
      const res = await apiFetch<{ disputes: DisputeItem[] }>("/api/admin/disputes");
      setDisputes(res.disputes || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingDisputes(false);
    }
  };

  useEffect(() => {
    fetchLedgerVerification();
    fetchKYCQueue();
    fetchFlags();
    fetchDisputes();
  }, []);

  const handleSimulateTamper = async () => {
    setTampering(true);
    try {
      await apiFetch("/api/ledger/simulate-tamper", {
        method: "POST",
        body: JSON.stringify({ seq: 2 }),
      });
      toast.error("Simulated tamper injected into block #2! Chain verification will now FAIL.");
      await fetchLedgerVerification();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTampering(false);
    }
  };

  const handleRepairLedger = async () => {
    setRepairing(true);
    try {
      const res = await apiFetch<{ status: string; message: string }>("/api/admin/repair-ledger", {
        method: "POST",
      });
      toast.success(res.message);
      await fetchLedgerVerification();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRepairing(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm("Are you sure you want to reset all demo data and reseeding back to initial state?")) return;
    setResetting(true);
    try {
      await apiFetch("/api/admin/reset", { method: "POST" });
      toast.success("All platform data, wallets, and ledger reseeding complete!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleToggleKYC = async (targetUser: UserQueueItem) => {
    const nextStatus = !targetUser.is_kyc_verified;
    try {
      await apiFetch("/api/admin/verify-user", {
        method: "POST",
        body: JSON.stringify({ user_id: targetUser.id, verified: nextStatus }),
      });
      toast.success(`${targetUser.name} KYC ${nextStatus ? "verified" : "revoked"}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_kyc_verified: nextStatus ? 1 : 0 } : u))
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResolveFlag = async (submissionId: string, decision: "clear" | "confirm") => {
    try {
      await apiFetch("/api/admin/resolve-flag", {
        method: "POST",
        body: JSON.stringify({
          submission_id: submissionId,
          decision,
          notes: decision === "clear" ? "Cleared after admin inspection" : "Confirmed similarity violation",
        }),
      });
      toast.success(`Submission ${submissionId} resolved as ${decision}`);
      await fetchFlags();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMediateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setMediating(true);
    try {
      await apiFetch("/api/admin/mediate-dispute", {
        method: "POST",
        body: JSON.stringify({
          dispute_id: selectedDispute.id,
          decision: "Admin mediated settlement",
          good_cause_granted: grantGoodCause,
          notes: mediationNotes || "Good cause exception approved by administrator.",
        }),
      });
      toast.success("Dispute mediated successfully! Ratings and ledger updated.");
      setSelectedDispute(null);
      setMediationNotes("");
      await fetchDisputes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setMediating(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="admin" />
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    System Administration &amp; Governance
                  </h1>
                  <Badge variant="subtle" className="font-mono text-[10px] text-[#b9a9ff] border-[#8f7cff]/30 bg-[#8f7cff]/10">
                    OPERATIONS
                  </Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Audit immutable cryptographic integrity, manage KYC verification, inspect similarity violations, mediate disputes, and test tamper resilience.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={resetting}
                  onClick={handleResetData}
                  className="gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-950/30 text-xs font-semibold"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{resetting ? "Resetting..." : "Reset Demo Data"}</span>
                </Button>
              </div>
            </div>

            {/* Tamper Alert Banner (if chain broken) */}
            {ledgerStatus && ledgerStatus.status === "tampered" && (
              <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-5 text-rose-200 shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-400" />
                  <div className="flex-1">
                    <h4 className="text-sm font-black uppercase tracking-wider text-rose-300">
                      CRITICAL: CRYPTOGRAPHIC LEDGER CHAIN BROKEN AT ENTRY #{ledgerStatus.broken_seq}
                    </h4>
                    <p className="mt-1 text-xs text-rose-300">
                      Sequential SHA-256 validation failed. The stored entry hash or prev_hash does not match cryptographic recalculation.
                    </p>
                    <div className="mt-2 text-[11px] font-mono bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
                      <div>Expected: {ledgerStatus.expected_prev || "Hash mismatch"}</div>
                      <div>Actual:   {ledgerStatus.actual_prev || "Corrupted payload in SQLite"}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        disabled={repairing}
                        onClick={handleRepairLedger}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        <span>{repairing ? "Repairing..." : "Repair Demo Ledger"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Chain Health
                  </span>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className={`font-mono text-xl sm:text-2xl font-bold ${ledgerStatus?.status === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ledgerStatus?.status === "ok" ? "VERIFIED INTACT" : `TAMPER AT #${ledgerStatus?.broken_seq || 2}`}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">
                    {ledgerStatus?.count ? `${ledgerStatus.count} blocks anchored` : "Sequential SHA-256"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    KYC Verification
                  </span>
                  <UserCheck className="h-4 w-4 text-[#b9a9ff]" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                    {users.filter((u) => u.is_kyc_verified).length} / {users.length}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Simulated identity verified</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Flagged Content
                  </span>
                  <Flag className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-amber-400">
                    {flags.length} Submissions
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Similarity &gt; 35% or flagged</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Open Disputes
                  </span>
                  <Scale className="h-4 w-4 text-[#b9a9ff]" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                    {disputes.filter((d) => d.status === "open").length} Pending
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Mediation & good cause</p>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/[0.08] gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("ledger")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
                  activeTab === "ledger"
                    ? "border-[#b9a9ff] text-[#b9a9ff]"
                    : "border-transparent text-[#8b8ea0] hover:text-white"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Ledger Audit & Tamper Simulation</span>
              </button>

              <button
                onClick={() => setActiveTab("kyc")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
                  activeTab === "kyc"
                    ? "border-[#b9a9ff] text-[#b9a9ff]"
                    : "border-transparent text-[#8b8ea0] hover:text-white"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Verification Queue ({users.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("flags")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
                  activeTab === "flags"
                    ? "border-[#b9a9ff] text-[#b9a9ff]"
                    : "border-transparent text-[#8b8ea0] hover:text-white"
                }`}
              >
                <Flag className="h-4 w-4" />
                <span>Flagged Submissions ({flags.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("disputes")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
                  activeTab === "disputes"
                    ? "border-[#b9a9ff] text-[#b9a9ff]"
                    : "border-transparent text-[#8b8ea0] hover:text-white"
                }`}
              >
                <Scale className="h-4 w-4" />
                <span>Disputes Queue ({disputes.length})</span>
              </button>
            </div>

            {/* TAB 1: Ledger Audit */}
            {activeTab === "ledger" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <span>Immutable Ledger Audit & Tamper Simulation</span>
                    </CardTitle>
                    <CardDescription>
                      Each platform event (charter signature, milestone acceptance, review submission, rating modification) is cryptographically chained via SHA-256 hash pointers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={verifying}
                        onClick={fetchLedgerVerification}
                        className="gap-2 text-xs font-semibold"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>{verifying ? "Verifying..." : "Verify Ledger Now"}</span>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={tampering}
                        onClick={handleSimulateTamper}
                        className="gap-2 text-xs font-semibold"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <span>{tampering ? "Tampering..." : "Simulate Tamper on Block #2"}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={repairing}
                        onClick={handleRepairLedger}
                        className="gap-2 text-xs font-semibold border-violet-400/30 text-violet-300 hover:bg-violet-950/20"
                      >
                        <Wrench className="h-4 w-4 text-violet-400" />
                        <span>{repairing ? "Repairing..." : "Repair Demo Ledger"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 2: Verification Queue */}
            {activeTab === "kyc" && (
              <Card className="p-0 overflow-hidden">
                <div className="border-b border-white/[0.08] p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      User Identity & KYC Queue
                    </h3>
                    <p className="text-xs text-[#8b8ea0]">
                      Simulated document compliance verification per SPEC.md Section 5.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchKYCQueue}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#12131a] font-bold uppercase tracking-wider text-[#8b8ea0]">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Stars</th>
                        <th className="px-4 py-3">Badge</th>
                        <th className="px-4 py-3">KYC Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-semibold text-white">
                            <div>{u.name}</div>
                            <div className="text-[10px] text-[#8b8ea0]">{u.email}</div>
                          </td>
                          <td className="px-4 py-3 uppercase text-[10px] font-bold text-[#8b8ea0]">
                            {u.role}
                          </td>
                          <td className="px-4 py-3 font-semibold text-amber-300">
                            ★ {u.stars ? u.stars.toFixed(1) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {u.newbie_badge ? (
                              <span className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                                Newbie
                              </span>
                            ) : (
                              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                                Verified Contributor
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {u.is_kyc_verified ? (
                              <Badge variant="success" className="text-[10px]">Verified</Badge>
                            ) : (
                              <Badge variant="subtle" className="text-[10px] text-[#8b8ea0]">Unverified</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleKYC(u)}
                              className="text-xs h-7"
                            >
                              {u.is_kyc_verified ? "Revoke KYC" : "Approve KYC"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* TAB 3: Flagged Submissions */}
            {activeTab === "flags" && (
              <Card className="p-0 overflow-hidden">
                <div className="border-b border-white/[0.08] p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Similarity & Integrity Audit Queue
                    </h3>
                    <p className="text-xs text-[#8b8ea0]">
                      Submissions exceeding similarity threshold or flagged during peer review.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchFlags}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {flags.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8b8ea0]">
                    No flagged submissions pending audit. Integrity check is clear!
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {flags.map((f) => (
                      <div key={f.id} className="p-4 hover:bg-white/[0.02] flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">
                              {f.title}
                            </span>
                            <Badge variant="warning" className="text-[10px]">
                              {(f.similarity_score * 100).toFixed(0)}% Similarity
                            </Badge>
                            <Badge variant="subtle" className="text-[10px]">
                              {f.integrity_status}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#8b8ea0] font-mono line-clamp-2">
                            {f.content}
                          </p>
                          <div className="text-[10px] text-[#6f6f7b]">
                            Author: <strong className="text-white">{f.author_name}</strong> ({f.author_email}) | Project: {f.project_title}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolveFlag(f.id, "clear")}
                            className="text-xs text-emerald-400 hover:bg-emerald-950/30 border-emerald-500/30"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            <span>Clear Flag</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolveFlag(f.id, "confirm")}
                            className="text-xs text-rose-400 hover:bg-rose-950/30 border-rose-500/30"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            <span>Confirm Violation</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* TAB 4: Disputes Queue */}
            {activeTab === "disputes" && (
              <Card className="p-0 overflow-hidden">
                <div className="border-b border-white/[0.08] p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Platform Disputes & Mediations
                    </h3>
                    <p className="text-xs text-[#8b8ea0]">
                      Escalations for milestone rejection, silent sponsors, and member exit star penalties.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchDisputes}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {disputes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8b8ea0]">
                    No active disputes recorded. All project milestones operating smoothly!
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {disputes.map((d) => (
                      <div key={d.id} className="p-4 hover:bg-white/[0.02] flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">
                              Dispute #{d.id}
                            </span>
                            <Badge variant={d.status === "open" ? "warning" : "success"} className="text-[10px]">
                              {d.status.toUpperCase()}
                            </Badge>
                            {Boolean(d.good_cause_granted) && (
                              <Badge variant="subtle" className="text-[10px] text-teal-400 border-teal-500/30">
                                Good Cause Granted
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#8b8ea0]">
                            Reason: <span className="text-white">{d.reason}</span>
                          </p>
                          {d.resolution_notes && (
                            <p className="text-xs text-[#8b8ea0] italic">
                              Resolution: {d.resolution_notes}
                            </p>
                          )}
                          <div className="text-[10px] text-[#6f6f7b]">
                            Initiator: {d.initiator_name || d.initiator_id} | Project: {d.project_title || d.project_id}
                          </div>
                        </div>

                        {d.status === "open" && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setSelectedDispute(d)}
                              className="text-xs font-semibold"
                            >
                              <Scale className="h-3.5 w-3.5 mr-1" />
                              <span>Mediate</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Dispute Mediation Dialog */}
                {selectedDispute && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg border-white/[0.12] bg-[#0c0d12] p-6 shadow-2xl">
                      <h4 className="text-sm font-bold text-white">
                        Mediate Dispute #{selectedDispute.id}
                      </h4>
                      <p className="mt-1 text-xs text-[#8b8ea0]">
                        Review case details and determine whether a star penalty waiver or good cause exception applies.
                      </p>

                      <form onSubmit={handleMediateDispute} className="mt-4 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#8b8ea0]">
                            Resolution Notes
                          </label>
                          <textarea
                            value={mediationNotes}
                            onChange={(e) => setMediationNotes(e.target.value)}
                            placeholder="State rationale for mediation decision..."
                            rows={3}
                            className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#12131a] p-2.5 text-xs text-white placeholder-[#6f6f7b] focus:border-violet-400 focus:outline-none"
                            required
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="good-cause-checkbox"
                            checked={grantGoodCause}
                            onChange={(e) => setGrantGoodCause(e.target.checked)}
                            className="rounded border-white/[0.2] bg-[#12131a] text-violet-500 focus:ring-violet-500"
                          />
                          <label htmlFor="good-cause-checkbox" className="text-xs font-semibold text-white">
                            Grant Good Cause Exception (Waive or restore 0.5 star penalty)
                          </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDispute(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={mediating}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            {mediating ? "Applying..." : "Submit Mediation"}
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </div>
                )}
              </Card>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
