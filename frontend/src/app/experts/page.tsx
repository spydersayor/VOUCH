"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Coins, ShieldCheck, ArrowRight, Scale } from "lucide-react";

export default function ExpertsOverviewPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 animate-fade-up space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="flagged" className="text-xs uppercase font-bold">
          Expert Advisor Portal
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          Mentorship with True Attribution & Compensation
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Guide top student teams, conduct code reviews, enforce technical integrity, and receive 30% advisory splits.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="p-6 space-y-2 border-t-4 border-t-rose-500">
          <Coins className="h-6 w-6 text-rose-500" />
          <h3 className="font-bold text-base">30% Net Pool Share</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Lead experts receive a dedicated 30% advisory share of all net milestone disbursements for their code review and guidance.
          </p>
        </Card>

        <Card className="p-6 space-y-2 border-t-4 border-t-rose-500">
          <Scale className="h-6 w-6 text-rose-500" />
          <h3 className="font-bold text-base">Conflict of Interest</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Transparently declare corporate and institutional conflicts on the ledger to prevent biased match allocations.
          </p>
        </Card>

        <Card className="p-6 space-y-2 border-t-4 border-t-rose-500">
          <ShieldCheck className="h-6 w-6 text-rose-500" />
          <h3 className="font-bold text-base">Verified Co-Authorship</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Bilateral charters guarantee formal recognition on patents, papers, and corporate production releases.
          </p>
        </Card>
      </div>

      <div className="text-center pt-4">
        <Button size="lg" asChild className="font-bold">
          <Link href="/signup?role=expert" className="flex items-center gap-2">
            <span>Join as Expert Mentor</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
