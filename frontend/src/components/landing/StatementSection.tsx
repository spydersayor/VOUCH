"use client";

import React, { useRef } from "react";

export function StatementSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="statement"
      ref={containerRef}
      className="relative w-full py-24 sm:py-36 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto flex flex-col items-center text-center justify-center select-none"
    >
      {/* Micro Eyebrow */}
      <div className="flex items-center gap-2 mb-8">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#c4b5fd]" />
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-violet-300 font-semibold">
          STATEMENT 01 · CORE THESIS
        </span>
      </div>

      {/* Massive Display Statement */}
      <p className="text-3xl sm:text-5xl lg:text-6xl font-extralight tracking-tight text-white leading-[1.15] max-w-4xl">
        Others record what happened.{" "}
        <span className="text-violet-300 font-light drop-shadow-[0_0_24px_rgba(168,85,247,0.7)]">
          VOUCH proves it
        </span>
        , and rehearses what could happen.
      </p>

      {/* Subline explanation */}
      <p className="mt-8 text-sm sm:text-base text-[#8b8ea0] max-w-2xl font-light leading-relaxed">
        No self-asserted resumes. No unbacked star ratings. Every milestone, rupee locker deposit, and peer review is anchored to a deterministic cryptographic ledger.
      </p>

      {/* Decorative vertical light hint */}
      <div className="mt-12 w-[1px] h-16 bg-gradient-to-b from-violet-400/60 via-violet-400/20 to-transparent" />
    </section>
  );
}
