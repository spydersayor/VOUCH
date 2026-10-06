"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { ProsConsPanel } from "@/components/pros-cons/ProsConsPanel";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Compass,
  AlertTriangle,
  ArrowRight,
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
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Expert Invitations &amp; Algorithmic Matches
                  </h1>
                  <Badge variant="subtle" className="gap-1 border-[#8f7cff]/30 bg-[#8f7cff]/10 text-[#b9a9ff] font-mono text-[10px]">
                    <Compass className="h-3 w-3" />
                    ADVISORY DISCOVERY
                  </Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Initiatives seeking senior domain guidance, with automatic conflict-of-interest screening and company track records.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-36 animate-pulse rounded-2xl border border-white/[0.08] bg-[#0c0d12]" />
                <div className="h-36 animate-pulse rounded-2xl border border-white/[0.08] bg-[#0c0d12]" />
              </div>
            ) : matches.length === 0 ? (
              <Card className="p-12 text-center">
                <Compass className="mx-auto h-10 w-10 text-[#6f6f7b]" />
                <h3 className="mt-4 text-base font-bold text-white">No Open Expert Matching Calls</h3>
                <p className="mt-1 text-xs text-[#9d9da8]">
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
                        ? "border-amber-500/40 bg-amber-950/[0.12]"
                        : "hover:border-white/[0.16]"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-white">
                              {item.project.title}
                            </h3>
                            {item.is_invited && (
                              <Badge variant="default" className="gap-1 font-mono text-[10px]">
                                <MailCheck className="h-3 w-3" />
                                Sponsor Invitation
                              </Badge>
                            )}
                            {item.is_conflicted && (
                              <Badge variant="subtle" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-[10px]">
                                <AlertTriangle className="h-3 w-3" />
                                Declared Conflict of Interest
                              </Badge>
                            )}
                            <Badge variant="subtle" className="font-mono text-[10px] uppercase">
                              {item.project.engagement_model}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#9d9da8] max-w-2xl leading-relaxed">
                            {item.project.public_summary}
                          </p>
                        </div>

                        {!item.is_conflicted && (
                          <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5 rounded-xl border border-[#8f7cff]/30 bg-[#8f7cff]/10 px-3 py-1 text-[#b9a9ff] font-mono text-xs font-bold">
                              <Compass className="h-3.5 w-3.5" />
                              <span>{item.score_pct}% Match</span>
                            </div>
                            <span className="font-mono text-sm font-bold text-emerald-400">
                              ₹{item.project.budget.toLocaleString("en-IN")} Pool
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Conflict Alert Banner if Conflicted */}
                      {item.is_conflicted ? (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5 text-xs text-amber-200 space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-300 font-mono text-[11px] uppercase tracking-wider">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            <span>Excluded from Matchmaking via Declared Affiliation:</span>
                          </div>
                          <p className="text-white/90 leading-relaxed">
                            {item.conflict_reason || "Direct commercial conflict or advisory overlap with project sponsor."}
                          </p>
                          <p className="font-mono text-[10px] text-[#6f6f7b] pt-1">
                            Action logged to immutable ledger block for transparency.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/[0.08] bg-[#050508]/80 p-3 text-xs text-[#9d9da8]">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#b9a9ff] mr-1">Advisory Fit:</span>
                          <span className="text-white/90">{item.reasons}</span>
                        </div>
                      )}

                      {/* Sponsor Evaluation */}
                      {item.company_pros_cons && (
                        <div>
                          <div className="mb-2 flex items-center gap-1.5 font-mono text-xs text-[#9d9da8]">
                            <Building2 className="h-3.5 w-3.5 text-[#b9a9ff]" />
                            <span>Sponsor Reliability &amp; Review History</span>
                          </div>
                          <ProsConsPanel
                            data={item.company_pros_cons}
                            title="Sponsor Evaluation"
                          />
                        </div>
                      )}

                      {/* Action */}
                      <div className="flex justify-end pt-3 border-t border-white/[0.06]">
                        <Button
                          asChild
                          size="sm"
                          disabled={item.is_conflicted}
                          className="font-semibold gap-1.5"
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
