"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, Lock, Cpu, Sparkles, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 animate-fade-up space-y-12">
      <div className="text-center space-y-3">
        <Badge variant="subtle" className="text-xs uppercase font-bold">
          Architecture & Origin
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          About VOUCH
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          An immutable collaboration system built from first principles for provable academic and industrial R&D.
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            The Mission: Replace Resumes with Receipts
          </h2>
          <p>
            VOUCH was conceived around a single foundational premise: <strong>work you can prove</strong> is infinitely more valuable than self-asserted resume bullet points. In an era where AI can synthesize plausible code and fraudulent credentials in seconds, human collaboration requires cryptographic proofs of contribution, peer review, and milestone execution.
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Shield className="h-5 w-5 text-teal-600" />
              <span>SHA-256 Ledger Diary</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every action is recorded into a strictly sequential blockchain-style diary. Each entry commits the cryptographic hash of the current payload and points back to the previous entry hash.
            </p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Lock className="h-5 w-5 text-teal-600" />
              <span>Zero-Trust Escrow</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Companies cannot access contributor outputs without funding escrow, and contributors cannot access proprietary patient scans or briefs without signing bilateral charters.
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Development & Engineering Story
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Built using Google Antigravity as an advanced AI coding pair programmer. Engineered with strict local offline execution requirements — running on FastAPI, SQLite, Next.js 16 App Router, TypeScript, and Tailwind CSS.
          </p>
        </Card>
      </div>
    </div>
  );
}
