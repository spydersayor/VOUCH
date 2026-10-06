"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Building2,
  ArrowRight,
  ShieldCheck,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ProsConsPanel } from "@/components/pros-cons/ProsConsPanel";
import { SectionErrorBoundary } from "@/components/common/SectionErrorBoundary";

function CompanyRecordSection({ sponsorId, sponsorName, sponsorStars }: { sponsorId: string; sponsorName: string; sponsorStars: number }) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const toggleOpen = async () => {
    if (!expanded && !data) {
      setLoading(true);
      try {
        const res = await apiFetch<any>(`/api/companies/${sponsorId}/pros-cons`);
        setData(res);
      } catch {}
      finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#050508]/80 p-3 text-xs space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#b9a9ff]" />
          <span className="font-semibold text-white">
            {sponsorName}
          </span>
          <div className="flex items-center text-amber-400 font-mono text-xs gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{sponsorStars}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleOpen}
          className="flex items-center gap-1 font-mono text-[11px] text-[#b9a9ff] hover:text-white transition-colors"
        >
          <span>{expanded ? "Hide Review History" : "View Company Track Record & Review Evidence"}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="pt-2">
          {loading ? (
            <div className="h-16 animate-pulse rounded-xl bg-white/[0.05]" />
          ) : data ? (
            <ProsConsPanel data={data} title="Sponsor Company Review Summary" />
          ) : (
            <p className="font-mono text-xs text-[#6f6f7b]">Could not load company reviews.</p>
          )}
        </div>
      )}
    </div>
  );
}

interface ProjectItem {
  id: string;
  title: string;
  public_summary: string;
  budget: number;
  engagement_model: string;
  status: string;
  sponsor_id: string;
  sponsor_name: string;
  sponsor_stars: number;
  required_skills: string[];
}

export default function OpenProblemsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [skillFilter, setSkillFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skillFilter.trim()) params.append("skill", skillFilter.trim());
      if (modelFilter !== "all") params.append("engagement_model", modelFilter);
      if (budgetFilter === "funded_gt_50k") params.append("min_budget", "50000");

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiFetch<{ projects: ProjectItem[] }>(`/api/projects${query}`);
      setProjects(res.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [modelFilter, budgetFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects();
  };

  return (
    <SectionErrorBoundary sectionName="OpenProblemsPage">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 animate-fade-up space-y-10">
        {/* Header */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8f7cff]/30 bg-[#8f7cff]/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-[#b9a9ff]">
            <span>Directory</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Open Problem Briefs
          </h1>
          <p className="text-sm text-[#9d9da8] max-w-2xl leading-relaxed">
            Browse verified technical challenges from corporate sponsors. Every project features upfront escrow or formal attribution pledges.
          </p>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#6f6f7b]" />
              <Input
                type="text"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="Search by skill, title, or topic (e.g. PyTorch, Vision, NLP)..."
                className="pl-10 h-11"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="h-11 rounded-xl border border-white/[0.12] bg-[#0c0d12] px-3.5 font-mono text-xs font-medium text-white transition focus:border-[#8f7cff] focus:outline-none"
              >
                <option value="all">All Engagement Models</option>
                <option value="funded">Funded Only (Rupee Escrow)</option>
                <option value="knowledge-sharing">Knowledge-Sharing (Open Credit)</option>
              </select>

              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="h-11 rounded-xl border border-white/[0.12] bg-[#0c0d12] px-3.5 font-mono text-xs font-medium text-white transition focus:border-[#8f7cff] focus:outline-none"
              >
                <option value="all">All Budgets</option>
                <option value="funded_gt_50k">₹50,000+ Escrow</option>
              </select>

              <Button id="btn-filter-problems" type="submit" variant="default" className="font-semibold h-11 px-5">
                Filter
              </Button>
            </div>
          </form>
        </Card>

        {/* Projects List */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-44 w-full animate-pulse rounded-2xl border border-white/[0.08] bg-[#0c0d12]" />
              <div className="h-44 w-full animate-pulse rounded-2xl border border-white/[0.08] bg-[#0c0d12]" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-base font-semibold text-white">
                No matching problems found
              </p>
              <p className="mt-1 text-xs text-[#9d9da8]">
                Try adjusting your skill search keywords or clear filter criteria.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={() => {
                  setSkillFilter("");
                  setModelFilter("all");
                  setBudgetFilter("all");
                }}
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            projects.map((p) => {
              const isFunded = p.engagement_model === "funded";
              return (
                <Card key={p.id} className="transition-all hover:border-white/[0.16] hover:shadow-2xl hover:shadow-black/60">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isFunded ? "verified" : "gold"}
                            className="font-mono text-[10px] font-bold uppercase"
                          >
                            {isFunded ? "FUNDED ESCROW" : "KNOWLEDGE-SHARING"}
                          </Badge>
                          <span className="font-mono text-[11px] text-[#6f6f7b]">
                            ID: {p.id}
                          </span>
                        </div>
                        <CardTitle className="text-xl sm:text-2xl">
                          {p.title}
                        </CardTitle>
                      </div>

                      <div className="text-right">
                        {isFunded ? (
                          <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
                            ₹{p.budget.toLocaleString("en-IN")}
                          </div>
                        ) : (
                          <div className="font-mono text-sm font-bold text-[#b9a9ff]">
                            Institutional Credit
                          </div>
                        )}
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#6f6f7b]">
                          {isFunded ? "100% Escrow Deposited" : "Open Source Attribution"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Public Summary Only */}
                    <p className="text-xs text-[#9d9da8] leading-relaxed">
                      {p.public_summary}
                    </p>

                    {/* Company Record Badge */}
                    <CompanyRecordSection sponsorId={p.sponsor_id} sponsorName={p.sponsor_name} sponsorStars={p.sponsor_stars} />

                    {/* Skills badges */}
                    {p.required_skills && p.required_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6f6f7b] mr-1">
                          Skills:
                        </span>
                        {p.required_skills.map((sk) => (
                          <Badge key={sk} variant="subtle" className="text-[10px] font-mono">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2 text-xs text-[#9d9da8]">
                      <ShieldCheck className="h-4 w-4 text-[#b9a9ff]" />
                      <span>Confidential brief unlocks upon charter signature</span>
                    </div>

                    <Button variant="default" size="sm" asChild className="font-semibold">
                      <Link href={`/charters/${p.id}`} className="flex items-center gap-1.5">
                        <span>View Charter &amp; Scope</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </SectionErrorBoundary>
  );
}
