"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Lock, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CompaniesOverviewPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white py-16 px-4">
      <div className="mx-auto max-w-4xl animate-fade-up space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-mono text-[#b9a9ff]">
            <Building2 className="h-3.5 w-3.5" />
            ENTERPRISE SPONSOR PORTAL
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            De-Risk R&amp;D with Proven Contributor Squads
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Post challenges, protect confidential datasets, match with verified talent, and only disburse funds upon milestone approval.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="p-6 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-[#b9a9ff] w-fit border border-violet-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Gated Briefs &amp; NDA</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Proprietary datasets and clinical briefs remain cryptographically locked until participants sign the charter.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-[#b9a9ff] w-fit border border-violet-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Receipt-Backed Talent</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Matchmaking algorithm ranks students by closed project deliverables, code similarity audits, and verified peer reviews.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-[#b9a9ff] w-fit border border-violet-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Clear IP Transfer</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bilateral charters explicitly define commercial rights, license terms, and academic publication boundaries.
            </p>
          </Card>
        </div>

        <div className="text-center pt-4">
          <Button size="lg" asChild className="font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30 shadow-xl shadow-violet-600/20">
            <Link href="/signup?role=sponsor" className="flex items-center gap-2">
              <span>Post a Problem Challenge</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
