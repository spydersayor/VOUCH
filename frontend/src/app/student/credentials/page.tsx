"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  ShieldCheck,
  FileCode,
  Sparkles,
  ExternalLink,
  Coins,
  CheckCircle2,
} from "lucide-react";

export default function StudentCredentialsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch<any>("/api/user/settings");
        setProfile(res);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <RoleGuard allowedRoles={["student", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="student" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  Verified Academic & Milestone Credentials
                </h1>
                <Badge variant="subtle" className="gap-1 border-teal-500/30 text-teal-700">
                  <ShieldCheck className="h-3 w-3" />
                  VERIFIED
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Cryptographically anchored achievements, verified skills, and immutable milestone proofs.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Identity & KYC</span>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center gap-1.5 text-base font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Academic KYC Active</span>
                  </div>
                  <p className="text-xs text-slate-500">Institutional email & government ID verified</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Newbie Exploration</span>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center gap-1.5 text-base font-bold text-teal-600 dark:text-teal-400">
                    <Sparkles className="h-4 w-4" />
                    <span>+5% Allocation Boost</span>
                  </div>
                  <p className="text-xs text-slate-500">Algorithm prioritizes equal discovery for all students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Escrow Guarantee</span>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center gap-1.5 text-base font-bold text-slate-900 dark:text-slate-100">
                    <Coins className="h-4 w-4 text-teal-600" />
                    <span>100% Guaranteed Pay</span>
                  </div>
                  <p className="text-xs text-slate-500">Milestone funds locked in escrow before work begins</p>
                </CardContent>
              </Card>
            </div>

            {/* Verified Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Verified Technical Competencies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(profile?.skills || ["PyTorch", "Python", "Computer Vision", "Embedded Systems", "Edge AI"]).map((s: string) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-md border border-teal-500/20 bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-200"
                    >
                      <CheckCircle2 className="h-3 w-3 text-teal-600" />
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Skills verified through code repository evaluation, academic transcript verification, and closed milestone artifacts.
                </p>
              </CardContent>
            </Card>

            {/* Ledger Receipts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Ledger Proofs & Milestone Receipts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      On-Device Skin Lesion Classifier — Milestone M1 &amp; M2
                    </span>
                    <Badge variant="subtle" className="text-[10px]">CLOSED • VERIFIED</Badge>
                  </div>
                  <p className="mt-1 text-slate-500">
                    Model quantization and test benchmarks delivered on time. Payout released via escrow.
                  </p>
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>Block Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                    <Link
                      href="/charters/proj_past_1"
                      className="font-sans font-semibold text-teal-600 hover:underline dark:text-teal-400"
                    >
                      View Closed Charter →
                    </Link>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Cardio Acoustic Pulse Analyzer — Milestone M1
                    </span>
                    <Badge variant="subtle" className="text-[10px]">CLOSED • VERIFIED</Badge>
                  </div>
                  <p className="mt-1 text-slate-500">
                    DSP pipeline normalization completed with zero adverse similarity findings.
                  </p>
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>Block Hash: c5b0a44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c921</span>
                    <Link
                      href="/charters/proj_past_2"
                      className="font-sans font-semibold text-teal-600 hover:underline dark:text-teal-400"
                    >
                      View Closed Charter →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
