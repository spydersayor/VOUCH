"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import Link from "next/link";
import { Award, Wallet, Clock, Lock, CheckCircle2, ArrowRight } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Student Workspace
              </h1>
              <Badge variant={user?.newbie_badge ? "newbie" : "gold"}>
                {user?.newbie_badge ? "NEWBIE BADGE" : `${user?.stars || "4.6"} ⭐`}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Welcome, {user?.name}. Track your open applications, locked milestones, and verified credentials.
            </p>
          </div>
          <Button variant="default" asChild>
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Paid Earnings
              </span>
              <Wallet className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {formatRupees(25783)}
              </div>
              <p className="mt-1 text-xs text-slate-500">From closed project milestones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Locked in Escrow
              </span>
              <Lock className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {formatRupees(59500)}
              </div>
              <p className="mt-1 text-xs text-slate-500">Retinopathy initiative pool</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Actions
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                1 Charter
              </div>
              <p className="mt-1 text-xs text-slate-500">Review terms to unlock brief</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Simulated Wallet
              </span>
              <Award className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatRupees(user?.wallet_balance || 25000)}
              </div>
              <p className="mt-1 text-xs text-slate-500">Transferable balance</p>
            </CardContent>
          </Card>
        </div>

        {/* Needs My Action Card */}
        <div className="mt-8">
          <Card className="border-teal-200 bg-teal-50/40 dark:border-teal-900 dark:bg-teal-950/20">
            <CardHeader>
              <CardTitle className="text-lg text-teal-950 dark:text-teal-200">
                ⚡ Needs My Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-teal-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Accept Charter v1: Diabetic Retinopathy Detection
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sponsor published Charter Agreement v1. Accept the charter & engagement model to unlock the confidential clinical dataset.
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href="/open-problems">Review Charter & Accept</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
