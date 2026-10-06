"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Shield, CheckCircle2, Play, Sparkles, Terminal, FileCheck2 } from "lucide-react";
import { FX, triggerVerifyWave, triggerRehearsalScenario } from "../fx/fx-config";

interface HeroTandemLayoutProps {
  onOpenLedger?: () => void;
  ledgerCount?: number;
}

export function HeroTandemLayout({ onOpenLedger, ledgerCount = 24 }: HeroTandemLayoutProps) {
  const [activeCrumb, setActiveCrumb] = useState<"HERO" | "STATEMENT" | "LEDGER" | "REHEARSAL" | "SPEC">("HERO");

  // Stat count-ups
  const [escrowDisplay, setEscrowDisplay] = useState(FX.statsCountUp ? "₹0.0L" : "₹6.0L");
  const [blocksDisplay, setBlocksDisplay] = useState(FX.statsCountUp ? 0 : ledgerCount);
  const [payoutsDisplay, setPayoutsDisplay] = useState(FX.statsCountUp ? 0 : 100);
  const [ratingDisplay, setRatingDisplay] = useState(FX.statsCountUp ? "0.0" : "4.9");

  useEffect(() => {
    if (!FX.statsCountUp) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) {
      setEscrowDisplay("₹6.0L");
      setBlocksDisplay(ledgerCount);
      setPayoutsDisplay(100);
      setRatingDisplay("4.9");
      return;
    }

    const duration = 1400; // ms
    const startTime = performance.now();

    const animateCount = (now: number) => {
      const elapsed = Math.min(now - startTime, duration);
      const progress = elapsed / duration;
      // outExpo easing
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      // Escrow: 0 -> 6.0
      const currentEscrow = (ease * 6.0).toFixed(1);
      setEscrowDisplay(`₹${currentEscrow}L`);

      // Blocks: 0 -> ledgerCount
      setBlocksDisplay(Math.round(ease * ledgerCount));

      // Payouts: 0 -> 100%
      setPayoutsDisplay(Math.round(ease * 100));

      // Rating: 0 -> 4.9
      setRatingDisplay((ease * 4.9).toFixed(1));

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animateCount);
    }, 300);

    return () => clearTimeout(timer);
  }, [ledgerCount]);

  const scrollToSection = (id: string, crumb: "HERO" | "STATEMENT" | "LEDGER" | "REHEARSAL" | "SPEC") => {
    setActiveCrumb(crumb);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenLedgerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerVerifyWave("ok", undefined, ledgerCount);
    scrollToSection("ledger-verifier", "LEDGER");
    if (onOpenLedger) onOpenLedger();
  };

  return (
    <div className="relative w-full min-h-[92vh] flex flex-col justify-between pt-4 pb-8 px-4 sm:px-8 lg:px-12 text-[#f3f2ff] select-none z-10">
      {/* 1. TOP PROGRESS RAIL & NAV DETAILS */}
      <div className="w-full flex items-center justify-between py-2 border-b border-white/[0.07] backdrop-blur-[2px]">
        {/* Breadcrumb progress rail in mono uppercase */}
        <div className="flex items-center gap-2 sm:gap-4 font-mono text-[11px] tracking-[0.2em] uppercase text-slate-400">
          {[
            { label: "HERO", id: "hero-top" },
            { label: "STATEMENT", id: "problem-statement" },
            { label: "LEDGER", id: "ledger-verifier" },
            { label: "REHEARSAL", id: "rehearsal-engine" },
            { label: "SPEC", id: "architecture-spec" },
          ].map((item, idx, arr) => {
            const isActive = activeCrumb === item.label;
            return (
              <React.Fragment key={item.label}>
                <button
                  type="button"
                  onClick={() => scrollToSection(item.id, item.label as any)}
                  className={`transition-colors duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isActive ? "text-white font-bold" : "hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#c4b5fd]" />
                  )}
                  <span>{item.label}</span>
                </button>
                {idx < arr.length - 1 && <span className="text-slate-600">&gt;</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Start a project / Open Console Pill with gradient hairline border */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/open-problems"
            className="group relative inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#0c0d12]/90 text-xs font-mono tracking-wider uppercase text-violet-200 border border-violet-400/40 hover:border-violet-300 shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:-translate-y-0.5"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-violet-400 group-hover:rotate-12 transition-transform" />
              <span>START A PROJECT</span>
            </span>
          </Link>
        </div>
      </div>

      {/* 2. MAIN HERO BODY (Left Headline + Right Stat Tiles) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-12">
        {/* LEFT COLUMN: Badge, Headline, Subline, Pill CTA, Avatar Proof */}
        <div className="lg:col-span-7 xl:col-span-6 flex flex-col items-start space-y-6 max-w-xl">
          {/* Pill badge in mono uppercase */}
          <div
            onClick={() => {
              triggerRehearsalScenario("sim-01", "Rehearsal Engine Pulse");
              scrollToSection("rehearsal-engine", "REHEARSAL");
            }}
            className="cursor-pointer group inline-flex items-center gap-2.5 rounded-full border border-violet-400/30 bg-violet-950/40 px-3.5 py-1.5 text-xs font-mono uppercase tracking-widest text-violet-200 backdrop-blur-md hover:border-violet-400/70 hover:bg-violet-900/50 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
          >
            <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_#c4b5fd] animate-pulse" />
            <span className="font-semibold">NEW: REHEARSAL ENGINE</span>
            <span className="text-violet-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </div>

          {/* Large light-weight headline with "prove" tinted violet */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extralight tracking-tight text-white leading-[1.04]">
            Work you can{" "}
            <span className="font-light text-violet-300 relative inline-block drop-shadow-[0_0_24px_rgba(196,181,253,0.7)]">
              prove
              <span className="absolute bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400 via-teal-400 to-violet-400 opacity-60" />
            </span>
            .
          </h1>

          {/* Two-line subline */}
          <p className="text-base sm:text-lg text-slate-300/90 font-light leading-relaxed max-w-lg">
            A trust-first collaboration platform where every contribution, escrow locker deposit, and peer rating is provable on an immutable ledger.
          </p>

          {/* Pill CTA with glowing gradient border & wide-tracked mono label */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleOpenLedgerClick}
              className="group relative inline-flex items-center justify-center h-14 px-8 sm:px-10 rounded-full font-mono text-xs tracking-[0.2em] uppercase font-semibold text-white transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.45),inset_0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_35px_rgba(168,85,247,0.8),inset_0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 cursor-pointer overflow-hidden border border-violet-300/80 bg-gradient-to-r from-violet-950 via-[#120d26] to-slate-950"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Shield className="h-4 w-4 text-violet-300 group-hover:scale-110 transition-transform" />
                <span>OPEN THE LEDGER</span>
              </span>
              {/* Shimmer sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </button>

            <span
              onClick={() => scrollToSection("problem-statement", "STATEMENT")}
              className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              or scroll &darr;
            </span>
          </div>

          {/* Avatar stack + Social-proof line (Abstract/Initial-based, demo data) */}
          <div className="pt-4 flex items-center gap-4">
            <div className="flex -space-x-2 overflow-hidden">
              {[
                { init: "VK", bg: "bg-violet-700 text-violet-100" },
                { init: "AL", bg: "bg-teal-700 text-teal-100" },
                { init: "TX", bg: "bg-indigo-700 text-indigo-100" },
                { init: "RD", bg: "bg-purple-700 text-purple-100" },
              ].map((av, i) => (
                <div
                  key={i}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#050508] ${av.bg} text-[10px] font-mono font-bold shadow-sm`}
                >
                  {av.init}
                </div>
              ))}
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#050508] bg-slate-800 text-[9px] font-mono font-bold text-slate-300">
                +14
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                <span className="text-xs font-medium text-slate-200">
                  420,000+ verified blocks
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tracking-wider">
                18 active research teams · (Demo data)
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Vertical stack of stat tiles (Big numerals + tiny mono labels) */}
        <div className="lg:col-span-5 xl:col-span-6 flex justify-end">
          <div className="flex flex-row lg:flex-col gap-3 sm:gap-4 flex-wrap justify-end">
            {[
              {
                value: escrowDisplay,
                label: "SEED ESCROW",
                sub: "UPFRONT DEPOSIT",
              },
              {
                value: blocksDisplay,
                label: "VERIFIED BLOCKS",
                sub: "SHA-256 SEQUENCED",
              },
              {
                value: `${payoutsDisplay}%`,
                label: "ON-TIME PAYOUTS",
                sub: "LOCKER TRANSFERS",
              },
              {
                value: `${ratingDisplay}★`,
                label: "STAR INTEGRITY",
                sub: "RECEIPT BACKED",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="stat-tile group w-36 sm:w-44 p-4 rounded-2xl bg-[#0c0d12]/80 border border-white/10 hover:border-violet-400/40 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(168,85,247,0.15)] flex flex-col justify-center"
              >
                <div className="text-2xl sm:text-3xl font-light text-slate-100 group-hover:text-white transition-colors">
                  {stat.value}
                </div>
                <div className="mt-1 font-mono text-[10px] tracking-[0.16em] uppercase text-violet-300 font-semibold">
                  {stat.label}
                </div>
                <div className="text-[9px] font-mono tracking-wider uppercase text-slate-500">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CONTROLS: "NEXT" pill center, "SCROLL TO EXPLORE" right */}
      <div className="w-full flex items-center justify-between pt-4 border-t border-white/[0.05]">
        {/* Left filler/role shortcuts */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono tracking-wider text-slate-400">
          <Link href="/students" className="hover:text-violet-300 transition-colors">
            STUDENTS
          </Link>
          <span className="text-slate-600">/</span>
          <Link href="/experts" className="hover:text-violet-300 transition-colors">
            EXPERTS
          </Link>
          <span className="text-slate-600">/</span>
          <Link href="/companies" className="hover:text-violet-300 transition-colors">
            SPONSORS
          </Link>
        </div>

        {/* Bottom Center: "NEXT" pill with circular arrow control */}
        <div className="mx-auto sm:mx-0">
          <button
            type="button"
            onClick={() => scrollToSection("problem-statement", "STATEMENT")}
            className="group inline-flex items-center gap-3 h-10 px-5 rounded-full border border-white/15 bg-white/5 hover:border-violet-400/50 hover:bg-violet-950/30 text-xs font-mono uppercase tracking-[0.18em] text-slate-200 hover:text-white transition-all duration-300 shadow-sm"
          >
            <span>NEXT</span>
            <span className="h-6 w-6 rounded-full bg-white/10 group-hover:bg-violet-500/30 flex items-center justify-center transition-colors">
              <ArrowDown className="h-3 w-3 text-violet-300 group-hover:translate-y-0.5 transition-transform" />
            </span>
          </button>
        </div>

        {/* Bottom Right: "SCROLL TO EXPLORE" with animated vertical line */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400">
            SCROLL TO EXPLORE
          </span>
          <div className="relative w-[1px] h-10 bg-slate-700 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-violet-300 to-transparent animate-[hint_2.2s_cubic-bezier(0.2,0.75,0.2,1)_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}
