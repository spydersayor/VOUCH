"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  PlusCircle,
  Trash2,
  FileText,
  Lock,
  Coins,
  Send,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

interface MilestoneInput {
  sequence: number;
  title: string;
  description: string;
  skills: string[];
  skillsText: string;
  budget: number;
}

export default function PostProblemPage() {
  const router = useRouter();

  // Basic Problem Details
  const [title, setTitle] = useState("");
  const [publicSummary, setPublicSummary] = useState("");
  const [confidentialBrief, setConfidentialBrief] = useState("");
  const [sensitivityLabel, setSensitivityLabel] = useState("Confidential");
  const [budget, setBudget] = useState(100000);
  const [engagementModel, setEngagementModel] = useState("funded");

  // Milestones
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    {
      sequence: 1,
      title: "Data Ingestion & Benchmark Harness",
      description: "Pipeline architecture and validation data folds.",
      skills: ["Python", "Computer Vision"],
      skillsText: "Python, Computer Vision",
      budget: 30000,
    },
    {
      sequence: 2,
      title: "Core Model Implementation & Quantization",
      description: "Neural net architecture and edge quantization.",
      skills: ["PyTorch", "TensorFlow Lite"],
      skillsText: "PyTorch, TensorFlow Lite",
      budget: 40000,
    },
    {
      sequence: 3,
      title: "Clinical Evaluation & Deployment Package",
      description: "Benchmarking on target edge hardware and documentation.",
      skills: ["Embedded Systems", "Edge AI"],
      skillsText: "Embedded Systems, Edge AI",
      budget: 30000,
    },
  ]);

  // Charter Clauses
  const [charterScope, setCharterScope] = useState("");
  const [ipClause, setIpClause] = useState("Sponsor retains commercial licensing rights; contributors maintain co-authorship and verified ledger attribution.");
  const [confidentialityClause, setConfidentialityClause] = useState("All patient data and proprietary datasets strictly confidential within platform sandbox.");
  const [exitTerms, setExitTerms] = useState("Pro-rata payout for accepted milestones; unreleased funds returned to sponsor per SPEC Section 9.");
  const [commercialisationClause, setCommercialisationClause] = useState("Open research publication permitted after 90 days from project close.");

  const [scoping, setScoping] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI Scoping action
  const handleAiScope = async () => {
    if (!title.trim() || !publicSummary.trim()) {
      toast.error("Please provide at least a Title and Public Summary before running AI Scoping.");
      return;
    }
    setScoping(true);
    try {
      const res = await apiFetch<any>("/api/ai/scope", {
        method: "POST",
        body: JSON.stringify({
          title,
          public_summary: publicSummary,
          confidential_brief: confidentialBrief,
          budget: Number(budget),
          engagement_model: engagementModel,
        }),
      });

      if (res.milestones && res.milestones.length > 0) {
        const mapped = res.milestones.map((m: any) => ({
          sequence: m.sequence,
          title: m.title,
          description: m.description,
          skills: m.skills || [],
          skillsText: (m.skills || []).join(", "),
          budget: Number(m.budget || 0),
        }));
        setMilestones(mapped);
      }

      if (res.suggested_charter) {
        setCharterScope(res.suggested_charter.scope || "");
        setIpClause(res.suggested_charter.ip_clause || ipClause);
        setConfidentialityClause(res.suggested_charter.confidentiality_clause || confidentialityClause);
        setExitTerms(res.suggested_charter.exit_terms || exitTerms);
        setCommercialisationClause(res.suggested_charter.commercialisation_clause || commercialisationClause);
      }

      toast.success("AI scoping generated editable milestones and charter terms!");
    } catch (err: any) {
      toast.error(err.message || "AI Scoping failed");
    } finally {
      setScoping(false);
    }
  };

  const handleAddMilestone = () => {
    const nextSeq = milestones.length + 1;
    setMilestones([
      ...milestones,
      {
        sequence: nextSeq,
        title: `Milestone ${nextSeq}`,
        description: "",
        skills: ["Python"],
        skillsText: "Python",
        budget: 0,
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index).map((m, i) => ({
      ...m,
      sequence: i + 1,
    }));
    setMilestones(updated);
  };

  const handleUpdateMilestone = (index: number, field: string, value: any) => {
    const updated = [...milestones];
    if (field === "skillsText") {
      updated[index].skillsText = value;
      updated[index].skills = value
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    } else {
      (updated[index] as any)[field] = value;
    }
    setMilestones(updated);
  };

  const totalMilestoneBudget = milestones.reduce((sum, m) => sum + Number(m.budget || 0), 0);

  const handleSubmitProblem = async () => {
    if (!title.trim() || !publicSummary.trim()) {
      toast.error("Please fill in Title and Public Summary.");
      return;
    }
    if (engagementModel === "funded" && totalMilestoneBudget !== Number(budget)) {
      toast.warning(
        `Milestone sum (Rs ${totalMilestoneBudget.toLocaleString()}) does not match Total Budget (Rs ${Number(budget).toLocaleString()}). Adjusted automatically.`
      );
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<any>("/api/sponsor/problems", {
        method: "POST",
        body: JSON.stringify({
          title,
          public_summary: publicSummary,
          confidential_brief: confidentialBrief || "Confidential clinical brief",
          sensitivity_label: sensitivityLabel,
          budget: Number(budget),
          engagement_model: engagementModel,
          milestones: milestones.map((m) => ({
            sequence: m.sequence,
            title: m.title,
            description: m.description,
            skills: m.skills,
            budget: Number(m.budget || 0),
          })),
          charter: {
            scope: charterScope || publicSummary,
            ip_clause: ipClause,
            confidentiality_clause: confidentialityClause,
            exit_terms: exitTerms,
            commercialisation_clause: commercialisationClause,
          },
        }),
      });

      toast.success("Problem posted & Charter v1 published to immutable ledger!");
      router.push(`/sponsor/projects/${res.project_id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to post problem");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["sponsor", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="sponsor" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  Post an Industrial Challenge
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Define technical objectives, scope milestones with AI, and publish an initial charter agreement.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleAiScope}
                disabled={scoping}
                className="gap-2 border-teal-500/40 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950 font-bold"
              >
                <Sparkles className="h-4 w-4 text-teal-600" />
                <span>{scoping ? "AI Decomposing..." : "AI Auto-Scope Milestones"}</span>
              </Button>
            </div>

            {/* 1. Core Problem Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">1. Problem Specifications &amp; Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Challenge Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Edge Diabetic Retinopathy Detection on Cortex-A53"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Engagement Model
                    </label>
                    <select
                      value={engagementModel}
                      onChange={(e) => setEngagementModel(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="funded">Funded (Guaranteed Escrow)</option>
                      <option value="stipend">Stipend Supported</option>
                      <option value="knowledge-sharing">Knowledge Sharing (Open Source)</option>
                      <option value="institutional-credit">Institutional Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Total Budget (Integer Rupees)
                    </label>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Data Sensitivity Label
                    </label>
                    <select
                      value={sensitivityLabel}
                      onChange={(e) => setSensitivityLabel(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="Public">Public (Open Challenge)</option>
                      <option value="Confidential">Confidential (Gated Brief)</option>
                      <option value="Strictly Restricted">Strictly Restricted (HIPAA/ITAR)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Public Summary (Visible to all students &amp; candidates)
                  </label>
                  <textarea
                    rows={3}
                    value={publicSummary}
                    onChange={(e) => setPublicSummary(e.target.value)}
                    placeholder="Concise technical overview of the engineering goal..."
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Confidential Brief &amp; Datasets (Gated: Only unlocked upon charter acceptance)
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={confidentialBrief}
                    onChange={(e) => setConfidentialBrief(e.target.value)}
                    placeholder="Proprietary clinical specs, dataset links, and strict acceptance criteria..."
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Milestone Decomposition */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">2. Milestone Breakdown &amp; Budget Lockers</CardTitle>
                  <p className="text-xs text-slate-500">
                    Allocated: Rs {totalMilestoneBudget.toLocaleString()} of Rs {Number(budget).toLocaleString()} Total
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMilestone}
                  className="gap-1 text-xs font-bold"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Add Milestone</span>
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {milestones.map((m, idx) => (
                  <div
                    key={m.sequence}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          M{m.sequence}
                        </Badge>
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => handleUpdateMilestone(idx, "title", e.target.value)}
                          placeholder="Milestone Title"
                          className="font-bold text-sm bg-transparent border-b border-dashed border-slate-300 focus:outline-none dark:border-slate-700"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">Rs</span>
                          <input
                            type="number"
                            value={m.budget}
                            onChange={(e) =>
                              handleUpdateMilestone(idx, "budget", parseInt(e.target.value) || 0)
                            }
                            className="w-24 rounded border border-slate-300 p-1 text-right text-xs font-bold dark:border-slate-700 dark:bg-slate-950"
                          />
                        </div>
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMilestone(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={m.description}
                      onChange={(e) => handleUpdateMilestone(idx, "description", e.target.value)}
                      placeholder="Milestone technical scope and deliverable description..."
                      className="w-full rounded border border-slate-200 p-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                    />

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">
                        Required Skills (comma-separated):
                      </label>
                      <input
                        type="text"
                        value={m.skillsText}
                        onChange={(e) => handleUpdateMilestone(idx, "skillsText", e.target.value)}
                        placeholder="e.g. Python, PyTorch, Edge AI"
                        className="mt-0.5 w-full rounded border border-slate-200 p-1.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 3. Charter Agreement Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">3. Charter Terms &amp; Governance Clauses (v1)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Scope of Work
                  </label>
                  <textarea
                    rows={2}
                    value={charterScope}
                    onChange={(e) => setCharterScope(e.target.value)}
                    placeholder="Official scope governing accepted milestone deliverables..."
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    IP &amp; Attribution Clause
                  </label>
                  <textarea
                    rows={2}
                    value={ipClause}
                    onChange={(e) => setIpClause(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Confidentiality Clause
                  </label>
                  <textarea
                    rows={2}
                    value={confidentialityClause}
                    onChange={(e) => setConfidentialityClause(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Exit &amp; Pro-Rata Payment Terms
                  </label>
                  <textarea
                    rows={2}
                    value={exitTerms}
                    onChange={(e) => setExitTerms(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Commercialisation &amp; Co-Authorship
                  </label>
                  <textarea
                    rows={2}
                    value={commercialisationClause}
                    onChange={(e) => setCommercialisationClause(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
                <Button
                  size="lg"
                  disabled={submitting}
                  onClick={handleSubmitProblem}
                  className="gap-2 font-black"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? "Publishing to Ledger..." : "Publish Problem & Charter v1"}</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
