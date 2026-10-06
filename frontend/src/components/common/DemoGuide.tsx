"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Sparkles,
  X,
  Play,
  Clock,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Award,
  AlertTriangle,
  FolderGit2,
  Layers,
  ChevronRight,
  Wallet,
  Scale,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DemoStep {
  id: string;
  number: number;
  label: string;
  subtitle: string;
  role: "sponsor" | "student" | "expert" | "admin";
  email: string;
  path: string;
  icon: React.ElementType;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: "post",
    number: 1,
    label: "Post Problem",
    subtitle: "Sponsor drafts an enterprise initiative",
    role: "sponsor",
    email: "sponsor@vouch.local",
    path: "/sponsor/post-problem",
    icon: FolderGit2,
  },
  {
    id: "scope",
    number: 2,
    label: "AI Scope & Milestones",
    subtitle: "AI decomposes brief into deliverables & skills",
    role: "sponsor",
    email: "sponsor@vouch.local",
    path: "/sponsor/post-problem",
    icon: Sparkles,
  },
  {
    id: "match",
    number: 3,
    label: "Match & Invite",
    subtitle: "Multi-factor skill fit & ranked recommendations",
    role: "student",
    email: "student.b@vouch.local",
    path: "/student/matches",
    icon: Search,
  },
  {
    id: "join",
    number: 4,
    label: "Join Charter",
    subtitle: "Read & sign binding immutable team agreement",
    role: "student",
    email: "student.a@vouch.local",
    path: "/charters/proj_retinopathy",
    icon: FileCheck,
  },
  {
    id: "fund",
    number: 5,
    label: "Fund Escrow",
    subtitle: "Lock guaranteed integer rupees in milestone escrow",
    role: "sponsor",
    email: "sponsor@vouch.local",
    path: "/sponsor/wallet",
    icon: Wallet,
  },
  {
    id: "work",
    number: 6,
    label: "Deliver Work",
    subtitle: "Workspace submission & evidence upload",
    role: "student",
    email: "student.b@vouch.local",
    path: "/projects/proj_retinopathy/workspace",
    icon: Layers,
  },
  {
    id: "catch",
    number: 7,
    label: "Catch Copied Content",
    subtitle: "Automated similarity engine flags submission",
    role: "admin",
    email: "admin@vouch.local",
    path: "/admin",
    icon: AlertTriangle,
  },
  {
    id: "accept",
    number: 8,
    label: "Accept Milestone",
    subtitle: "Sponsor releases funds with itemized rupee math",
    role: "sponsor",
    email: "sponsor@vouch.local",
    path: "/projects/proj_retinopathy/workspace",
    icon: CheckCircle2,
  },
  {
    id: "credential",
    number: 9,
    label: "Verified Credential",
    subtitle: "Tamper-evident portfolio badge minted to ledger",
    role: "student",
    email: "student.b@vouch.local",
    path: "/student/credentials",
    icon: Award,
  },
  {
    id: "verify",
    number: 10,
    label: "Verify Ledger",
    subtitle: "SHA-256 chain audit & tamper detection banner",
    role: "admin",
    email: "admin@vouch.local",
    path: "/admin",
    icon: ShieldCheck,
  },
  {
    id: "twist",
    number: 11,
    label: "Twist (Rehearsal)",
    subtitle: "Dry-run 5 realistic edge-case exit scenarios",
    role: "sponsor",
    email: "sponsor@vouch.local",
    path: "/rehearsal",
    icon: Scale,
  },
];

export function DemoGuide() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [stageLoading, setStageLoading] = useState<string | null>(null);

  // If user is not logged in, don't show the floating guide
  if (!user) return null;

  const handleStepClick = async (step: DemoStep) => {
    setLoadingStep(step.id);
    try {
      if (user.email !== step.email) {
        toast.info(`Switching demo session to ${step.role.toUpperCase()} (${step.email})...`);
        await login(step.email, "Password123!");
      }
      setIsOpen(false);
      router.push(step.path);
    } catch (err: any) {
      toast.error(`Could not switch role: ${err.message}`);
    } finally {
      setLoadingStep(null);
    }
  };

  const handleLoadStage = async (stage: string, label: string) => {
    setStageLoading(stage);
    try {
      const res = await apiFetch<{ status: string; message: string }>("/api/demo/load-stage", {
        method: "POST",
        body: JSON.stringify({ stage }),
      });
      toast.success(res.message);
      // Route appropriately based on stage
      if (stage === "before_posting") router.push("/sponsor/post-problem");
      else if (stage === "after_matching") router.push("/sponsor/projects");
      else if (stage === "mid_project") router.push("/projects/proj_retinopathy/workspace");
      else if (stage === "milestone_acceptance") router.push("/projects/proj_retinopathy/workspace");
    } catch (err: any) {
      toast.error(err.message || "Failed to load demo stage");
    } finally {
      setStageLoading(null);
    }
  };

  const handleFastForward = async () => {
    setStageLoading("fast_forward");
    try {
      const res = await apiFetch<{ status: string; message: string }>("/api/demo/fast-forward", {
        method: "POST",
        body: JSON.stringify({ days: 7 }),
      });
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to fast-forward time");
    } finally {
      setStageLoading(null);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm("Reset all platform data, ledger, and wallets back to the initial demo state?")) return;
    setStageLoading("reset");
    try {
      // If not admin, quick login as admin to reset
      if (user.role !== "admin") {
        await login("admin@vouch.local", "Password123!");
      }
      const res = await apiFetch<{ status: string; message: string }>("/api/admin/reset", {
        method: "POST",
      });
      toast.success(res.message);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Reset failed");
    } finally {
      setStageLoading(null);
    }
  };

  return (
    <>
      {/* Floating Demo Launcher Button */}
      <button
        id="btn-floating-demo-guide"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-teal-500/40 bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-teal-900/30 transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-teal-400/30"
        title="Open interactive 5-minute Demo Story Guide"
      >
        <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
        <span>Demo Guide</span>
        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-black">
          11 Steps
        </span>
      </button>

      {/* Slide-over Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                <Play className="h-4 w-4 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Interactive Demo Guide
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Walk through the 11-step story or jump to any stage
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close demo guide"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Current Session Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] dark:border-slate-800/80 dark:bg-slate-900/60">
            <span className="text-slate-500 dark:text-slate-400">
              Active User: <strong className="text-slate-700 dark:text-slate-200">{user.name}</strong>
            </span>
            <Badge variant="subtle" className="text-[10px] uppercase font-bold">
              {user.role}
            </Badge>
          </div>

          {/* Scrollable Story Steps */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {/* Story Step Buttons */}
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Story Flow (Auto-logs into role)
              </div>
              <div className="space-y-1.5">
                {DEMO_STEPS.map((s) => {
                  const Icon = s.icon;
                  const isCurrentRole = user.email === s.email;
                  const isLoading = loadingStep === s.id;

                  return (
                    <button
                      key={s.id}
                      onClick={() => handleStepClick(s)}
                      disabled={Boolean(loadingStep)}
                      className="group flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 text-left transition hover:border-teal-500/40 hover:bg-teal-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-teal-500/40 dark:hover:bg-teal-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 group-hover:bg-teal-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-teal-500 dark:group-hover:text-slate-950">
                          {s.number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {s.label}
                            </span>
                            <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {s.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {s.subtitle}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600 dark:text-slate-600 dark:group-hover:text-teal-400" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage Fast-Loader */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Layers className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Load Demo at Stage</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(stageLoading)}
                  onClick={() => handleLoadStage("before_posting", "Before Posting")}
                  className="h-8 justify-start text-[11px] font-semibold"
                >
                  1. Before Posting
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(stageLoading)}
                  onClick={() => handleLoadStage("after_matching", "After Matching")}
                  className="h-8 justify-start text-[11px] font-semibold"
                >
                  2. After Matching
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(stageLoading)}
                  onClick={() => handleLoadStage("mid_project", "Mid-Project")}
                  className="h-8 justify-start text-[11px] font-semibold"
                >
                  3. Mid-Project
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(stageLoading)}
                  onClick={() => handleLoadStage("milestone_acceptance", "Milestone Acceptance")}
                  className="h-8 justify-start text-[11px] font-semibold"
                >
                  4. Milestone Acceptance
                </Button>
              </div>
            </div>

            {/* Time Control & Data Reseeder */}
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={Boolean(stageLoading)}
                onClick={handleFastForward}
                className="w-full gap-2 border border-slate-200 text-xs font-semibold dark:border-slate-800"
              >
                <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Fast-forward Time (+7 days)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={Boolean(stageLoading)}
                onClick={handleResetDemo}
                className="w-full gap-2 border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Admin Reset Demo Data</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
