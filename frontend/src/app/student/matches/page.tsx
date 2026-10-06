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
  Sparkles,
  ArrowRight,
  Send,
  Building2,
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
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Matched Initiatives &amp; Opportunities
                  </h1>
                  <Badge variant="subtle" className="gap-1 border-[#8f7cff]/30 bg-[#8f7cff]/10 text-[#b9a9ff] font-mono text-[10px]">
                    <Sparkles className="h-3 w-3" />
                    ALGORITHMIC FIT
                  </Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Ranked recommendations powered by 5-factor matching (skills, verified projects, stars, availability, and Newbie boost).
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
                <Sparkles className="mx-auto h-10 w-10 text-[#6f6f7b]" />
                <h3 className="mt-4 text-base font-bold text-white">No Matching Challenges Currently Open</h3>
                <p className="mt-1 text-xs text-[#9d9da8]">
                  Check back soon as sponsors post new industrial challenges with escrow lockers.
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {matches.map((item) => (
                  <Card key={item.project.id} className="p-6 transition-all hover:border-white/[0.16]">
                    <div className="space-y-4">
                      {/* Header with Title and Match Score */}
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-white">
                              {item.project.title}
                            </h3>
                            <Badge variant="subtle" className="font-mono text-[10px] uppercase">
                              {item.project.engagement_model}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#9d9da8] max-w-2xl leading-relaxed">
                            {item.project.public_summary}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5 rounded-xl border border-[#8f7cff]/30 bg-[#8f7cff]/10 px-3 py-1 text-[#b9a9ff] font-mono text-xs font-bold">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{item.score_pct}% Fit</span>
                          </div>
                          <span className="font-mono text-sm font-bold text-emerald-400">
                            ₹{item.project.budget.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Matching Explanation Reasons */}
                      <div className="rounded-xl border border-white/[0.08] bg-[#050508]/80 p-3 text-xs text-[#9d9da8]">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#b9a9ff] mr-1">Why You Matched:</span>
                        <span className="text-white/90">{item.reasons}</span>
                      </div>

                      {/* Sponsor / Company Track Record Panel */}
                      {item.company_pros_cons && (
                        <div>
                          <div className="mb-2 flex items-center gap-1.5 font-mono text-xs text-[#9d9da8]">
                            <Building2 className="h-3.5 w-3.5 text-[#b9a9ff]" />
                            <span>Sponsor Company Evaluation (from Past Student Reviews)</span>
                          </div>
                          <ProsConsPanel
                            data={item.company_pros_cons}
                            title="Sponsor Reliability Record"
                          />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                        <Button asChild variant="outline" size="sm" className="font-semibold">
                          <Link href={`/charters/${item.project.id}`}>
                            <span>Preview Charter</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          disabled={applyingId === item.project.id}
                          onClick={() => handleApply(item.project.id)}
                          className="gap-1.5 font-semibold"
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
