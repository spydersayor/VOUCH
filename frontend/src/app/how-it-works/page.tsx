"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  FileText,
  UserCheck,
  FileCheck2,
  Lock,
  Code2,
  Coins,
  Shield,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      title: "Problem Creation & AI Scoping",
      desc: "A company sponsor drafts a technical problem. In Phase 5, an AI scoping assistant breaks the raw goal into bounded sequential milestones with distinct budgets, delivery criteria, and recommended skills.",
      icon: FileText,
      proof: "PROJECT_CREATED entry recorded with SHA-256 hash of public summary and budget.",
    },
    {
      num: "02",
      title: "Algorithmic Matchmaking",
      desc: "Contributors and lead experts are ranked deterministically by skill overlap, verified past projects, and ratings. Potential conflicts of interest are flagged and barred automatically.",
      icon: UserCheck,
      proof: "MATCH_EVALUATED entry logged with calculated composite weights.",
    },
    {
      num: "03",
      title: "Charter Agreement & Gating",
      desc: "All parties review the official charter version. Engagement model, IP ownership, confidentiality, and exit rules are agreed. Only upon cryptographic signature is the confidential brief unlocked.",
      icon: FileCheck2,
      proof: "CHARTER_ACCEPTED signature binds contributor ID and charter version to the ledger.",
    },
    {
      num: "04",
      title: "Milestone Escrow Locking",
      desc: "Before any contributor writes code, the sponsor deposits milestone funds into a smart locker. The platform guarantees payment for accepted deliverables.",
      icon: Lock,
      proof: "LOCKER_FUNDED entry logs transaction ID and locked integer rupee sum.",
    },
    {
      num: "05",
      title: "Collaborative Execution & Peer Review",
      desc: "Students build solutions in the workspace. Lead experts conduct technical reviews, and similarity algorithms verify that external code is under 40% threshold.",
      icon: Code2,
      proof: "SUBMISSION_CREATED and REVIEW_SUBMITTED entries record artifact hashes.",
    },
    {
      num: "06",
      title: "Milestone Disbursement & Proven Credit",
      desc: "Approved milestones disburse exact integer rupee payouts directly to stakeholder wallets. Structured ratings update and become permanent verified credentials.",
      icon: Coins,
      proof: "PAYOUT_RELEASED entry records cryptographic payment reference and updated star rating.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 animate-fade-up space-y-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#c4b5fd]" />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-300 font-semibold">
            DETERMINISTIC PROTOCOL
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extralight tracking-tight text-white">
          How{" "}
          <span className="text-violet-300 font-light drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]">
            VOUCH
          </span>{" "}
          Works
        </h1>
        <p className="text-sm sm:text-base text-[#8b8ea0] max-w-xl mx-auto font-light leading-relaxed">
          A zero-trust workflow where every transition produces cryptographic evidence on an immutable SHA-256 ledger.
        </p>
      </div>

      {/* 6 Steps Detailed */}
      <div className="space-y-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.num} className="p-0 overflow-hidden group hover:border-violet-400/40">
              <div className="flex flex-col md:flex-row">
                <div className="flex items-center justify-center bg-violet-950/30 border-b md:border-b-0 md:border-r border-white/[0.08] p-6 md:w-36 md:shrink-0">
                  <div className="text-center">
                    <span className="font-mono text-3xl font-light text-violet-300 group-hover:scale-105 transition-transform inline-block">
                      {s.num}
                    </span>
                    <div className="mt-2 flex justify-center">
                      <Icon className="h-5 w-5 text-violet-400" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 sm:p-8 space-y-3">
                  <h3 className="text-xl font-light tracking-tight text-white">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="rounded-xl border border-white/[0.08] bg-[#050508] p-3 font-mono text-[11px] text-slate-400 flex items-center gap-2.5">
                    <Shield className="h-4 w-4 text-violet-400 shrink-0" />
                    <span><strong className="text-violet-300">Ledger Proof:</strong> {s.proof}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Traditional vs VOUCH Comparison Table */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-violet-400 font-semibold">
            COMPARISON MATRIX
          </span>
          <h2 className="text-2xl sm:text-3xl font-extralight text-white">
            Traditional Capstones vs. VOUCH
          </h2>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#050508] text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="p-4 sm:p-5">Dimension</th>
                  <th className="p-4 sm:p-5 text-rose-400">Traditional Freelance / Internship</th>
                  <th className="p-4 sm:p-5 text-emerald-400">VOUCH Provable Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">Payment Guarantee</td>
                  <td className="p-4 sm:p-5 text-slate-400 font-sans">Invoices post-delivery; frequent non-payment or scope inflation disputes</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-sans bg-emerald-950/10">
                    Upfront rupee escrow locker; 100% capital locked before work begins
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">Attribution</td>
                  <td className="p-4 sm:p-5 text-slate-400 font-sans">Generic NDAs prevent students from discussing work or claiming code authorship</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-sans bg-emerald-950/10">
                    Bilateral charter guarantees verified attribution and co-authorship receipts
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">Work Verification</td>
                  <td className="p-4 sm:p-5 text-slate-400 font-sans">Unverifiable bullet points on easily forged PDF resumes</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-sans bg-emerald-950/10">
                    Cryptographic SHA-256 diary verifiable in real time via /api/ledger/verify
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">Mentorship</td>
                  <td className="p-4 sm:p-5 text-slate-400 font-sans">Unpaid advising with conflicting corporate ties and no audit trail</td>
                  <td className="p-4 sm:p-5 text-emerald-300 font-sans bg-emerald-950/10">
                    30% net reward pool share with mandatory conflict declaration logging
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Button size="lg" asChild className="font-mono text-xs tracking-widest uppercase">
          <Link href="/open-problems" className="flex items-center gap-2">
            <span>Explore Open Problem Briefs</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
