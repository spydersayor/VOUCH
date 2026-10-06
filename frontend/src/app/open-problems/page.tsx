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
  Filter,
  Coins,
  Scale,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  CheckCircle2,
} from "lucide-react";

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
    <div className="mx-auto max-w-6xl px-4 py-12 animate-fade-up space-y-8">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <Badge variant="subtle" className="text-xs font-bold uppercase">
          Directory
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          Open Problem Briefs
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Browse verified technical challenges from corporate sponsors. Every project features upfront escrow or formal attribution pledges.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Search by skill, title, or topic (e.g. PyTorch, Vision, NLP)..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">All Engagement Models</option>
              <option value="funded">Funded Only (Rupee Escrow)</option>
              <option value="knowledge-sharing">Knowledge-Sharing (Open Credit)</option>
            </select>

            <select
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">All Budgets</option>
              <option value="funded_gt_50k">₹50,000+ Escrow</option>
            </select>

            <Button type="submit" variant="default" className="font-bold">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Projects List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-44 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-44 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              No matching problems found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your skill search keywords or clear filter criteria.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
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
              <Card key={p.id} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isFunded ? "verified" : "gold"}
                          className="text-[10px] font-bold"
                        >
                          {isFunded ? "FUNDED ESCROW" : "KNOWLEDGE-SHARING"}
                        </Badge>
                        <span className="text-xs font-mono text-slate-400">
                          ID: {p.id}
                        </span>
                      </div>
                      <CardTitle className="text-xl">
                        {p.title}
                      </CardTitle>
                    </div>

                    <div className="text-right">
                      {isFunded ? (
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          ₹{p.budget.toLocaleString("en-IN")}
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          Institutional Credit
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {isFunded ? "100% Escrow Deposited" : "Open Source Attribution"}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Public Summary Only (Confidential Brief is Gated!) */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {p.public_summary}
                  </p>

                  {/* Company Record Badge */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {p.sponsor_name}
                      </span>
                      <div className="flex items-center text-amber-500 font-bold gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{p.sponsor_stars}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        100% On-Time Payment
                      </span>
                      <span>•</span>
                      <span>0 Disputes</span>
                      <span>•</span>
                      <span>Escrow Guaranteed</span>
                    </div>
                  </div>

                  {/* Skills badges */}
                  {p.required_skills && p.required_skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">
                        Skills:
                      </span>
                      {p.required_skills.map((sk) => (
                        <Badge key={sk} variant="subtle" className="text-[10px] font-semibold">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <span>Confidential brief unlocks upon charter signature</span>
                  </div>

                  <Button variant="default" size="sm" asChild className="font-bold">
                    <Link href={`/charters/${p.id}`} className="flex items-center gap-1.5">
                      <span>View Charter & Scope</span>
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
  );
}
