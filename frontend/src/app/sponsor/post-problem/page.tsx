"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  PlusCircle,
  Trash2,
  Lock,
  Send,
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
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Post an Industrial Challenge
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Define technical objectives, scope milestones with AI, and publish an initial charter agreement.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleAiScope}
                disabled={scoping}
                className="gap-2 border-[#8f7cff]/40 bg-[#8f7cff]/10 text-[#b9a9ff] hover:bg-[#8f7cff]/20 font-semibold"
              >
                <Sparkles className="h-4 w-4 text-[#b9a9ff]" />
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
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Challenge Title
                  </label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Edge Diabetic Retinopathy Detection on Cortex-A53"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                      Engagement Model
                    </label>
                    <select
                      value={engagementModel}
                      onChange={(e) => setEngagementModel(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#0c0d12] px-3 font-mono text-xs text-white focus:border-[#8f7cff] focus:outline-none"
                    >
                      <option value="funded">Funded (Guaranteed Escrow)</option>
                      <option value="stipend">Stipend Supported</option>
                      <option value="knowledge-sharing">Knowledge Sharing (Open Source)</option>
                      <option value="institutional-credit">Institutional Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                      Total Budget (Integer Rupees)
                    </label>
                    <Input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                      Data Sensitivity Label
                    </label>
                    <select
                      value={sensitivityLabel}
                      onChange={(e) => setSensitivityLabel(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.12] bg-[#0c0d12] px-3 font-mono text-xs text-white focus:border-[#8f7cff] focus:outline-none"
                    >
                      <option value="Public">Public (Open Challenge)</option>
                      <option value="Confidential">Confidential (Gated Brief)</option>
                      <option value="Strictly Restricted">Strictly Restricted (HIPAA/ITAR)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Public Summary (Visible to all students &amp; candidates)
                  </label>
                  <textarea
                    rows={3}
                    value={publicSummary}
                    onChange={(e) => setPublicSummary(e.target.value)}
                    placeholder="Concise technical overview of the engineering goal..."
                    className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-[#0c0d12] p-3 text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none focus:ring-1 focus:ring-[#8f7cff]"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                      Confidential Brief &amp; Datasets (Gated: Only unlocked upon charter acceptance)
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={confidentialBrief}
                    onChange={(e) => setConfidentialBrief(e.target.value)}
                    placeholder="Proprietary clinical specs, dataset links, and strict acceptance criteria..."
                    className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-[#0c0d12] p-3 text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none focus:ring-1 focus:ring-[#8f7cff]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Milestone Decomposition */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">2. Milestone Breakdown &amp; Budget Lockers</CardTitle>
                  <p className="font-mono text-xs text-[#9d9da8] mt-0.5">
                    Allocated: ₹{totalMilestoneBudget.toLocaleString("en-IN")} of ₹{Number(budget).toLocaleString("en-IN")} Total
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMilestone}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Add Milestone</span>
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {milestones.map((m, idx) => (
                  <div
                    key={m.sequence}
                    className="rounded-2xl border border-white/[0.08] bg-[#050508]/80 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Badge variant="default" className="font-mono text-[10px]">
                          M{m.sequence}
                        </Badge>
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => handleUpdateMilestone(idx, "title", e.target.value)}
                          placeholder="Milestone Title"
                          className="font-semibold text-sm bg-transparent border-b border-dashed border-white/[0.16] text-white focus:border-[#8f7cff] focus:outline-none pb-0.5"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-[#6f6f7b]">₹</span>
                          <input
                            type="number"
                            value={m.budget}
                            onChange={(e) =>
                              handleUpdateMilestone(idx, "budget", parseInt(e.target.value) || 0)
                            }
                            className="w-24 rounded-lg border border-white/[0.12] bg-[#0c0d12] p-1.5 text-right font-mono text-xs font-bold text-white focus:border-[#8f7cff] focus:outline-none"
                          />
                        </div>
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMilestone(idx)}
                            className="text-[#6f6f7b] hover:text-rose-400 transition-colors"
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
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] p-2 text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none"
                    />

                    <div>
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6f6f7b]">
                        Required Skills (comma-separated):
                      </label>
                      <input
                        type="text"
                        value={m.skillsText}
                        onChange={(e) => handleUpdateMilestone(idx, "skillsText", e.target.value)}
                        placeholder="e.g. Python, PyTorch, Edge AI"
                        className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] p-1.5 font-mono text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none"
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
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Scope of Work
                  </label>
                  <textarea
                    rows={2}
                    value={charterScope}
                    onChange={(e) => setCharterScope(e.target.value)}
                    placeholder="Official scope governing accepted milestone deliverables..."
                    className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-[#0c0d12] p-2.5 text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    IP &amp; Attribution Clause
                  </label>
                  <textarea
                    rows={2}
                    value={ipClause}
                    onChange={(e) => setIpClause(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-[#0c0d12] p-2.5 text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Confidentiality Clause
                  </label>
                  <textarea
                    rows={2}
                    value={confidentialityClause}
                    onChange={(e) => setConfidentialityClause(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-[#0c0d12] p-2.5 text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Exit &amp; Pro-Rata Payment Terms
                  </label>
                  <textarea
                    rows={2}
                    value={exitTerms}
                    onChange={(e) => setExitTerms(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-[#0c0d12] p-2.5 text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Commercialisation &amp; Co-Authorship
                  </label>
                  <textarea
                    rows={2}
                    value={commercialisationClause}
                    onChange={(e) => setCommercialisationClause(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.12] bg-[#0c0d12] p-2.5 text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-white/[0.06] p-5">
                <Button
                  size="lg"
                  disabled={submitting}
                  onClick={handleSubmitProblem}
                  className="gap-2 font-semibold h-11 px-6"
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
