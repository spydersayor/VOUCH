"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const categories = [
    {
      title: "Escrow & Financial Safety",
      items: [
        {
          q: "How does the milestone escrow locker work?",
          a: "Companies deposit milestone funds into an isolated escrow locker before contributors write any code. Funds are held in local synthetic accounts and release automatically upon milestone approval by the sponsor or arbitrated settlement.",
        },
        {
          q: "What happens if a sponsor cancels or withdraws without cause?",
          a: "Under SPEC Section 9, a 10% compensation fee is charged against the sponsor's wallet balance, pro-rata payouts are disbursed for completed work, and contributors unconditionally retain verified attribution on the ledger.",
        },
        {
          q: "How are student shares calculated?",
          a: "The student pool (70% of net) is split into a 40% equal floor and a 60% contribution weighted share, with remainder pennies deterministically assigned to the primary lead developer.",
        },
      ],
    },
    {
      title: "Charter Governance & IP",
      items: [
        {
          q: "What is the legal standing of the project charter?",
          a: "The charter defines the scope, milestones, IP license, non-disclosure terms, and exit rules. Contributor signatures are cryptographically committed to the SHA-256 ledger.",
        },
        {
          q: "What happens if a charter version changes during a project?",
          a: "Whenever a sponsor publishes a new charter revision, all active contributors must re-accept the updated terms before submitting subsequent milestone deliverables.",
        },
      ],
    },
    {
      title: "Integrity, Stars & Proof",
      items: [
        {
          q: "How are star ratings calculated?",
          a: "Star ratings are computed from 5 structured milestone dimensions: quality, timeliness, communication, collaboration, and integrity. Quitting an active project imposes a -0.5 star penalty.",
        },
        {
          q: "How does code similarity checking work?",
          a: "Submissions are converted into 3-word shingles and compared using the Jaccard similarity index against benchmark repositories. Any overlap >= 40% flags the deliverable for expert review.",
        },
        {
          q: "Can the immutable ledger be tampered with?",
          a: "No. Each block's entry hash is computed from its payload, actor, sequence, and the previous block's SHA-256 hash. Corrupting any historical row breaks the chain immediately.",
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 animate-fade-up space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="subtle" className="text-xs uppercase font-bold">
          Knowledge Base
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Clear answers on escrow mechanics, cryptographic verification, ratings, and governance.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat, cIdx) => (
          <div key={cIdx} className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs text-teal-600 dark:text-teal-400">
              {cat.title}
            </h2>
            <div className="space-y-3">
              {cat.items.map((item, iIdx) => {
                const globalIdx = cIdx * 10 + iIdx;
                const isOpen = openIdx === globalIdx;
                return (
                  <div
                    key={iIdx}
                    className="rounded-2xl border border-slate-200 bg-white transition dark:border-slate-800 dark:bg-slate-900"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIdx(isOpen ? null : globalIdx)}
                      className="flex w-full items-center justify-between p-4 text-left text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          isOpen ? "rotate-180 text-teal-600" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
