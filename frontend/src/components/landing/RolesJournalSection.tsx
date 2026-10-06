"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles, Building2, ShieldCheck, Cpu } from "lucide-react";

interface RoleCard {
  id: string;
  eyebrow: string;
  title: string;
  canDo: string;
  canNever: string;
  href: string;
  readTime: string;
  icon: any;
}

const ROLES: RoleCard[] = [
  {
    id: "student",
    eyebrow: "ROLE 01 · TALENT & CONTRIBUTOR",
    title: "Build verified work. Never face ghost invoices.",
    canDo: "CAN: Apply to objective problem matches, lock milestone escrow, earn permanent ledger receipts, and retain co-authorship.",
    canNever: "CAN NEVER: Be charged platform fees, have work expropriated without payment, or receive unbacked star ratings.",
    href: "/students",
    readTime: "Read · 1 min",
    icon: GraduationCap,
  },
  {
    id: "expert",
    eyebrow: "ROLE 02 · MENTOR & CO-SIGNER",
    title: "Guide real engineering. Co-sign with reputation.",
    canDo: "CAN: Guide student squads, co-sign milestone deliverables, conduct originality reviews, and earn honorariums.",
    canNever: "CAN NEVER: Review peers with undisclosed conflicts of interest or alter ratings without cryptographic receipts.",
    href: "/experts",
    readTime: "Read · 1 min",
    icon: Sparkles,
  },
  {
    id: "sponsor",
    eyebrow: "ROLE 03 · ENTERPRISE SPONSOR",
    title: "Unlock talent. Fund verified milestones.",
    canDo: "CAN: Post confidential problem briefs, lock rupee escrow, evaluate submissions, and acquire clean IP assignment.",
    canNever: "CAN NEVER: Access proprietary solutions without locked escrow or withdraw without 10% compensation fee.",
    href: "/companies",
    readTime: "Read · 1 min",
    icon: Building2,
  },
  {
    id: "admin",
    eyebrow: "ROLE 04 · PROTOCOL GOVERNANCE",
    title: "Audit ledger health. Rehearse worst-case edge cases.",
    canDo: "CAN: Audit SHA-256 integrity, inspect KYC queues, manage arbitrated disputes, and execute tamper simulations.",
    canNever: "CAN NEVER: Retroactively modify ledger blocks without immediately breaking the cryptographic verification chain.",
    href: "/admin",
    readTime: "Read · 1 min",
    icon: ShieldCheck,
  },
  {
    id: "ai-agent",
    eyebrow: "ACTOR 05 · NON-HUMAN ASSISTANT",
    title: "Accelerate builds. Never earn or act anonymously.",
    canDo: "CAN: Generate draft diffs, analyze test vectors, and execute code tasks strictly under responsible human direction.",
    canNever: "CAN NEVER: Own IP, withdraw escrow payouts, review human peers, or execute actions without a named human tether.",
    href: "/about",
    readTime: "Read · 1 min",
    icon: Cpu,
  },
];

export function RolesJournalSection() {
  return (
    <section
      id="roles"
      className="relative w-full py-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12 select-none"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#c4b5fd]" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-300 font-semibold">
              SECTION 05 · ROLES & PERMISSIONS
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extralight tracking-tight text-white">
            Who Operates on VOUCH
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#8b8ea0] max-w-lg font-light">
            Explicit permissions and immutable guardrails for every actor on the platform.
          </p>
        </div>
      </div>

      {/* Grid of Editorial Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <article
              key={role.id}
              className="group relative rounded-3xl border border-white/[0.08] bg-[#0c0d12]/85 p-7 backdrop-blur-md transition-all duration-300 hover:border-violet-400/40 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400 font-semibold">
                    {role.eyebrow}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-violet-300">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-extralight tracking-tight text-white mb-4 leading-snug">
                  {role.title}
                </h3>

                <div className="space-y-2 text-xs font-light text-slate-300 border-t border-white/[0.06] pt-4 mb-6">
                  <p className="text-emerald-300/90 leading-relaxed font-mono text-[11px]">
                    {role.canDo}
                  </p>
                  <p className="text-rose-300/90 leading-relaxed font-mono text-[11px]">
                    {role.canNever}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs">
                <span className="text-slate-500 text-[11px]">{role.readTime}</span>
                <Link
                  href={role.href}
                  className="inline-flex items-center gap-1.5 text-violet-300 group-hover:text-white font-semibold transition-colors"
                >
                  <span>Explore Role</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
