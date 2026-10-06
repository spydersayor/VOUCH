"use client";

import React from "react";
import { DotField } from "./DotField";
import { HeroSealCenterpiece } from "./HeroSealCenterpiece";
import { FX } from "./fx-config";

interface HeroSceneProps {
  className?: string;
}

export function HeroScene({ className = "" }: HeroSceneProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Deep atmospheric background gradient */}
      <div className="absolute inset-0 bg-[#050508]" />

      {/* 2. Ambient top lighting cone */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.45) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 75%)",
        }}
      />

      {/* 3. Dot-Field Floor across lower half converging toward vanishing point */}
      {FX.dotField && (
        <DotField className="absolute inset-0 z-0" vanishingPointYRatio={0.46} />
      )}

      {/* 4. Centerpiece (Seal + Hash Chain + Beam) positioned at the focal vanishing point */}
      <div className="absolute top-[22%] sm:top-[20%] left-1/2 -translate-x-1/2 z-10">
        <HeroSealCenterpiece />
      </div>

      {/* 5. Edge vignette to softly merge with the rest of the page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050508] to-transparent pointer-events-none z-20" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050508]/80 to-transparent pointer-events-none z-20" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050508]/80 to-transparent pointer-events-none z-20" />
    </div>
  );
}
