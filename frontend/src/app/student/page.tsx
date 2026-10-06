"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import Link from "next/link";
import { Award, Wallet, Clock, Lock, ArrowRight } from "lucide-react";
import { RoleSidebar } from "@/components/shell/RoleSidebar";

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="student" />
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Student Workspace
                  </h1>
                  <Badge variant={user?.newbie_badge ? "newbie" : "gold"}>
                    {user?.newbie_badge ? "NEWBIE BADGE" : `${user?.stars || "4.6"} ⭐`}
                  </Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Welcome, {user?.name}. Track your open applications, locked milestones, and verified credentials.
                </p>
              </div>
              <Button variant="default" asChild className="font-semibold">
                <Link href="/open-problems">
                  <span>Browse Open Problems</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Paid Earnings
                  </span>
                  <Wallet className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
                    {formatRupees(25783)}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">From closed project milestones</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Locked in Escrow
                  </span>
                  <Lock className="h-4 w-4 text-[#b9a9ff]" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-[#b9a9ff]">
                    {formatRupees(59500)}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Retinopathy initiative pool</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Pending Actions
                  </span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-amber-400">
                    1 Charter
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Review terms to unlock brief</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Simulated Wallet
                  </span>
                  <Award className="h-4 w-4 text-[#9d9da8]" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                    {formatRupees(user?.wallet_balance || 25000)}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Transferable balance</p>
                </CardContent>
              </Card>
            </div>

            {/* Needs My Action Card */}
            <Card className="border-[#8f7cff]/30 bg-[#8f7cff]/[0.06] p-6 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#b9a9ff]">
                      ⚡ Needs My Action
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Accept Charter v1: Diabetic Retinopathy Detection
                  </h3>
                  <p className="text-xs text-[#9d9da8] max-w-2xl leading-relaxed">
                    Sponsor published Charter Agreement v1. Accept the charter &amp; engagement model to unlock the confidential clinical dataset.
                  </p>
                </div>
                <Button size="sm" asChild className="font-semibold">
                  <Link href="/charters/proj_retinopathy">Review Charter &amp; Accept</Link>
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
