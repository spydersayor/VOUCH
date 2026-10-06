"use client";

import React, { useEffect, useRef, useState } from "react";
import { FX } from "./fx-config";

interface HeroSealCenterpieceProps {
  className?: string;
}

export function HeroSealCenterpiece({ className = "" }: HeroSealCenterpieceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [pulseBoost, setPulseBoost] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!FX.hero3d || !mounted) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = reducedMotionQuery.matches;

    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let targetTransX = 0;
    let currentTransX = 0;
    let rafId: number | null = null;
    let active = true;
    let startTime = performance.now();

    const handlePointerMove = (e: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      const px = (e.clientX / innerWidth) * 2 - 1; // -1 to 1
      const py = (e.clientY / innerHeight) * 2 - 1; // -1 to 1

      // Parallax tilt angles
      targetTiltX = -py * 16; // -16 to 16 deg
      targetTiltY = px * 20;  // -20 to 20 deg
      targetTransX = px * 12; // subtle shift
    };

    const handleVerifyWave = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPulseBoost(detail.status === "tampered" ? 1.6 : 1.35);
      setTimeout(() => setPulseBoost(1), 1200);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("vouch:verify-wave", handleVerifyWave);

    const animate = (now: number) => {
      if (!active) return;

      if (!isReduced) {
        // Smooth lerp
        currentTiltX += (targetTiltX - currentTiltX) * 0.08;
        currentTiltY += (targetTiltY - currentTiltY) * 0.08;
        currentTransX += (targetTransX - currentTransX) * 0.06;

        // Idle floating oscillation
        const t = (now - startTime) / 1000;
        const idleFloatY = Math.sin(t * 1.4) * 8;
        const idleWobbleZ = Math.sin(t * 0.9) * 1.5;

        if (sealRef.current) {
          sealRef.current.style.transform = `
            perspective(1100px)
            translate3d(${currentTransX}px, ${idleFloatY}px, 0)
            rotateX(${currentTiltX}deg)
            rotateY(${currentTiltY}deg)
            rotateZ(${idleWobbleZ}deg)
          `;
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    if (!isReduced) {
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("vouch:verify-wave", handleVerifyWave);
    };
  }, [mounted]);

  if (!FX.hero3d && !FX.beam) return null;

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none relative flex flex-col items-center justify-center select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. VERTICAL VIOLET LIGHT BEAM (CSS linear/conic gradient + blur) */}
      {FX.beam && (
        <div className="pointer-events-none absolute -top-40 h-[650px] w-64 flex justify-center items-start z-0 overflow-visible">
          {/* Core high-intensity pillar */}
          <div
            className="w-16 h-full transition-all duration-700 ease-out"
            style={{
              background: "linear-gradient(180deg, rgba(235, 225, 255, 0.45) 0%, rgba(196, 181, 253, 0.3) 30%, rgba(147, 51, 234, 0.15) 75%, transparent 100%)",
              filter: "blur(14px)",
              opacity: 0.85 * pulseBoost,
              transform: `scaleY(${1 * pulseBoost})`,
            }}
          />

          {/* Ambient wide diffuse light beam */}
          <div
            className="absolute inset-x-0 w-full h-full -top-10 transition-all duration-1000 ease-out"
            style={{
              background: "radial-gradient(ellipse 70% 90% at 50% 20%, rgba(168, 85, 247, 0.28), rgba(124, 58, 237, 0.08) 60%, transparent 80%)",
              filter: "blur(32px)",
              opacity: 0.9 * pulseBoost,
            }}
          />

          {/* Top light emitter node */}
          <div className="absolute top-0 h-4 w-32 rounded-full bg-violet-200/60 blur-md" />
        </div>
      )}

      {/* 2. CRYPTOGRAPHIC SEAL & CHAIN CENTERPIECE */}
      {FX.hero3d && (
        <div
          ref={sealRef}
          className="relative z-10 flex flex-col items-center justify-center transition-transform will-change-transform"
          style={{
            transformStyle: "preserve-3d",
            transform: "perspective(1100px) rotateX(6deg) rotateY(-8deg)",
          }}
        >
          {/* MAIN SEAL BODY (Glossy Chrome & Glass Ring) */}
          <div className="relative h-64 w-64 sm:h-76 sm:w-76 rounded-full flex items-center justify-center">
            {/* Outer Specular Chrome Bevel Rim */}
            <div
              className="absolute inset-0 rounded-full border border-violet-300/40 p-[2px] shadow-[0_0_50px_rgba(168,85,247,0.35),inset_0_0_25px_rgba(255,255,255,0.2)]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(139,92,246,0.2) 35%, rgba(15,10,35,0.85) 70%, rgba(196,181,253,0.3) 100%)",
              }}
            >
              {/* Rotating Hex Hash Ring */}
              <div
                className="w-full h-full rounded-full border border-violet-400/30 flex items-center justify-center p-3 animate-[spin_60s_linear_infinite]"
                style={{
                  background: "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.12), transparent 70%)",
                }}
              >
                {/* Micro cryptographic tick marks around perimeter */}
                <svg className="w-full h-full opacity-60" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="92"
                    fill="none"
                    stroke="rgba(196, 181, 253, 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="4 8"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="84"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="0.8"
                    strokeDasharray="16 22"
                  />
                </svg>
              </div>
            </div>

            {/* Inner Frosted Glass Disc */}
            <div
              className="relative h-48 w-48 sm:h-56 sm:w-56 rounded-full border border-violet-300/60 flex flex-col items-center justify-center backdrop-blur-md overflow-hidden shadow-[inset_0_0_35px_rgba(168,85,247,0.4),0_15px_35px_rgba(0,0,0,0.6)]"
              style={{
                background: "linear-gradient(145deg, rgba(40, 25, 75, 0.75) 0%, rgba(15, 12, 30, 0.9) 100%)",
              }}
            >
              {/* Internal Glass Highlight Reflection */}
              <div className="absolute -top-16 -left-16 w-44 h-44 rounded-full bg-gradient-to-br from-white/25 via-violet-300/10 to-transparent blur-sm pointer-events-none" />

              {/* VOUCH Seal Medallion Title */}
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-mono tracking-[0.25em] text-violet-300/90 uppercase font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
                <span>VOUCH PROTOCOL</span>
              </div>

              {/* Central Keyhole Escutcheon (Precision Chrome Hardware) */}
              <div className="relative my-1 flex flex-col items-center">
                {/* Outer chrome collar */}
                <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full border border-violet-200/60 bg-gradient-to-b from-slate-200 via-slate-400 to-slate-800 p-[3px] shadow-[0_4px_16px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.8)]">
                  {/* Beveled face */}
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 flex flex-col items-center justify-center p-2 shadow-inner">
                    {/* Keyhole slot */}
                    <div className="relative flex flex-col items-center justify-center">
                      <div className="h-4 w-4 rounded-full bg-[#050508] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]" />
                      <div className="h-5 w-2.5 bg-[#050508] -mt-1 rounded-b-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]" />
                    </div>
                  </div>
                </div>

                {/* Subtle rim highlight */}
                <div className="absolute inset-0 rounded-full border border-white/40 pointer-events-none" />
              </div>

              {/* SHA-256 Ledger Micro Stamp */}
              <div className="mt-2 text-[9px] font-mono tracking-widest text-slate-400/80 uppercase">
                SHA-256 IMMUTABLE
              </div>
            </div>

            {/* Specular corner glint */}
            <div className="absolute top-6 right-8 h-3 w-3 rounded-full bg-white shadow-[0_0_12px_#ffffff,0_0_24px_#c4b5fd]" />
          </div>

          {/* 3. LINKED HASH CHAIN (Blocks floating beneath the seal) */}
          <div className="relative -mt-4 flex items-center justify-center gap-3">
            {/* Connector line */}
            <div className="absolute top-1/2 left-8 right-8 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

            {/* Block 01 */}
            <div className="relative rounded-lg border border-violet-400/30 bg-[#0f0e1a]/90 backdrop-blur-sm px-2.5 py-1.5 shadow-lg flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">#01 GENESIS</span>
                <span className="text-[9px] font-mono font-bold text-violet-200">0x71a9..</span>
              </div>
            </div>

            {/* Block 02 (Active Center) */}
            <div className="relative rounded-lg border border-teal-400/50 bg-[#0c1322]/95 backdrop-blur-sm px-3 py-2 shadow-[0_0_15px_rgba(20,184,166,0.3)] flex items-center gap-2 scale-105">
              <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-teal-300 font-bold uppercase tracking-wider">#02 ESCROW</span>
                <span className="text-[10px] font-mono font-black text-white">0x94fc..</span>
              </div>
            </div>

            {/* Block 03 */}
            <div className="relative rounded-lg border border-violet-400/30 bg-[#0f0e1a]/90 backdrop-blur-sm px-2.5 py-1.5 shadow-lg flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">#03 SEALED</span>
                <span className="text-[9px] font-mono font-bold text-violet-200">0x3bc1..</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
