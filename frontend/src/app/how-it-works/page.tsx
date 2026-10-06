"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <div className="mx-auto max-w-5xl px-4 py-12 animate-fade-up space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="subtle" className="text-xs uppercase font-bold">
          Platform Architecture
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          How VOUCH Works
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          A zero-trust workflow where every step produces cryptographic evidence on an immutable SHA-256 ledger.
        </p>
      </div>

      {/* 6 Steps Detailed */}
      <div className="space-y-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.num} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="flex items-center justify-center bg-teal-50 p-6 dark:bg-teal-950/40 md:w-36 md:shrink-0">
                  <div className="text-center">
                    <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
                      {s.num}
                    </span>
                    <div className="mt-2 flex justify-center">
                      <Icon className="h-6 w-6 text-teal-700 dark:text-teal-300" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-teal-600 shrink-0" />
                    <span><strong>Ledger Proof:</strong> {s.proof}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Traditional vs VOUCH Comparison Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">
          Traditional Capstones vs. VOUCH
        </h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-400">
                  <th className="p-4">Dimension</th>
                  <th className="p-4 text-rose-600 dark:text-rose-400">Traditional Freelance / Internship</th>
                  <th className="p-4 text-teal-600 dark:text-teal-400">VOUCH Provable Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">Payment Guarantee</td>
                  <td className="p-4 text-slate-500">Invoices post-delivery; frequent non-payment or scope disputes</td>
                  <td className="p-4 font-semibold text-teal-800 dark:text-teal-200 bg-teal-50/30 dark:bg-teal-950/20">
                    Upfront rupee escrow locker; funds guaranteed before work starts
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">Attribution</td>
                  <td className="p-4 text-slate-500">NDAs prevent student from discussing work or listing on resume</td>
                  <td className="p-4 font-semibold text-teal-800 dark:text-teal-200 bg-teal-50/30 dark:bg-teal-950/20">
                    Bilateral charter guarantees verified attribution and co-authorship
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">Work Verification</td>
                  <td className="p-4 text-slate-500">Unverifiable bullet points on PDF resumes</td>
                  <td className="p-4 font-semibold text-teal-800 dark:text-teal-200 bg-teal-50/30 dark:bg-teal-950/20">
                    Cryptographic SHA-256 diary verifiable by anyone with /api/ledger/verify
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">Mentorship</td>
                  <td className="p-4 text-slate-500">Unpaid professor advising with conflicting corporate ties</td>
                  <td className="p-4 font-semibold text-teal-800 dark:text-teal-200 bg-teal-50/30 dark:bg-teal-950/20">
                    30% net reward pool share with explicit conflict declaration logging
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Button size="lg" asChild className="font-bold">
          <Link href="/open-problems" className="flex items-center gap-2">
            <span>Explore Open Problem Briefs</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
