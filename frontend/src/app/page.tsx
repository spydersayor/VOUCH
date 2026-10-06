"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { HeroScene } from "@/components/fx/HeroScene";
import { HeroTandemLayout } from "@/components/hero/HeroTandemLayout";
import { StatementSection } from "@/components/landing/StatementSection";
import { EngagementShelfSection } from "@/components/landing/EngagementShelfSection";
import { DetailRoomsSection } from "@/components/landing/DetailRoomsSection";
import { PrinciplesSection } from "@/components/landing/PrinciplesSection";
import { RolesJournalSection } from "@/components/landing/RolesJournalSection";
import { triggerVerifyWave, triggerRehearsalScenario } from "@/components/fx/fx-config";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Terminal,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const [ledger, setLedger] = useState<{
    status: string;
    count?: number;
    head_hash?: string;
    broken_seq?: number;
    reason?: string;
  }>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const fetchLedger = async () => {
    setRefreshing(true);
    try {
      const data = await apiFetch<any>("/api/ledger/verify");
      setLedger(data);
      // Trigger wave through dot field
      triggerVerifyWave(data.status === "ok" ? "ok" : "tampered", data.broken_seq, data.count);
    } catch (e: any) {
      setLedger({ status: "error", reason: e.message });
      triggerVerifyWave("tampered");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleSimulateTamper = async () => {
    triggerRehearsalScenario("scenario-tamper", "Simulate DB Tampering");
    try {
      await apiFetch("/api/ledger/simulate-tamper", {
        method: "POST",
        body: JSON.stringify({ seq: 2 }),
      });
      // Fire alarm wave through dot field
      triggerVerifyWave("tampered", 2);
      toast.error("Simulated DB tamper applied at block #2! Chain verification will now fail.");
      await fetchLedger();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResetData = async () => {
    triggerRehearsalScenario("scenario-reset", "Reset Clean Chain");
    try {
      await apiFetch("/api/admin/reset", { method: "POST" });
      triggerVerifyWave("ok", undefined, 24);
      toast.success("Database and cryptographic ledger reset to clean state!");
      await fetchLedger();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const FAQS = [
    {
      q: "How does the milestone escrow locker protect students?",
      a: "Before a student begins work on any funded milestone, the company sponsor must deposit the full milestone funds into a smart locker. The funds are mathematically locked and can only be released upon milestone acceptance or arbitrated resolution.",
    },
    {
      q: "What makes VOUCH star ratings different from other platforms?",
      a: "Ratings are never self-reported or based on vague feedback. Every star rating is calculated directly from structured peer reviews across quality, timeliness, communication, and integrity, backed by cryptographic ledger receipts.",
    },
    {
      q: "How does confidential brief gating work?",
      a: "The company's detailed clinical brief and proprietary datasets remain inaccessible on the server until contributors accept the active charter version and agree to the non-disclosure clause. Acceptance creates a signed ledger block.",
    },
    {
      q: "Can a beginner or student with no prior projects get matched?",
      a: "Yes. Every new account receives a Newbie Badge and an exploration boost in the matching algorithm to ensure fair initial discovery alongside established talent.",
    },
    {
      q: "Does this demo run entirely offline without third-party services?",
      a: "Yes. All cryptography, SHA-256 hash chaining, SQLite storage, and calculations run completely locally on your machine with zero external network or LLM dependencies.",
    },
  ];

  return (
    <div className="w-full flex flex-col space-y-8 select-none">
      {/* 1. HERO SECTION WITH ATMOSPHERIC DOT FIELD, SEAL CENTERPIECE, BEAM & TANDEM LAYOUT */}
      <section id="hero-top" className="relative w-full overflow-hidden bg-[#050508] border-b border-white/[0.08]">
        <HeroScene />
        <HeroTandemLayout onOpenLedger={fetchLedger} ledgerCount={ledger.count || 24} />
      </section>

      {/* 2. CORE THESIS STATEMENT SECTION */}
      <StatementSection />

      {/* 3. FOUR ENGAGEMENT MODELS SHELF */}
      <EngagementShelfSection />

      {/* 4. FOUR PROTOCOL DETAIL ROOMS */}
      <DetailRoomsSection />

      {/* 5. FOUR NON-NEGOTIABLE PRINCIPLES */}
      <PrinciplesSection />

      {/* 6. FIVE EDITORIAL ROLE CARDS */}
      <RolesJournalSection />

      {/* 7. LIVE LEDGER VERIFIER & REHEARSAL SANDBOX WIDGET */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 w-full pt-12">
        <section
          id="ledger-verifier"
          className="rounded-3xl border border-white/10 bg-[#0c0d14]/90 p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-8 backdrop-blur-xl relative overflow-hidden"
        >
          {/* Subtle ambient light */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-900 via-[#1a1338] to-violet-950 border border-violet-400/40 text-violet-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white">
                    Live Platform Diary Verifier
                  </h2>
                  <span className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full border border-violet-400/40 bg-violet-950/40 text-violet-300">
                    SHA-256 CHAINED
                  </span>
                </div>
                <p className="text-xs text-[#8b8ea0] mt-1 font-mono">
                  Audits every block from Genesis to Head in real time via <code>/api/ledger/verify</code>.
                </p>
              </div>
            </div>

            <Button
              variant="default"
              size="default"
              onClick={fetchLedger}
              disabled={refreshing}
              className="rounded-full font-mono text-xs tracking-widest uppercase"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Verify Diary Now</span>
            </Button>
          </div>

          {/* Verification Status Result Display */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#050508] p-6 font-mono text-xs shadow-inner">
            {ledger.status === "ok" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span>CRYPTOGRAPHIC INTEGRITY VERIFIED (OK 200)</span>
                </div>
                <div className="text-slate-300">
                  <strong className="text-white">Sequential Blocks:</strong> {ledger.count} verified blocks
                </div>
                <div className="truncate text-slate-400">
                  <strong className="text-white">Head Entry Hash:</strong> {ledger.head_hash || "Genesis"}
                </div>
              </div>
            ) : ledger.status === "tampered" ? (
              <div className="space-y-2 text-rose-400">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>INTEGRITY FAILURE: BROKEN AT ENTRY #{ledger.broken_seq}</span>
                </div>
                <div className="text-slate-300">{ledger.reason}</div>
              </div>
            ) : (
              <div className="text-slate-400">Auditing cryptographic chain...</div>
            )}
          </div>

          {/* REHEARSAL ENGINE SCENARIO SELECTOR */}
          <div id="rehearsal-engine" className="pt-6 border-t border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Rehearsal Engine Interactive Scenarios
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#8b8ea0]">
                Click scenario to redirect beam & trigger dot wave
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => {
                  fetchLedger();
                  toast.success("Verifying intact ledger chain — calm green wave fired!");
                }}
                className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-left hover:border-emerald-500/60 transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Scenario 1: Verified Chain</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400 font-sans leading-relaxed">
                  Normal consensus: sends serene emerald wave through dot field.
                </p>
              </button>

              <button
                type="button"
                onClick={handleSimulateTamper}
                className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-left hover:border-rose-500/60 transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300 font-mono">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Scenario 2: Tamper Entry #2</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400 font-sans leading-relaxed">
                  Alters past DB record: sends violent red wave with visible fracture.
                </p>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                className="p-4 rounded-2xl border border-violet-500/30 bg-violet-950/20 text-left hover:border-violet-500/60 transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-violet-300 font-mono">
                  <RotateCcw className="h-3.5 w-3.5 text-violet-400" />
                  <span>Scenario 3: Reset Ledger</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400 font-sans leading-relaxed">
                  Restores clean state, re-verifies chain, and realigns beam.
                </p>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 8. FAQ ACCORDION SECTION */}
      <section className="space-y-6 max-w-4xl mx-auto px-4 sm:px-8 pt-16 pb-8 w-full">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-300 font-semibold">
              FAQ · TECHNICAL & LEGAL
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extralight tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3 pt-4">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/[0.08] bg-[#0c0d12]/80 backdrop-blur-md transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-medium text-white focus:outline-none cursor-pointer"
                >
                  <span className="font-sans">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-violet-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] font-sans font-light">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. CLOSING CTA SECTION */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 w-full pb-16">
        <section className="rounded-3xl border border-violet-400/30 bg-gradient-to-b from-[#0e0d1a] to-[#08070e] p-10 sm:p-14 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-violet-400/15 blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-extralight tracking-tight text-white leading-tight">
            Ready to prove your work on the{" "}
            <span className="text-violet-300 font-light drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]">
              immutable ledger
            </span>
            ?
          </h2>

          <p className="mt-4 text-xs sm:text-sm text-[#8b8ea0] max-w-xl mx-auto font-light leading-relaxed">
            Explore open problems, review charter terms, and build verified cryptographic evidence of your engineering contributions.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="font-mono text-xs tracking-widest uppercase"
            >
              <Link href="/open-problems">Explore Open Problems</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="font-mono text-xs tracking-widest uppercase"
            >
              <Link href="/pricing">View Pricing & Split Math</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
