"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Lock, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CompaniesOverviewPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 animate-fade-up space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="subtle" className="text-xs uppercase font-bold">
          Enterprise Sponsor Portal
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          De-Risk R&D with Proven Contributor Squads
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Post challenges, protect confidential datasets, match with verified talent, and only disburse funds upon milestone approval.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="p-6 space-y-2 border-t-4 border-t-slate-800 dark:border-t-slate-200">
          <Lock className="h-6 w-6 text-slate-800 dark:text-slate-200" />
          <h3 className="font-bold text-base">Gated Briefs & NDA</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Proprietary datasets and clinical briefs remain cryptographically locked until participants sign the charter.
          </p>
        </Card>

        <Card className="p-6 space-y-2 border-t-4 border-t-slate-800 dark:border-t-slate-200">
          <ShieldCheck className="h-6 w-6 text-slate-800 dark:text-slate-200" />
          <h3 className="font-bold text-base">Receipt-Backed Talent</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Matchmaking algorithm ranks students by closed project deliverables, code similarity audits, and verified peer reviews.
          </p>
        </Card>

        <Card className="p-6 space-y-2 border-t-4 border-t-slate-800 dark:border-t-slate-200">
          <Building2 className="h-6 w-6 text-slate-800 dark:text-slate-200" />
          <h3 className="font-bold text-base">Clear IP Transfer</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Bilateral charters explicitly define commercial rights, license terms, and academic publication boundaries.
          </p>
        </Card>
      </div>

      <div className="text-center pt-4">
        <Button size="lg" asChild className="font-bold">
          <Link href="/signup?role=sponsor" className="flex items-center gap-2">
            <span>Post a Problem Challenge</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
