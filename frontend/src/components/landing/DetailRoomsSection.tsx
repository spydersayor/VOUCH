"use client";

import React, { useState } from "react";
import { Shield, Sparkles, User, FileText, CheckCircle2, Lock, Terminal, Cpu, ArrowRight } from "lucide-react";

interface RoomItem {
  id: string;
  num: string;
  eyebrow: string;
  headline: string;
  headlineViolet: string;
  paragraph: string;
  meta: string[];
  visualType: "stars" | "rehearsal" | "ai" | "charter";
}

const ROOMS: RoomItem[] = [
  {
    id: "stars",
    num: "01 / 04",
    eyebrow: "MATHEMATICAL TRUST SIGNALS",
    headline: "Every star rating is backed by",
    headlineViolet: "a cryptographic receipt.",
    paragraph:
      "No self-reported reviews or vague thumbs-up. Rating deltas are mathematically calculated from structured peer evaluations across 5 dimensions, permanently bound to ledger sequence numbers.",
    meta: ["5 Structured Dimensions", "SHA-256 Audit Link", "Immutable History"],
    visualType: "stars",
  },
  {
    id: "rehearsal",
    num: "02 / 04",
    eyebrow: "DETERMINISTIC SANDBOX",
    headline: "Simulate worst-case scenarios",
    headlineViolet: "before real capital moves.",
    paragraph:
      "Test how the platform handles student departures, sponsor delays, tampered hashes, and AI disputes. One-click instant state reproduction for evaluating judges.",
    meta: ["4 Pre-baked Scenarios", "Instant Ledger Reset", "Tamper Detection"],
    visualType: "rehearsal",
  },
  {
    id: "ai",
    num: "03 / 04",
    eyebrow: "ATTRIBUTION PROTOCOL",
    headline: "AI agent actions are always",
    headlineViolet: "tethered to a human owner.",
    paragraph:
      "AI agents cannot own IP, hold escrow funds, or review peers anonymously. Every prompt, model execution, and diff submission is cryptographically signed by the responsible human engineer.",
    meta: ["Named Human Owner", "AI Reserve Pool", "Watermarked Diffs"],
    visualType: "ai",
  },
  {
    id: "charter",
    num: "04 / 04",
    eyebrow: "BILATERAL GOVERNANCE",
    headline: "One agreed charter governs",
    headlineViolet: "escrow, IP, and payouts.",
    paragraph:
      "Confidential company briefs and datasets remain server-locked until all contributors sign the charter. Version changes trigger explicit re-acceptance receipts.",
    meta: ["Zero-Trust Gating", "Versioned Re-Acceptance", "Bilateral Terms"],
    visualType: "charter",
  },
];

export function DetailRoomsSection() {
  const [activeRoom, setActiveRoom] = useState(0);

  return (
    <section
      id="detail-rooms"
      className="relative w-full py-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12 select-none"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#c4b5fd]" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-300 font-semibold">
              SECTION 03 · PROTOCOL DETAILS
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extralight tracking-tight text-white">
            Architecture Under The Hood
          </h2>
        </div>

        {/* Room Switcher Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {ROOMS.map((r, idx) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRoom(idx)}
              className={`px-3.5 py-1.5 rounded-full font-mono text-[11px] tracking-wider uppercase transition cursor-pointer border ${
                activeRoom === idx
                  ? "border-violet-400 bg-violet-950/40 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
              }`}
            >
              {r.id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Room Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Room Narrative & Facts */}
        <div className="lg:col-span-6 flex flex-col items-start space-y-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-light text-violet-300">
              {ROOMS[activeRoom].num}
            </span>
            <span className="h-4 w-[1px] bg-white/20" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8b8ea0] font-semibold">
              {ROOMS[activeRoom].eyebrow}
            </span>
          </div>

          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight text-white leading-tight">
            {ROOMS[activeRoom].headline}{" "}
            <span className="text-violet-300 font-light drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">
              {ROOMS[activeRoom].headlineViolet}
            </span>
          </h3>

          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            {ROOMS[activeRoom].paragraph}
          </p>

          {/* Three Meta Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4 border-t border-white/[0.08]">
            {ROOMS[activeRoom].meta.map((m, mIdx) => (
              <div
                key={mIdx}
                className="p-3 rounded-xl border border-white/[0.08] bg-[#0c0d12]/80 backdrop-blur-sm"
              >
                <div className="flex items-center gap-1.5 text-violet-300 mb-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                    GUARANTEE
                  </span>
                </div>
                <div className="font-mono text-xs font-semibold text-white">
                  {m}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Abstract CSS/SVG Visualizer */}
        <div className="lg:col-span-6">
          <div className="relative rounded-3xl border border-white/10 bg-[#0c0d14] p-6 sm:p-8 overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.7)]">
            {/* Ambient inner glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />

            {/* VISUAL 1: Star Rating Receipt */}
            {ROOMS[activeRoom].visualType === "stars" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-violet-300 uppercase tracking-widest font-semibold text-[11px]">
                    RECEIPT #RC-9482 · LEDGER SEQ #18
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-[10px]">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { label: "CODE QUALITY", delta: "+0.12", score: "4.9 / 5.0" },
                    { label: "TIMELINESS", delta: "+0.08", score: "5.0 / 5.0" },
                    { label: "COMMUNICATION", delta: "+0.05", score: "4.8 / 5.0" },
                    { label: "INTEGRITY & CITATION", delta: "+0.10", score: "5.0 / 5.0" },
                  ].map((dim, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    >
                      <span className="text-slate-300 text-[11px]">{dim.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold">{dim.delta}</span>
                        <span className="text-white font-bold">{dim.score}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10">
                  <span>HASH: 0x8f4c2e...91ab</span>
                  <span className="text-violet-300 font-bold">NET RATING: 4.92★</span>
                </div>
              </div>
            )}

            {/* VISUAL 2: Rehearsal Engine Matrix */}
            {ROOMS[activeRoom].visualType === "rehearsal" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-violet-300 uppercase tracking-widest font-semibold text-[11px]">
                    REHEARSAL RUNTIME · JUDGE CONTROLS
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-violet-500/40 bg-violet-950/40 text-violet-300 text-[10px]">
                    SIMULATOR
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between">
                    <div>
                      <div className="text-emerald-300 font-bold">SCENARIO: INTACT CONSENSUS</div>
                      <div className="text-[10px] text-slate-400">All 24 sequential SHA-256 blocks verified</div>
                    </div>
                    <span className="text-emerald-400 font-bold">PASS 200 OK</span>
                  </div>

                  <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 flex items-center justify-between">
                    <div>
                      <div className="text-rose-300 font-bold">SCENARIO: DB ENTRY TAMPER</div>
                      <div className="text-[10px] text-slate-400">Hash broken at seq #2 (mismatch detected)</div>
                    </div>
                    <span className="text-rose-400 font-bold">FAIL AUDIT</span>
                  </div>

                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-bold">SCENARIO: SPONSOR EXIT CLAUSE</div>
                      <div className="text-[10px] text-slate-400">10% compensation fee applied to escrow</div>
                    </div>
                    <span className="text-amber-300 font-bold">PRO-RATA</span>
                  </div>
                </div>
              </div>
            )}

            {/* VISUAL 3: AI Human Tether Node */}
            {ROOMS[activeRoom].visualType === "ai" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-violet-300 uppercase tracking-widest font-semibold text-[11px]">
                    AI ATTRIBUTION TETHER
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-sky-500/40 bg-sky-950/40 text-sky-300 text-[10px]">
                    HUMAN-OWNED
                  </span>
                </div>

                <div className="relative p-4 rounded-2xl border border-violet-400/40 bg-[#0e0d18] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-600/30 border border-violet-400/60 flex items-center justify-center text-violet-300">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-white font-bold">AGENT RUNTIME: CODEGEN-V2</div>
                      <div className="text-[10px] text-slate-400">Generated 42 lines in src/model.py</div>
                    </div>
                  </div>

                  <div className="pl-5 border-l-2 border-dashed border-violet-400/50 ml-5 py-1 space-y-1 text-[11px]">
                    <div className="text-slate-400">&darr; Cryptographic Attribution Link</div>
                    <div className="text-emerald-300 font-semibold">TETHERED RESPONSIBLE HUMAN:</div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/[0.04] p-2.5 rounded-xl border border-white/10">
                    <div className="h-8 w-8 rounded-full bg-teal-600/40 border border-teal-400 flex items-center justify-center text-teal-200 font-bold text-xs">
                      VK
                    </div>
                    <div>
                      <div className="text-white font-bold">Satyam Kumar (Student Contributor)</div>
                      <div className="text-[10px] text-slate-400">IP assigned to human author · Zero AI anonymity</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VISUAL 4: Charter Lock & Timeline */}
            {ROOMS[activeRoom].visualType === "charter" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-violet-300 uppercase tracking-widest font-semibold text-[11px]">
                    CHARTER VERSION TIMELINE
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-teal-500/40 bg-teal-950/40 text-teal-300 text-[10px]">
                    ACTIVE V1.1
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between opacity-60">
                    <div>
                      <div className="text-slate-300">CHARTER V1.0 (INITIAL TERMS)</div>
                      <div className="text-[10px] text-slate-500">Signed 14 May 2026 · Superseded</div>
                    </div>
                    <span className="text-slate-500">SUPERSEDED</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-violet-400/60 bg-violet-950/30 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">CHARTER V1.1 (SCOPE AMENDMENT)</div>
                      <div className="text-[10px] text-violet-300">Milestone 2 Escrow locked: ₹1,50,000</div>
                    </div>
                    <span className="text-emerald-300 font-bold">ALL SIGNED (4/4)</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-teal-500/30 bg-teal-950/20 text-teal-300 text-[11px] flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Proprietary clinical dataset server-gate: UNLOCKED</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
