"use client";

import React from "react";
import { Check } from "lucide-react";

interface Principle {
  num: string;
  statement: string;
  statementViolet: string;
  body: string;
}

const PRINCIPLES: Principle[] = [
  {
    num: "01",
    statement: "Terms before",
    statementViolet: "work.",
    body: "No contributor writes a line of code, and no sponsor shares confidential data, until a bilateral charter is cryptographically signed by all parties.",
  },
  {
    num: "02",
    statement: "Escrow first for",
    statementViolet: "funded work.",
    body: "Sponsors must lock full milestone capital into smart lockers upfront. Student contributors never face unpaid invoices or ghost work.",
  },
  {
    num: "03",
    statement: "Credit is owed in",
    statementViolet: "every model.",
    body: "Even in unpaid knowledge-sharing or university credit engagements, contributor attribution is permanently committed to the cryptographic ledger.",
  },
  {
    num: "04",
    statement: "AI does not",
    statementViolet: "earn or own.",
    body: "AI models cannot hold IP, withdraw escrow funds, or review peers anonymously. Every action is signed by a named, responsible human engineer.",
  },
];

const CAPABILITIES = [
  "Locker Escrow",
  "Versioned Charters",
  "Hash-Chained Diary",
  "Similarity & Plagiarism Check",
  "Dataset Watermarking",
  "Conflict-of-Interest Filter",
  "Deterministic Rehearsal Engine",
  "0% Student Fee Guarantee",
  "Objective Pros & Cons Matching",
];

export function PrinciplesSection() {
  return (
    <section
      id="principles"
      className="relative w-full py-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-16 select-none"
    >
      {/* Section Header */}
      <div className="flex flex-col items-start border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#c4b5fd]" />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-300 font-semibold">
            SECTION 04 · PRINCIPLES & GOVERNANCE
          </span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extralight tracking-tight text-white">
          The Non-Negotiable Axioms
        </h2>
      </div>

      {/* 4 Large Numbered Statements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {PRINCIPLES.map((p) => (
          <div
            key={p.num}
            className="group relative rounded-3xl border border-white/[0.08] bg-[#0c0d12]/80 p-8 backdrop-blur-md transition-all duration-300 hover:border-violet-400/40 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-xs tracking-widest text-violet-400 uppercase font-semibold block mb-4">
                PRINCIPLE {p.num}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extralight tracking-tight text-white mb-4 leading-snug">
                {p.statement}{" "}
                <span className="text-violet-300 font-light drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                  {p.statementViolet}
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                {p.body}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between font-mono text-[10px] text-[#8b8ea0] uppercase tracking-wider">
              <span>LEDGER-ENFORCED</span>
              <span className="text-violet-300 font-semibold">100% AUDITABLE</span>
            </div>
          </div>
        ))}
      </div>

      {/* Capabilities Pill Grid underneath */}
      <div className="pt-8 flex flex-col items-center text-center space-y-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#8b8ea0]">
          ENGINEERED CAPABILITIES LIST
        </span>
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
          {CAPABILITIES.map((cap, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-xs font-mono uppercase tracking-wider text-slate-200 hover:border-violet-400/50 hover:bg-violet-950/20 transition-all cursor-default"
            >
              <Check className="h-3 w-3 text-violet-400" />
              <span>{cap}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
