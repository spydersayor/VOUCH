"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  RefreshCw,
  Coins,
  Award,
  Sparkles,
  Lock,
  ChevronDown,
  Building2,
  GraduationCap,
  Scale,
  PlayCircle,
  FileCheck2,
  Clock,
  Layers,
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
    } catch (e: any) {
      setLedger({ status: "error", reason: e.message });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-16">
      {/* 1. HERO SECTION */}
      <section className="mx-auto max-w-4xl text-center pt-8 pb-4 animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 mb-6">
          <Shield className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span>CRYPTOGRAPHIC EVIDENCE OVER PROMISES</span>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl sm:leading-tight">
          Work you can <span className="text-teal-600 dark:text-teal-400 underline decoration-teal-300 dark:decoration-teal-600">prove</span>.
        </h1>

        <p className="mt-6 text-base text-slate-600 dark:text-slate-300 sm:text-lg leading-relaxed max-w-2xl mx-auto">
          The trust-first collaboration platform where students solve real industry problems for locked rupee escrow, experts co-sign quality, and every milestone is provable on an immutable ledger.
        </p>

        {/* 3 Main CTAs */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild className="font-bold">
            <Link href="/signup?role=student" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Join as Student</span>
            </Link>
          </Button>

          <Button size="lg" variant="secondary" asChild className="font-bold">
            <Link href="/signup?role=expert" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Join as Expert</span>
            </Link>
          </Button>

          <Button size="lg" variant="outline" asChild className="font-bold">
            <Link href="/signup?role=sponsor" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span>Post a Problem</span>
            </Link>
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Link href="/login" className="text-teal-600 hover:underline dark:text-teal-400 font-semibold flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Already evaluating? Use One-Click Quick Login</span>
          </Link>
        </div>
      </section>

      {/* 2. DEMO DATA STATS STRIP */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Platform Telemetry
          </span>
          <Badge variant="subtle" className="text-[10px] font-bold">
            Demo Data (Synthetic Local Sandbox)
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
          <div className="p-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              ₹6,00,000
            </div>
            <div className="text-xs text-slate-500 mt-1">Total Seed Escrow</div>
          </div>
          <div className="p-3 border-l border-slate-100 dark:border-slate-800">
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 sm:text-3xl">
              {ledger.count || 24}
            </div>
            <div className="text-xs text-slate-500 mt-1">Verified Ledger Blocks</div>
          </div>
          <div className="p-3 border-l border-slate-100 dark:border-slate-800">
            <div className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              100%
            </div>
            <div className="text-xs text-slate-500 mt-1">On-Time Escrow Payouts</div>
          </div>
          <div className="p-3 border-l border-slate-100 dark:border-slate-800">
            <div className="text-2xl font-black text-amber-500 sm:text-3xl">
              4.9 / 5.0
            </div>
            <div className="text-xs text-slate-500 mt-1">Average Star Integrity</div>
          </div>
        </div>
      </section>

      {/* 3. THREE PROBLEM CARDS */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            The Three Fatal Crises in Academic & Contract Work
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Why traditional internships, freelance portals, and university capstones fail students, mentors, and employers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-t-4 border-t-rose-500">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="flagged">CRISIS 1</Badge>
                <Coins className="h-5 w-5 text-rose-500" />
              </div>
              <CardTitle className="text-lg">No Pay (Ghost Work)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Students deliver code, models, and prototypes only to face stalled invoices, arbitrary scope inflation, or non-payment.
              </p>
              <div className="rounded-xl bg-slate-50 p-3 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <strong>VOUCH Solution:</strong> Upfront rupee locker escrow. Milestones are funded in full before contributor code begins.
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="gold">CRISIS 2</Badge>
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <CardTitle className="text-lg">No Credit (Attribution Erasure)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Student breakthrough contributions and mentor guidance are swept under generic NDAs and corporate copyright with zero public attribution.
              </p>
              <div className="rounded-xl bg-slate-50 p-3 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <strong>VOUCH Solution:</strong> Bilateral charters and cryptographic ledger entries verify exact contributor weights and co-authorship.
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-teal-500">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="verified">CRISIS 3</Badge>
                <Shield className="h-5 w-5 text-teal-600" />
              </div>
              <CardTitle className="text-lg">No Proof (Resume Hallucination)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Recruiters cannot tell genuine engineering skill from generative AI fluff, inflated claims, or plagiarized course repositories.
              </p>
              <div className="rounded-xl bg-slate-50 p-3 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <strong>VOUCH Solution:</strong> Immutable SHA-256 diary of closed projects, peer reviews, code hashes, and verifiable star history.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. SIX-STEP HOW IT WORKS FLOW */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="subtle" className="text-xs uppercase">
            Deterministic Protocol
          </Badge>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            How It Works in 6 Steps
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            From problem brief to verified rupee payout — mathematically enforced at every transition.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              step: "01",
              title: "Post Problem",
              desc: "Sponsor specifies public summary, milestones, confidential brief, and engagement model (funded or knowledge-sharing).",
              icon: FileCheck2,
            },
            {
              step: "02",
              title: "Objective Match",
              desc: "Algorithmic pairing analyzes verified skills, past project track records, and availability with transparent pros & cons.",
              icon: Layers,
            },
            {
              step: "03",
              title: "Agree Charter",
              desc: "Contributors and lead expert review scope, IP assignment, and rupee split rules. Signatures log to the ledger.",
              icon: Scale,
            },
            {
              step: "04",
              title: "Locker Escrow",
              desc: "Milestone funds lock in rupee escrow. Brief and datasets unlock server-side strictly after charter acceptance.",
              icon: Lock,
            },
            {
              step: "05",
              title: "Guided Work",
              desc: "Students build solutions in the workspace, mentors conduct technical reviews, and similarity algorithms verify originality.",
              icon: Clock,
            },
            {
              step: "06",
              title: "Paid & Credited",
              desc: "Milestone approval releases exact rupee payouts without rounding leak. Ratings update and permanently bind to diary.",
              icon: Coins,
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                      {s.step}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FOUR FEATURE CARDS */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Architectural Guarantees
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Four pillars that make VOUCH tamper-evident and audit-grade.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">1. Provable Diary</CardTitle>
                  <CardDescription>SHA-256 Cryptographic Chaining</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every action — user signup, charter acceptance, milestone approval, review submission, and escrow release — is appended as a sequenced entry linked to the previous block's SHA-256 hash. Any retroactive modification breaks the entire chain immediately.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">2. Safe Escrow Locker</CardTitle>
                  <CardDescription>Upfront Guaranteed Capital</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Money never leaves the company wallet into limbo. It locks into milestone lockers with explicit exit clauses: if a sponsor withdraws without cause, a 10% compensation fee is charged and pro-rata credit is awarded.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">3. Stars Backed by Receipts</CardTitle>
                  <CardDescription>Mathematical Trust Signals</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ratings are updated strictly via closed project reviews across 5 explicit dimensions. The "Why did my rating change?" timeline gives exact ledger sequence references explaining every fractional delta.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">4. Rehearsal Engine</CardTitle>
                  <CardDescription>One-Click Judge Scenarios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Designed specifically for competitive evaluations: simulate tampering, trigger milestone disputes, test conflict-of-interest blocks, and reset demo data instantaneously with a single click.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. LIVE VERIFIER WIDGET */}
      <section className="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/60 via-white to-teal-50/20 p-8 shadow-sm dark:border-teal-900/60 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm dark:bg-teal-500">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Live Platform Diary Verifier
                </h2>
                <Badge variant="verified">SHA-256 Chained</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audits every block from Genesis to Head in real time via <code>/api/ledger/verify</code>.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLedger}
            disabled={refreshing}
            className="rounded-xl font-semibold"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>Verify the diary now</span>
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 font-mono text-xs shadow-inner dark:border-slate-800 dark:bg-slate-950">
          {ledger.status === "ok" ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>CRYPTOGRAPHIC INTEGRITY VERIFIED (OK)</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                <strong>Sequential Blocks:</strong> {ledger.count} verified blocks
              </div>
              <div className="truncate text-slate-500 dark:text-slate-500">
                <strong>Head Entry Hash:</strong> {ledger.head_hash || "Genesis"}
              </div>
            </div>
          ) : ledger.status === "tampered" ? (
            <div className="space-y-1.5 text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-2 text-sm font-bold">
                <AlertTriangle className="h-4 w-4" />
                <span>INTEGRITY FAILURE: BROKEN AT ENTRY #{ledger.broken_seq}</span>
              </div>
              <div>{ledger.reason}</div>
            </div>
          ) : (
            <div className="text-slate-400">Auditing cryptographic chain...</div>
          )}
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <Badge variant="subtle" className="text-xs uppercase">
            Questions & Answers
          </Badge>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white transition dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180 text-teal-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FINAL CTA STRIP */}
      <section className="rounded-3xl border border-teal-300 bg-teal-600 p-8 text-center text-white shadow-xl dark:border-teal-800 dark:bg-teal-950 sm:p-12">
        <h2 className="text-2xl font-black sm:text-3xl">
          Ready to prove your work on the immutable ledger?
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-teal-100 max-w-xl mx-auto">
          Explore open industry problems, review charter terms, and start building cryptographic evidence of your contributions today.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="font-bold text-teal-900"
          >
            <Link href="/open-problems">Explore Open Problems</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="font-bold border-white/40 text-white hover:bg-white/10"
          >
            <Link href="/pricing">View Pricing & Split Math</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
