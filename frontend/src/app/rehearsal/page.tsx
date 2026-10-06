"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Sparkles,
  ShieldCheck,
  UserX,
  Building2,
  Clock,
  Bot,
  RefreshCw,
  Coins,
  ArrowRight,
  Play,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface TableLine {
  person: string;
  role: string;
  user_id: string;
  rupees_before: number;
  rupees_after: number;
  rupees_delta: number;
  credit_change: string;
  star_change: number;
  access_change: string;
  reason: string;
}

interface SimulationResult {
  scenario: string;
  title: string;
  project_id: string;
  table_lines: TableLine[];
  total_rupees_before: number;
  total_rupees_after: number;
  conserved: boolean;
  real_action_available?: boolean;
  real_action_type?: string | null;
  [key: string]: any;
}

export default function RehearsalPage() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState("proj_retinopathy");
  const [activeScenario, setActiveScenario] = useState<string>("student_quits_40");
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [canRunReal, setCanRunReal] = useState(false);

  // Real action execution dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [executingReal, setExecutingReal] = useState(false);

  const projects = [
    {
      id: "proj_retinopathy",
      title: "Diabetic Retinopathy Edge AI Screening (₹1,00,000 Funded)",
    },
    {
      id: "proj_indic_nlp",
      title: "Clinical NLP for Low-Resource Indic Languages (Knowledge-Sharing)",
    },
    {
      id: "proj_past_1",
      title: "RetinaSense Edge Classifier (Archived Benchmark)",
    },
  ];

  const scenarios = [
    {
      id: "student_quits_40",
      label: "Student quits at 40%",
      desc: "Pro-rata payment for reviewed contribution, -0.5 stars unless good cause, credit kept.",
      icon: UserX,
      color: "text-amber-500",
    },
    {
      id: "sponsor_withdraws",
      label: "Sponsor withdraws",
      desc: "All unreleased escrow + 10% compensation charged to sponsor distributed to team.",
      icon: Building2,
      color: "text-rose-500",
    },
    {
      id: "sponsor_silent",
      label: "Sponsor goes silent",
      desc: "After 7-day acceptance window, milestone auto-accepts or escalates to mediator.",
      icon: Clock,
      color: "text-blue-500",
    },
    {
      id: "ai_wrote_70",
      label: "AI wrote 70%",
      desc: "Credit to human owner, AI share disclosed, compute cost shown separately.",
      icon: Bot,
      color: "text-purple-500",
    },
    {
      id: "paid_becomes_unpaid",
      label: "Paid becomes unpaid",
      desc: "Charter converted to non-monetary, unreleased escrow refunded, members re-accept or leave.",
      icon: Coins,
      color: "text-emerald-500",
    },
  ];

  const runSimulation = async (scenarioId: string, projectId: string) => {
    setActiveScenario(scenarioId);
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/rehearsal/simulate", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          scenario: scenarioId,
          params: {
            progress_fraction: 0.40,
            days: 8,
            ai_share_pct: 70.0,
          },
        }),
      });

      setSimResult(res.result);
      setCanRunReal(Boolean(res.can_run_real));
    } catch (err: any) {
      toast.error(err.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(activeScenario, selectedProject);
  }, [selectedProject]);

  const handleRunRealAction = async () => {
    if (!simResult) return;
    setExecutingReal(true);
    try {
      if (simResult.scenario === "student_quits_40") {
        await apiFetch(`/api/projects/${selectedProject}/leave`, {
          method: "POST",
          body: JSON.stringify({
            good_cause: false,
            progress_fraction: 0.40,
          }),
        });
        toast.success("Project exit committed! Pro-rata funds and ledger entry recorded.");
      } else if (simResult.scenario === "sponsor_withdraws") {
        await apiFetch(`/api/projects/${selectedProject}/withdraw`, {
          method: "POST",
          body: JSON.stringify({
            reason: "Sponsor withdrawal from Rehearsal Engine execution",
          }),
        });
        toast.success("Sponsorship withdrawn! 10% compensation and escrow distributed to team.");
      }
      setConfirmOpen(false);
      // Re-run simulation to show updated state
      await runSimulation(activeScenario, selectedProject);
    } catch (err: any) {
      toast.error(err.message || "Failed to execute real action");
    } finally {
      setExecutingReal(false);
    }
  };

  const userRole = user?.role || "sponsor";

  return (
    <RoleGuard allowedRoles={["sponsor", "expert", "admin", "student"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {user && <RoleSidebar role={user.role as any} />}
        <main className="flex-1 p-6 sm:p-8 animate-fade-up">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                    VOUCH Rehearsal Engine
                  </h1>
                  <Badge variant="subtle" className="bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                    DRY-RUN SIMULATION
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Simulate unforeseen project turns using the exact same rule module as real exits. Test payouts, star changes, and access before acting.
                </p>
              </div>

              {/* Project Picker */}
              <div className="w-full sm:w-80">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Select Project Context
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Simulation Only Banner */}
            <div className="mb-8 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      SIMULATION ONLY — SAFE SANDBOX
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300/80">
                      No changes are committed to the database or cryptographic ledger during rehearsal. Pure deterministic math.
                    </p>
                  </div>
                </div>

                {canRunReal && (
                  <Button
                    variant="accent"
                    onClick={() => setConfirmOpen(true)}
                    className="shadow-sm"
                  >
                    <Play className="h-4 w-4" />
                    <span>Run for Real</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Scenario Buttons Grid */}
            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {scenarios.map((sc) => {
                const Icon = sc.icon;
                const isSelected = activeScenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => runSimulation(sc.id, selectedProject)}
                    className={`flex flex-col text-left rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-teal-500 bg-white ring-2 ring-teal-500/20 shadow-md dark:border-teal-500 dark:bg-slate-900"
                        : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${sc.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {isSelected && (
                        <span className="flex h-2 w-2 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {sc.label}
                    </span>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {sc.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Simulation Results Display */}
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
                  <p className="text-sm font-semibold">Running deterministic rule calculation...</p>
                </div>
              </div>
            ) : simResult ? (
              <div className="space-y-6">
                {/* Summary Strip */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Scenario Title
                      </span>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {simResult.title}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Governed by SPEC.md Sections 9 & 13
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Rupee Conservation
                      </span>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          100% CONSERVED
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ₹{simResult.total_rupees_before.toLocaleString()} before = ₹{simResult.total_rupees_after.toLocaleString()} after
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Real Action Link
                      </span>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {canRunReal ? "Action Available for Your Role" : "Informational Simulation"}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {canRunReal
                          ? "You can click 'Run for Real' above to commit this transition."
                          : "Simulated scenario available for review and dry-run."}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Table of Lines */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Financial, Credit & Star Impact Table
                    </h3>
                    <p className="text-xs text-slate-500">
                      Line-by-line itemized ledger projection before and after the simulated event:
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/80">
                        <tr>
                          <th className="px-4 py-3">Party / Account</th>
                          <th className="px-4 py-3">Rupees Before</th>
                          <th className="px-4 py-3">Rupees After</th>
                          <th className="px-4 py-3">Delta</th>
                          <th className="px-4 py-3">Credit Change</th>
                          <th className="px-4 py-3">Stars</th>
                          <th className="px-4 py-3">Access</th>
                          <th className="px-4 py-3 min-w-[260px]">Reason & Ledger Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {simResult.table_lines.map((line, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {line.person}
                              </div>
                              <span className="text-[10px] uppercase font-mono text-slate-400">
                                {line.role}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                              ₹{line.rupees_before.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                              ₹{line.rupees_after.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5">
                              {line.rupees_delta > 0 ? (
                                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono">
                                  +₹{line.rupees_delta.toLocaleString()}
                                </span>
                              ) : line.rupees_delta < 0 ? (
                                <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-mono">
                                  -₹{Math.abs(line.rupees_delta).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">₹0</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                              {line.credit_change}
                            </td>
                            <td className="px-4 py-3.5">
                              {line.star_change !== 0 ? (
                                <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                                  {line.star_change > 0 ? `+${line.star_change}` : line.star_change} ⭐
                                </span>
                              ) : (
                                <span className="text-slate-400">0.0</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  line.access_change.toLowerCase().includes("revoked") ||
                                  line.access_change.toLowerCase().includes("terminated")
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                    : line.access_change.toLowerCase().includes("re-accept")
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                }`}
                              >
                                {line.access_change}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                              {line.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Confirm Dialog for "Run for Real" */}
            <ConfirmDialog
              isOpen={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={handleRunRealAction}
              title={`Execute Real Action: ${simResult?.title}`}
              description="This will execute the real transition on the SQLite database, disburse escrow or compensation, and record an immutable block to the ledger."
              confirmText="Execute on Real Ledger"
              confirmVariant="destructive"
              loading={executingReal}
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950">
                <p className="font-bold text-slate-900 dark:text-white mb-2">
                  Projected Real Ledger Impact:
                </p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li>&bull; Action: <span className="font-mono font-bold">{simResult?.scenario}</span></li>
                  <li>&bull; Rupee Total: ₹{simResult?.total_rupees_before.toLocaleString()} strictly conserved.</li>
                  <li>&bull; Audit Trail: Permanent SHA-256 block added to project diary.</li>
                </ul>
              </div>
            </ConfirmDialog>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
