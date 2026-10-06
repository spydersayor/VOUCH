"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Coins, ShieldCheck, ArrowRight, Scale, UserCheck } from "lucide-react";

export default function ExpertsOverviewPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white py-16 px-4">
      <div className="mx-auto max-w-4xl animate-fade-up space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-mono text-[#b9a9ff]">
            <UserCheck className="h-3.5 w-3.5" />
            EXPERT ADVISOR PORTAL
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Mentorship with True Attribution &amp; Compensation
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Guide top student teams, conduct code reviews, enforce technical integrity, and receive 30% advisory splits.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="p-6 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-[#b9a9ff] w-fit border border-violet-500/20">
              <Coins className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">30% Net Pool Share</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Lead experts receive a dedicated 30% advisory share of all net milestone disbursements for their code review and guidance.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-[#b9a9ff] w-fit border border-violet-500/20">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Conflict of Interest</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Transparently declare corporate and institutional conflicts on the ledger to prevent biased match allocations.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-[#b9a9ff] w-fit border border-violet-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Verified Co-Authorship</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bilateral charters guarantee formal recognition on patents, papers, and corporate production releases.
            </p>
          </Card>
        </div>

        <div className="text-center pt-4">
          <Button size="lg" asChild className="font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30 shadow-xl shadow-violet-600/20">
            <Link href="/signup?role=expert" className="flex items-center gap-2">
              <span>Join as Expert Mentor</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
