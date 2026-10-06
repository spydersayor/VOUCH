"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Sparkles,
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
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="border-b border-white/[0.06] pb-6">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Verified Academic &amp; Milestone Credentials
                </h1>
                <Badge variant="subtle" className="gap-1 border-[#8f7cff]/30 bg-[#8f7cff]/10 text-[#b9a9ff] font-mono text-[10px]">
                  <ShieldCheck className="h-3 w-3" />
                  VERIFIED
                </Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                Cryptographically anchored achievements, verified skills, and immutable milestone proofs.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">Identity &amp; KYC</span>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center gap-1.5 text-base font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Academic KYC Active</span>
                  </div>
                  <p className="text-xs text-[#9d9da8]">Institutional email &amp; government ID verified</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">Newbie Exploration</span>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center gap-1.5 text-base font-bold text-[#b9a9ff]">
                    <Sparkles className="h-4 w-4" />
                    <span>+5% Allocation Boost</span>
                  </div>
                  <p className="text-xs text-[#9d9da8]">Algorithm prioritizes equal discovery for all students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">Escrow Guarantee</span>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center gap-1.5 text-base font-bold text-white">
                    <Coins className="h-4 w-4 text-[#b9a9ff]" />
                    <span>100% Guaranteed Pay</span>
                  </div>
                  <p className="text-xs text-[#9d9da8]">Milestone funds locked in escrow before work begins</p>
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
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#8f7cff]/30 bg-[#8f7cff]/10 px-3 py-1 font-mono text-xs font-semibold text-[#b9a9ff]"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[#9d9da8] leading-relaxed">
                  Skills verified through code repository evaluation, academic transcript verification, and closed milestone artifacts.
                </p>
              </CardContent>
            </Card>

            {/* Ledger Receipts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Ledger Proofs &amp; Milestone Receipts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-white/[0.08] bg-[#050508]/80 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      On-Device Skin Lesion Classifier — Milestone M1 &amp; M2
                    </span>
                    <Badge variant="subtle" className="font-mono text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-950/20">CLOSED • VERIFIED</Badge>
                  </div>
                  <p className="mt-1 text-[#9d9da8] leading-relaxed">
                    Model quantization and test benchmarks delivered on time. Payout released via escrow.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 font-mono text-[10px] text-[#6f6f7b]">
                    <span>Block Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                    <Link
                      href="/charters/proj_past_1"
                      className="text-[#b9a9ff] hover:text-white transition-colors"
                    >
                      View Closed Charter →
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#050508]/80 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      Cardio Acoustic Pulse Analyzer — Milestone M1
                    </span>
                    <Badge variant="subtle" className="font-mono text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-950/20">CLOSED • VERIFIED</Badge>
                  </div>
                  <p className="mt-1 text-[#9d9da8] leading-relaxed">
                    DSP pipeline normalization completed with zero adverse similarity findings.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 font-mono text-[10px] text-[#6f6f7b]">
                    <span>Block Hash: c5b0a44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c921</span>
                    <Link
                      href="/charters/proj_past_2"
                      className="text-[#b9a9ff] hover:text-white transition-colors"
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
