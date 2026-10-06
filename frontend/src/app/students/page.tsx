"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Coins, ShieldCheck, ArrowRight, Zap, Award } from "lucide-react";

export default function StudentsOverviewPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 animate-fade-up space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="default" className="text-xs uppercase font-bold">
          Student Contributor Portal
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          Build Provable Engineering Track Records
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Solve real problems from industry sponsors, earn guaranteed rupee milestone payouts, and anchor your achievements on an immutable ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="p-6 space-y-2 border-t-4 border-t-teal-600">
          <Coins className="h-6 w-6 text-teal-600" />
          <h3 className="font-bold text-base">Guaranteed Pay</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Funds lock into milestone escrow lockers before you begin. No invoices, no delayed wire transfers.
          </p>
        </Card>

        <Card className="p-6 space-y-2 border-t-4 border-t-teal-600">
          <Award className="h-6 w-6 text-teal-600" />
          <h3 className="font-bold text-base">Newbie Boost</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every new student receives a Newbie Badge and an exploration boost so newcomers can match alongside senior developers.
          </p>
        </Card>

        <Card className="p-6 space-y-2 border-t-4 border-t-teal-600">
          <ShieldCheck className="h-6 w-6 text-teal-600" />
          <h3 className="font-bold text-base">Verifiable Proof</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every completed milestone generates a permanent cryptographic receipt that prospective employers can verify anytime.
          </p>
        </Card>
      </div>

      <div className="text-center pt-4">
        <Button size="lg" asChild className="font-bold">
          <Link href="/signup?role=student" className="flex items-center gap-2">
            <span>Join as Student</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
