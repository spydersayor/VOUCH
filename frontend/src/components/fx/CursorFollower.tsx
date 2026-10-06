"use client";

import React, { useEffect, useRef, useState } from "react";
import { FX } from "./fx-config";

export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!FX.cursor || !mounted) return;

    // Check fine pointer & hover capability
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointerQuery.matches) {
      return;
    }

    const isReduced = reducedMotionQuery.matches;

    // Mouse coordinates and lerped positions
    let targetX = -100;
    let targetY = -100;
    let dotX = -100;
    let dotY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId: number | null = null;
    let active = true;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Never obscure native cursor in text inputs or forms
      const isInput = target.closest("input, textarea, select, [contenteditable='true'], .native-cursor");
      setIsHidden(!!isInput);

      // Detect links, buttons, and interactive shelf cards
      const isInteractive = target.closest("a, button, [role='button'], .cursor-hover, summary");
      const isCard = target.closest(".interactive-card, .stat-tile, .shelf-card");

      setIsHoveringLink(!!isInteractive);
      setIsHoveringCard(!!isCard && !isInteractive);
    };

    const handlePointerDown = () => {
      setIsPressing(true);
    };

    const handlePointerUp = () => {
      setIsPressing(false);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Animation frame loop for smooth lag
    const animate = () => {
      if (!active) return;

      if (isReduced) {
        dotX = targetX;
        dotY = targetY;
        ringX = targetX;
        ringY = targetY;
      } else {
        // Dot follows quickly
        dotX += (targetX - dotX) * 0.45;
        dotY += (targetY - dotY) * 0.45;

        // Ring follows with soft lag (lerp)
        ringX += (targetX - ringX) * 0.16;
        ringY += (targetY - ringY) * 0.16;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotX - 4}px, ${dotY - 4}px, 0)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    rafId = requestAnimationFrame(animate);

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mounted]);

  if (!FX.cursor || !mounted) return null;

  return (
    <>
      <style jsx global>{`
        /* Hide custom cursor on touch or coarse pointers */
        @media (hover: none), (pointer: coarse) {
          .vouch-custom-cursor {
            display: none !important;
          }
        }
      `}</style>

      <div
        className={`vouch-custom-cursor pointer-events-none fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-300 ${
          isVisible && !isHidden ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        {/* Center precision dot */}
        <div
          ref={dotRef}
          className={`pointer-events-none fixed top-0 left-0 h-2 w-2 rounded-full transition-transform duration-100 ease-out will-change-transform ${
            isHoveringLink
              ? "bg-violet-400 shadow-[0_0_8px_#c4b5fd]"
              : "bg-teal-400 shadow-[0_0_8px_#2dd4bf]"
          }`}
        />

        {/* Outer smoothed ring */}
        <div
          ref={ringRef}
          className={`pointer-events-none fixed top-0 left-0 rounded-full border will-change-transform transition-all duration-200 ease-out flex items-center justify-center ${
            isPressing
              ? "h-6 w-6 border-violet-400/90 bg-violet-500/20 backdrop-blur-[2px]"
              : isHoveringLink
              ? "h-13 w-13 border-violet-400/80 bg-violet-500/15 backdrop-blur-[2px] shadow-[0_0_18px_rgba(168,85,247,0.3)]"
              : isHoveringCard
              ? "h-11 w-11 border-teal-400/60 bg-teal-500/10 backdrop-blur-[1px]"
              : "h-8 w-8 border-violet-300/40 bg-transparent shadow-[0_0_10px_rgba(185,169,255,0.15)]"
          }`}
        >
          {isHoveringCard && (
            <span className="text-[9px] font-mono tracking-widest text-teal-300 uppercase">
              +
            </span>
          )}
        </div>
      </div>
    </>
  );
}
