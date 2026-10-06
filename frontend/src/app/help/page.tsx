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
  BookOpen,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white py-16 px-4">
      <div className="mx-auto max-w-4xl animate-fade-up space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-mono text-[#b9a9ff]">
            <BookOpen className="h-3.5 w-3.5" />
            EVALUATION GUIDE
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Demo Walkthrough &amp; Judging Manual
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Recommended test journeys to evaluate VOUCH's cryptographic guarantees, escrow mechanics, and role segregation.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-4 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="flex items-center gap-3 text-white font-bold text-base">
              <div className="p-2 rounded-xl bg-violet-500/10 text-[#b9a9ff] border border-violet-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <span>Story Journey 1: Role-Aware Login &amp; Charter Acceptance</span>
            </div>
            <ol className="list-decimal list-inside space-y-2.5 text-xs text-zinc-300 leading-relaxed pl-1">
              <li>Go to <strong className="text-white">Log In</strong> and select the <strong className="text-white">Student</strong> role card.</li>
              <li>Click the one-click demo chip for <strong className="text-white">Student A (4.6 ⭐)</strong>.</li>
              <li>Navigate to <strong className="text-white">Charters to Accept</strong> on the student dashboard.</li>
              <li>Click <strong className="text-white">Review &amp; Accept Charter</strong> for the Diabetic Retinopathy project.</li>
              <li>Confirm the 2 checkboxes and click <strong className="text-white">Accept Charter v1</strong>. Observe the verified ledger signature and confidential brief unlock!</li>
            </ol>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="flex items-center gap-3 text-white font-bold text-base">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Shield className="h-5 w-5" />
              </div>
              <span>Story Journey 2: Ledger Verification &amp; Tamper Simulation</span>
            </div>
            <ol className="list-decimal list-inside space-y-2.5 text-xs text-zinc-300 leading-relaxed pl-1">
              <li>Log in as <strong className="text-white">Admin</strong> (admin@vouch.local).</li>
              <li>Visit the <strong className="text-white">Admin Dashboard</strong> and click <strong className="text-white">Simulate Tamper</strong>.</li>
              <li>Notice the topbar ledger pill and landing page widget turn red immediately: <em className="text-rose-400">TAMPER AT ENTRY #N</em>.</li>
              <li>Click <strong className="text-white">Reset Demo Data</strong> to restore the cryptographic chain to 100% verified status.</li>
            </ol>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="flex items-center gap-3 text-white font-bold text-base">
              <div className="p-2 rounded-xl bg-violet-500/10 text-[#b9a9ff] border border-violet-500/20">
                <PlayCircle className="h-5 w-5" />
              </div>
              <span>Story Journey 3: Payout Math &amp; Rupee Split Check</span>
            </div>
            <ol className="list-decimal list-inside space-y-2.5 text-xs text-zinc-300 leading-relaxed pl-1">
              <li>Visit <strong className="text-white">/pricing</strong>.</li>
              <li>Enter ₹1,00,000 in the split simulator.</li>
              <li>Verify exact integer rupee payouts: Platform ₹10,000, AI Reserve ₹5,000, Expert ₹25,500, Students ₹25,783 / ₹18,643 / ₹15,074.</li>
            </ol>
          </Card>
        </div>

        <div className="text-center pt-4">
          <Button size="lg" asChild className="font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30 shadow-xl shadow-violet-600/20">
            <Link href="/login" className="flex items-center gap-2">
              <span>Begin Demo Evaluation</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
