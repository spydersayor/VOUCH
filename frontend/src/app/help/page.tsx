"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlayCircle,
  Shield,
  Zap,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 animate-fade-up space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="subtle" className="text-xs uppercase font-bold">
          Evaluation Guide
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          Demo Walkthrough &amp; Judging Manual
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Recommended test journeys to evaluate VOUCH&apos;s cryptographic guarantees, escrow mechanics, and role segregation.
        </p>

        {/* Load Demo at Stage Controls */}
        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-teal-200 bg-teal-50/60 p-5 shadow-sm dark:border-teal-900 dark:bg-teal-950/30">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-200 mb-3">
            ⚡ Quick-Jump: Load Demo at Stage
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button size="sm" variant="outline" asChild className="bg-white text-xs font-semibold dark:bg-slate-900">
              <Link href="/sponsor/post-problem">Stage: Before Posting</Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="bg-white text-xs font-semibold dark:bg-slate-900">
              <Link href="/sponsor/projects/proj_retinopathy">Stage: After Matching</Link>
            </Button>
            <Button size="sm" asChild className="bg-teal-600 text-white text-xs font-bold hover:bg-teal-700">
              <Link href="/projects/proj_retinopathy/workspace">Stage: Mid-Project</Link>
            </Button>
            <Button size="sm" asChild className="bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700">
              <Link href="/projects/proj_retinopathy/workspace">Stage: Ready for Milestone Acceptance</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
            <Zap className="h-5 w-5 text-teal-600" />
            <span>Story Journey 1: Role-Aware Login & Charter Acceptance</span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <li>Go to <strong>Log In</strong> and select the <strong>Student</strong> role card.</li>
            <li>Click the one-click demo chip for <strong>Student C (Accept Flow Demo)</strong> to test the pending charter acceptance flow (or <strong>Student A</strong> for the active workspace).</li>
            <li>Navigate to <strong>Charters to Accept</strong> on the student dashboard.</li>
            <li>Click <strong>Review & Accept Charter</strong> for the Diabetic Retinopathy project.</li>
            <li>Confirm the 2 checkboxes and click <strong>Accept Charter v1</strong>. Observe the verified ledger signature and confidential brief unlock!</li>
          </ol>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
            <Shield className="h-5 w-5 text-teal-600" />
            <span>Story Journey 2: Ledger Verification & Tamper Simulation</span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <li>Log in as <strong>Admin</strong> (admin@vouch.local).</li>
            <li>Visit the <strong>Admin Dashboard</strong> and click <strong>Simulate Tamper</strong>.</li>
            <li>Notice the topbar ledger pill and landing page widget turn red immediately: <em>TAMPER AT ENTRY #N</em>.</li>
            <li>Click <strong>Reset Demo Data</strong> to restore the cryptographic chain to 100% verified status.</li>
          </ol>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
            <PlayCircle className="h-5 w-5 text-teal-600" />
            <span>Story Journey 3: Payout Math & Rupee Split Check</span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <li>Visit <strong>/pricing</strong>.</li>
            <li>Enter ₹1,00,000 in the split simulator.</li>
            <li>Verify exact integer rupee payouts: Platform ₹10,000, AI Reserve ₹5,000, Expert ₹25,500, Students ₹25,783 / ₹18,643 / ₹15,074.</li>
          </ol>
        </Card>
      </div>

      <div className="text-center pt-4">
        <Button size="lg" asChild className="font-bold">
          <Link href="/login" className="flex items-center gap-2">
            <span>Begin Demo Evaluation</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
