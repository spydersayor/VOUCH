"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, Lock, Cpu, Sparkles, CheckCircle2, Terminal } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 animate-fade-up space-y-16">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#c4b5fd]" />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-300 font-semibold">
            ARCHITECTURE & ORIGIN
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extralight tracking-tight text-white">
          About{" "}
          <span className="text-violet-300 font-light drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]">
            VOUCH
          </span>
        </h1>
        <p className="text-sm sm:text-base text-[#8b8ea0] max-w-xl mx-auto font-light leading-relaxed">
          An immutable collaboration system built from first principles for provable academic and industrial engineering.
        </p>
      </div>

      {/* Main Narrative Cards */}
      <div className="space-y-8">
        <Card className="p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-violet-400 font-semibold block mb-2">
            MISSION STATEMENT
          </span>
          <h2 className="text-2xl sm:text-3xl font-extralight text-white mb-4 leading-snug">
            The Mission: Replace Resumes with Receipts
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            VOUCH was conceived around a single foundational premise: <strong className="text-white font-medium">work you can prove</strong> is infinitely more valuable than self-asserted resume bullet points. In an era where generative AI can synthesize plausible code and fraudulent credentials in seconds, human collaboration requires cryptographic proofs of contribution, peer review, and milestone execution.
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card className="p-8 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="h-9 w-9 rounded-xl bg-violet-950/50 border border-violet-400/40 flex items-center justify-center text-violet-300">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-light text-white">SHA-256 Ledger Diary</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
              Every action is recorded into a strictly sequential blockchain-style diary. Each entry commits the cryptographic hash of the current payload and points back to the previous entry hash.
            </p>
          </Card>

          <Card className="p-8 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="h-9 w-9 rounded-xl bg-violet-950/50 border border-violet-400/40 flex items-center justify-center text-violet-300">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-light text-white">Zero-Trust Escrow Locker</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
              Companies cannot access contributor outputs without funding escrow upfront, and contributors cannot access proprietary clinical scans or briefs without signing bilateral charters.
            </p>
          </Card>
        </div>

        <Card className="p-8 sm:p-10">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-4 w-4 text-violet-400" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-violet-400 font-semibold">
              ENGINEERING STACK
            </span>
          </div>
          <h2 className="text-2xl font-extralight text-white mb-3">
            Development & Offline Execution
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
            Built using Google Antigravity as an advanced agentic pair programmer. Engineered with strict local offline execution requirements — running on FastAPI, SQLite, Next.js 16 App Router, TypeScript, and Tailwind CSS with zero third-party telemetry.
          </p>
        </Card>
      </div>
    </div>
  );
}
