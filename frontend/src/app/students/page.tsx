"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Coins, ShieldCheck, ArrowRight, Zap, Award } from "lucide-react";

export default function StudentsOverviewPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white py-16 px-4">
      <div className="mx-auto max-w-4xl animate-fade-up space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-mono text-[#b9a9ff]">
            <GraduationCap className="h-3.5 w-3.5" />
            STUDENT CONTRIBUTOR PORTAL
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Build Provable Engineering Track Records
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Solve real problems from industry sponsors, earn guaranteed rupee milestone payouts, and anchor your achievements on an immutable ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="p-6 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-[#b9a9ff] w-fit border border-violet-500/20">
              <Coins className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Guaranteed Pay</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Funds lock into milestone escrow lockers before you begin. No invoices, no delayed wire transfers.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-[#b9a9ff] w-fit border border-violet-500/20">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Newbie Boost</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every new student receives a Newbie Badge and an exploration boost so newcomers can match alongside senior developers.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-[#b9a9ff] w-fit border border-violet-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Verifiable Proof</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every completed milestone generates a permanent cryptographic receipt that prospective employers can verify anytime.
            </p>
          </Card>
        </div>

        <div className="text-center pt-4">
          <Button size="lg" asChild className="font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30 shadow-xl shadow-violet-600/20">
            <Link href="/signup?role=student" className="flex items-center gap-2">
              <span>Join as Student</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
