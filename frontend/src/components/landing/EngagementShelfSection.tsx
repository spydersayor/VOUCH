"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Lock, Award, BookOpen, GraduationCap, ShieldCheck } from "lucide-react";

interface ModelItem {
  id: string;
  num: string;
  category: string;
  title: string;
  highlightPhrase: string;
  description: string;
  features: string[];
  isMonetary: boolean;
  badge: string;
  icon: any;
}

const MODELS: ModelItem[] = [
  {
    id: "funded",
    num: "01",
    category: "COMMERCIAL ESCROW",
    title: "Funded Milestone Work",
    highlightPhrase: "Locked Rupee Escrow",
    description:
      "Company sponsors deposit full milestone funds into a smart locker before contributor code begins. Funds release mathematically upon milestone acceptance.",
    features: [
      "100% upfront rupee locker funding",
      "0% platform fee deducted from students",
      "Automatic pro-rata refund & 10% exit compensation",
    ],
    isMonetary: true,
    badge: "MONETARY MODEL",
    icon: Lock,
  },
  {
    id: "stipend",
    num: "02",
    category: "BURSARY & GRANT",
    title: "Stipend & Honorarium",
    highlightPhrase: "Subsidized Research",
    description:
      "Living bursaries and research grants disbursed to contributors exploring open algorithms, public tools, and exploratory clinical prototypes.",
    features: [
      "Fixed monthly honorarium schedules",
      "Open-source dual licensing options",
      "Signed charter terms for fair attribution",
    ],
    isMonetary: true,
    badge: "MONETARY MODEL",
    icon: Award,
  },
  {
    id: "knowledge",
    num: "03",
    category: "PRO-BONO RESEARCH",
    title: "Knowledge-Sharing",
    highlightPhrase: "Open Science & Mentorship",
    description:
      "Collaborative exploration without financial transactions. Experts mentor student teams, and contributors receive cryptographic co-authorship receipts.",
    features: [
      "Zero monetary exchange or commercial lock",
      "Immutable ledger proof of collaboration",
      "Bilateral non-disclosure charter protection",
    ],
    isMonetary: false,
    badge: "CREDIT-ONLY MODEL",
    icon: BookOpen,
  },
  {
    id: "academic",
    num: "04",
    category: "UNIVERSITY ACCREDITATION",
    title: "Institutional Credit",
    highlightPhrase: "Degree Capstones & ECTS",
    description:
      "Formal academic thesis and capstone evaluations where university faculty and industry experts co-sign milestones for certified university credits.",
    features: [
      "Direct university ECTS / degree credit mapping",
      "Faculty co-signature on all milestone reviews",
      "Permanent cryptographic credential badge",
    ],
    isMonetary: false,
    badge: "ACADEMIC MODEL",
    icon: GraduationCap,
  },
];

export function EngagementShelfSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const shelfRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = (index: number) => {
    const nextIdx = Math.max(0, Math.min(MODELS.length - 1, index));
    setActiveIndex(nextIdx);

    if (shelfRef.current) {
      const cardWidth = shelfRef.current.children[nextIdx]?.clientWidth || 320;
      shelfRef.current.scrollTo({
        left: nextIdx * (cardWidth + 24),
        behavior: "smooth",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollToIndex(activeIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollToIndex(activeIndex - 1);
    }
  };

  return (
    <section
      id="models"
      className="relative w-full py-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8 select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Engagement Models Shelf"
    >
      {/* Header with Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#c4b5fd]" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-300 font-semibold">
              SECTION 02 · ENGAGEMENT SHELF
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extralight tracking-tight text-white">
            Four Models. One Ledger.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#8b8ea0] max-w-lg font-light">
            Every project operates under a clear, bilateral charter — whether fully funded in locked escrow or conducted for academic degree credits.
          </p>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400 mr-2">
            {String(activeIndex + 1).padStart(2, "0")} / 04
          </span>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            aria-label="Previous model"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === MODELS.length - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            aria-label="Next model"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll-Snap Shelf */}
      <div
        ref={shelfRef}
        className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {MODELS.map((model, idx) => {
          const isFocused = idx === activeIndex;
          const Icon = model.icon;

          return (
            <div
              key={model.id}
              onClick={() => scrollToIndex(idx)}
              className={`shelf-card shrink-0 w-[290px] sm:w-[350px] lg:w-[380px] snap-center rounded-3xl p-7 border transition-all duration-500 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isFocused
                  ? "bg-[#0c0d14] border-violet-400/60 shadow-[0_0_40px_rgba(168,85,247,0.25),inset_0_0_30px_rgba(168,85,247,0.08)] scale-[1.02]"
                  : "bg-[#0c0d12]/70 border-white/[0.07] opacity-65 hover:opacity-90 hover:border-white/20"
              }`}
            >
              {/* Focus Beam Glow on the active card */}
              {isFocused && (
                <div
                  className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-violet-400/20 blur-3xl pointer-events-none"
                />
              )}

              {/* Card Top: Index + Icon */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-2xl font-light text-violet-300">
                    {model.num}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border ${
                        model.isMonetary
                          ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                          : "border-violet-500/40 bg-violet-950/30 text-violet-300"
                      }`}
                    >
                      {model.badge}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-violet-300">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#8b8ea0] mb-2 font-semibold">
                  {model.category}
                </div>

                <h3 className="text-xl sm:text-2xl font-light tracking-tight text-white mb-3">
                  {model.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed mb-6">
                  {model.description}
                </p>
              </div>

              {/* Feature bullets with hairline dividers */}
              <div className="border-t border-white/[0.08] pt-4 space-y-2.5">
                {model.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                    <span className="font-sans leading-tight">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
