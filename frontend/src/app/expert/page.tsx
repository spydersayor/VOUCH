"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import Link from "next/link";
import { Shield, CheckSquare, AlertCircle, ArrowRight } from "lucide-react";
import { RoleSidebar } from "@/components/shell/RoleSidebar";

export default function ExpertDashboard() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["expert"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="expert" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                    Expert Advisory Console
                  </h1>
                  <Badge variant="gold">{user?.stars || "4.9"} ⭐ RATING</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Welcome, {user?.name}. Guide student architectures, review code integrity, and approve milestones.
                </p>
              </div>
              <Button variant="default" asChild>
                <Link href="/expert/matches">
                  <span>View Matched Initiatives</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Guiding Initiatives
              </span>
              <Shield className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                1 Active
              </div>
              <p className="mt-1 text-xs text-slate-500">Diabetic Retinopathy on Edge</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Review Queue
              </span>
              <CheckSquare className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                1 Pending
              </div>
              <p className="mt-1 text-xs text-slate-500">Milestone 1 artifact submission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Advisory Earnings
              </span>
              <span className="text-xs font-bold text-teal-600">30% Split</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatRupees(25500)}
              </div>
              <p className="mt-1 text-xs text-slate-500">Locked for Retinopathy M1-M3</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Initiative Action Card */}
        <div className="mt-8">
          <Card className="border-teal-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Active Advisory Workspace: Diabetic Retinopathy Detection
              </CardTitle>
              <Badge className="bg-teal-600 text-white text-xs">Review Desk</Badge>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Deliverables submitted for Milestone 1 are ready for expert evaluation. Review code integrity, verify latency metrics, and record sign-off.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" asChild className="gap-1.5 font-bold bg-teal-600 hover:bg-teal-700 text-white">
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
