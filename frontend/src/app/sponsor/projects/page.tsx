"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderGit2,
  PlusCircle,
  Coins,
  ArrowRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectItem {
  id: string;
  title: string;
  public_summary: string;
  budget: number;
  engagement_model: string;
  status: string;
  created_at: string;
}

export default function SponsorProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await apiFetch<{ projects: ProjectItem[] }>("/api/projects");
        setProjects(res.projects || []);
      } catch (err: any) {
        toast.error("Failed to load projects: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  return (
    <RoleGuard allowedRoles={["sponsor", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="sponsor" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  My Active Initiatives
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Manage problem milestones, escrow lockers, and review ranked candidate matchmaking.
                </p>
              </div>

              <Button asChild className="gap-2 font-bold" size="sm">
                <Link href="/sponsor/post-problem">
                  <PlusCircle className="h-4 w-4" />
                  <span>Post New Problem</span>
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="p-12 text-center">
                <FolderGit2 className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-base font-bold">No Projects Posted Yet</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Post an industrial challenge to begin matchmaking with verified student and expert teams.
                </p>
                <Button asChild className="mt-6 font-bold" size="sm">
                  <Link href="/sponsor/post-problem">Post a Problem</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {projects.map((p) => (
                  <Card key={p.id} className="p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {p.title}
                          </h3>
                          <Badge variant="subtle" className="text-xs uppercase">
                            {p.engagement_model}
                          </Badge>
                          <Badge
                            variant={p.status === "open" ? "default" : "subtle"}
                            className="capitalize text-xs"
                          >
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                          {p.public_summary}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                            <Coins className="h-3.5 w-3.5" />
                            Rs {p.budget.toLocaleString()} Total Commitment
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button asChild size="sm" className="gap-1.5 font-bold">
                          <Link href={`/sponsor/projects/${p.id}`}>
                            <span>Manage Project &amp; Candidates</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="text-xs">
                          <Link href={`/charters/${p.id}`}>
                            <span>View Public Charter</span>
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
