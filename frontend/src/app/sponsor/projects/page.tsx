"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderGit2,
  PlusCircle,
  Coins,
  ArrowRight,
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
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  My Active Initiatives
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Manage problem milestones, escrow lockers, and review ranked candidate matchmaking.
                </p>
              </div>

              <Button asChild className="gap-2 font-semibold" size="sm">
                <Link href="/sponsor/post-problem">
                  <PlusCircle className="h-4 w-4" />
                  <span>Post New Problem</span>
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-32 animate-pulse rounded-2xl border border-white/[0.08] bg-[#0c0d12]" />
                <div className="h-32 animate-pulse rounded-2xl border border-white/[0.08] bg-[#0c0d12]" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="p-12 text-center">
                <FolderGit2 className="mx-auto h-10 w-10 text-[#6f6f7b]" />
                <h3 className="mt-4 text-base font-bold text-white">No Projects Posted Yet</h3>
                <p className="mt-1 text-xs text-[#9d9da8]">
                  Post an industrial challenge to begin matchmaking with verified student and expert teams.
                </p>
                <Button asChild className="mt-6 font-semibold" size="sm">
                  <Link href="/sponsor/post-problem">Post a Problem</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {projects.map((p) => (
                  <Card key={p.id} className="p-6 transition-all hover:border-white/[0.16]">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-white">
                            {p.title}
                          </h3>
                          <Badge variant="subtle" className="font-mono text-[10px] uppercase">
                            {p.engagement_model}
                          </Badge>
                          <Badge
                            variant={p.status === "open" ? "default" : "subtle"}
                            className="capitalize font-mono text-[10px]"
                          >
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#9d9da8] max-w-2xl leading-relaxed">
                          {p.public_summary}
                        </p>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="font-bold text-emerald-400">
                            ₹{p.budget.toLocaleString("en-IN")} Total Commitment
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button asChild size="sm" className="gap-1.5 font-semibold">
                          <Link href={`/sponsor/projects/${p.id}`}>
                            <span>Manage Project &amp; Candidates</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="text-xs font-mono text-[#b9a9ff] hover:text-white">
                          <Link href={`/charters/${p.id}`}>
                            <span>View Public Charter →</span>
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
