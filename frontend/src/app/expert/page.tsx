"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import Link from "next/link";
import { Shield, CheckSquare, ArrowRight } from "lucide-react";
import { RoleSidebar } from "@/components/shell/RoleSidebar";

export default function ExpertDashboard() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["expert"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="expert" />
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Expert Advisory Console
                  </h1>
                  <Badge variant="gold" className="font-mono text-[10px]">{user?.stars || "4.9"} ⭐ RATING</Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Welcome, {user?.name}. Guide student architectures, review code integrity, and approve milestones.
                </p>
              </div>
              <Button variant="default" asChild className="font-semibold">
                <Link href="/expert/matches">
                  <span>View Matched Initiatives</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Guiding Initiatives
                  </span>
                  <Shield className="h-4 w-4 text-[#b9a9ff]" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-[#b9a9ff]">
                    1 Active
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Diabetic Retinopathy on Edge</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Review Queue
                  </span>
                  <CheckSquare className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-amber-400">
                    1 Pending
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Milestone 1 artifact submission</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Advisory Earnings
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider">30% Split</span>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
                    {formatRupees(25500)}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Locked for Retinopathy M1-M3</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Initiative Action Card */}
            <div className="mt-8">
              <Card className="border-white/[0.08] bg-[#0c0c0f]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-bold text-white">
                    Active Advisory Workspace: Diabetic Retinopathy Detection
                  </CardTitle>
                  <Badge variant="teal" className="font-mono text-[10px]">Review Desk</Badge>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#9d9da8]">
                      Deliverables submitted for Milestone 1 are ready for expert evaluation. Review code integrity, verify latency metrics, and record sign-off.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" asChild className="gap-1.5 font-bold">
                      <Link href="/projects/proj_retinopathy/workspace">
                        <span>Enter Workspace</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild className="gap-1.5 font-semibold text-xs">
                      <Link href="/projects/proj_retinopathy/timeline">
                        <span>Audit Timeline</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
