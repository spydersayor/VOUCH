"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { ProsConsPanel } from "@/components/pros-cons/ProsConsPanel";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Coins,
  ArrowRight,
  Send,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface MatchItem {
  project: {
    id: string;
    title: string;
    public_summary: string;
    budget: number;
    engagement_model: string;
    sponsor_id: string;
  };
  match_score: number;
  score_pct: number;
  reasons: string;
  company_pros_cons: any;
}

export default function StudentMatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      const res = await apiFetch<{ matches: MatchItem[] }>("/api/student/matches");
      setMatches(res.matches || []);
    } catch (err: any) {
      toast.error("Failed to load matches: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleApply = async (projectId: string) => {
    setApplyingId(projectId);
    try {
      await apiFetch(`/api/projects/${projectId}/apply`, {
        method: "POST",
        body: JSON.stringify({ role: "student", pitch: "Excited to collaborate!" }),
      });
      toast.success("Application logged to ledger and notified sponsor!");
    } catch (err: any) {
      toast.error(err.message || "Application failed");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={["student", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="student" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  Matched Initiatives &amp; Opportunities
                </h1>
                <Badge variant="subtle" className="gap-1 border-teal-500/30 text-teal-700">
                  <Sparkles className="h-3 w-3" />
                  ALGORITHMIC FIT
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Ranked recommendations powered by 5-factor matching (skills, verified projects, stars, availability, and Newbie boost).
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : matches.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-base font-bold">No Matching Challenges Currently Open</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Check back soon as sponsors post new industrial challenges with escrow lockers.
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {matches.map((item) => (
                  <Card key={item.project.id} className="p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                    <div className="space-y-4">
                      {/* Header with Title and Match Score */}
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {item.project.title}
                            </h3>
                            <Badge variant="subtle" className="text-xs uppercase">
                              {item.project.engagement_model}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                            {item.project.public_summary}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-teal-800 dark:text-teal-200">
                            <Sparkles className="h-4 w-4 text-teal-600" />
                            <span className="text-sm font-black">{item.score_pct}% Fit</span>
                          </div>
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <Coins className="h-3.5 w-3.5" />
                            Rs {item.project.budget.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Matching Explanation Reasons */}
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Why You Matched: </span>
                        {item.reasons}
                      </div>

                      {/* Sponsor / Company Track Record Panel */}
                      {item.company_pros_cons && (
                        <div>
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-teal-600" />
                            <span>Sponsor Company Evaluation (from Past Student Reviews)</span>
                          </div>
                          <ProsConsPanel
                            data={item.company_pros_cons}
                            title="Sponsor Reliability Record"
                          />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <Button asChild variant="outline" size="sm" className="font-bold">
                          <Link href={`/charters/${item.project.id}`}>
                            <span>Preview Charter</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          disabled={applyingId === item.project.id}
                          onClick={() => handleApply(item.project.id)}
                          className="gap-1.5 font-bold"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>{applyingId === item.project.id ? "Submitting..." : "Apply as Contributor"}</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
