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
  Compass,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  MailCheck,
} from "lucide-react";
import { toast } from "sonner";

interface ExpertMatchItem {
  project: {
    id: string;
    title: string;
    public_summary: string;
    budget: number;
    engagement_model: string;
    sponsor_id: string;
  };
  is_invited: boolean;
  is_conflicted: boolean;
  conflict_reason?: string | null;
  match_score: number;
  score_pct: number;
  reasons: string;
  company_pros_cons: any;
}

export default function ExpertMatchesPage() {
  const [matches, setMatches] = useState<ExpertMatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await apiFetch<{ matches: ExpertMatchItem[] }>("/api/expert/matches");
        setMatches(res.matches || []);
      } catch (err: any) {
        toast.error("Failed to load expert matches: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  return (
    <RoleGuard allowedRoles={["expert", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="expert" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  Expert Invitations &amp; Algorithmic Matches
                </h1>
                <Badge variant="subtle" className="gap-1 border-teal-500/30 text-teal-700">
                  <Compass className="h-3 w-3" />
                  ADVISORY DISCOVERY
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Initiatives seeking senior domain guidance, with automatic conflict-of-interest screening and company track records.
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : matches.length === 0 ? (
              <Card className="p-12 text-center">
                <Compass className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-base font-bold">No Open Expert Matching Calls</h3>
                <p className="mt-1 text-xs text-slate-500">
                  You will be notified when sponsors request technical leadership or peer review.
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {matches.map((item) => (
                  <Card
                    key={item.project.id}
                    className={`p-6 transition-all ${
                      item.is_conflicted
                        ? "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10"
                        : "hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {item.project.title}
                            </h3>
                            {item.is_invited && (
                              <Badge variant="default" className="gap-1 text-xs">
                                <MailCheck className="h-3 w-3" />
                                Sponsor Invitation
                              </Badge>
                            )}
                            {item.is_conflicted && (
                              <Badge variant="subtle" className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300">
                                <AlertTriangle className="h-3 w-3" />
                                Declared Conflict of Interest
                              </Badge>
                            )}
                            <Badge variant="subtle" className="text-xs uppercase">
                              {item.project.engagement_model}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                            {item.project.public_summary}
                          </p>
                        </div>

                        {!item.is_conflicted && (
                          <div className="flex flex-shrink-0 flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-teal-800 dark:text-teal-200">
                              <Compass className="h-4 w-4 text-teal-600" />
                              <span className="text-sm font-black">{item.score_pct}% Match</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              Rs {item.project.budget.toLocaleString()} Pool
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Conflict Alert Banner if Conflicted */}
                      {item.is_conflicted ? (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span>Excluded from Matchmaking via Declared Affiliation:</span>
                          </div>
                          <p className="mt-1 text-slate-700 dark:text-slate-300">
                            {item.conflict_reason || "Direct commercial conflict or advisory overlap with project sponsor."}
                          </p>
                          <p className="mt-1 text-[11px] font-mono text-slate-500">
                            Action logged to immutable ledger block for transparency.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                          <span className="font-bold text-slate-900 dark:text-slate-100">Advisory Fit: </span>
                          {item.reasons}
                        </div>
                      )}

                      {/* Sponsor Evaluation */}
                      {item.company_pros_cons && (
                        <div>
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-teal-600" />
                            <span>Sponsor Reliability &amp; Review History</span>
                          </div>
                          <ProsConsPanel
                            data={item.company_pros_cons}
                            title="Sponsor Evaluation"
                          />
                        </div>
                      )}

                      {/* Action */}
                      <div className="flex justify-end pt-2">
                        <Button
                          asChild
                          size="sm"
                          disabled={item.is_conflicted}
                          className="font-bold gap-1.5"
                        >
                          <Link href={`/charters/${item.project.id}`}>
                            <span>{item.is_conflicted ? "View Project Terms (Read-Only)" : "Review Charter & Co-Sign"}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
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
