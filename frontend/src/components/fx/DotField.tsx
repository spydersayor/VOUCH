"use client";

import React, { useEffect, useRef } from "react";
import { FX, VerifyWaveEventDetail, RehearsalScenarioEventDetail } from "./fx-config";

interface DotFieldProps {
  className?: string;
  vanishingPointYRatio?: number; // default ~0.44 (beneath centerpiece)
}

interface Wave {
  id: number;
  originX: number;
  originY: number;
  radius: number;
  maxRadius: number;
  color: string;
  speed: number;
  width: number;
  isTampered: boolean;
  brokenAngle?: number;
  opacity: number;
}

export function DotField({ className = "", vanishingPointYRatio = 0.44 }: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!FX.dotField) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = reducedMotionQuery.matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let isVisible = true;
    let isTabVisible = true;
    let rafId: number | null = null;
    let time = 0;

    // Smoothed mouse input
    let targetMx = -9999;
    let targetMy = -9999;
    let lerpMx = -9999;
    let lerpMy = -9999;
    let mouseInside = false;

    // Waves for verification & clicks
    const waves: Wave[] = [];
    let waveCounter = 0;

    // Beam pulse
    let beamPulse = 1.0;
    let beamShiftX = 0;
    let targetBeamShiftX = 0;

    // Resize handler with viewport capping
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      if (isReduced) {
        drawFrame(0);
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Mouse movement
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        targetMx = e.clientX - rect.left;
        targetMy = e.clientY - rect.top;
        mouseInside = true;
      } else {
        mouseInside = false;
      }
    };

    const onPointerLeave = () => {
      mouseInside = false;
      targetMx = -9999;
      targetMy = -9999;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (isReduced) return;
      const rect = container.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const ox = e.clientX - rect.left;
        const oy = e.clientY - rect.top;
        waves.push({
          id: waveCounter++,
          originX: ox,
          originY: oy,
          radius: 0,
          maxRadius: Math.max(width, height) * 0.8,
          color: "rgba(185, 169, 255, 0.85)",
          speed: 420,
          width: 60,
          isTampered: false,
          opacity: 0.9,
        });
      }
    };

    // VOUCH verify wave listener
    const onVerifyWave = (e: Event) => {
      if (!FX.waves || isReduced) return;
      const detail = (e as CustomEvent<VerifyWaveEventDetail>).detail;
      const isTampered = detail.status === "tampered";
      const centerX = width * 0.5;
      const horizonY = height * vanishingPointYRatio;

      waves.push({
        id: waveCounter++,
        originX: centerX,
        originY: horizonY + 20,
        radius: 0,
        maxRadius: Math.max(width, height) * 1.2,
        color: isTampered ? "rgba(244, 63, 94, 0.95)" : "rgba(20, 184, 166, 0.95)",
        speed: 550,
        width: isTampered ? 80 : 90,
        isTampered,
        brokenAngle: isTampered ? Math.PI * 0.25 : undefined,
        opacity: 1.0,
      });

      // Quick beam intensity flash
      beamPulse = isTampered ? 2.4 : 1.8;
    };

    // Rehearsal scenario event listener
    const onRehearsalScenario = (e: Event) => {
      if (!FX.rehearsalGlow || isReduced) return;
      targetBeamShiftX = (Math.random() - 0.5) * 80;
      beamPulse = 2.0;

      // Small localized sweep wave
      waves.push({
        id: waveCounter++,
        originX: width * 0.5 + targetBeamShiftX,
        originY: height * vanishingPointYRatio,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.7,
        color: "rgba(168, 85, 247, 0.9)",
        speed: 480,
        width: 70,
        isTampered: false,
        opacity: 0.85,
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("vouch:verify-wave", onVerifyWave);
    window.addEventListener("vouch:rehearsal-scenario", onRehearsalScenario);

    // Pause when offscreen via IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry ? entry.isIntersecting : false;
        if (isVisible && !rafId && !isReduced) {
          lastFrameTime = performance.now();
          rafId = requestAnimationFrame(loop);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Pause when browser tab is hidden
    const onVisibilityChange = () => {
      isTabVisible = document.visibilityState === "visible";
      if (isTabVisible && isVisible && !rafId && !isReduced) {
        lastFrameTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Draw single frame
    const drawFrame = (dt: number) => {
      if (!ctx || width <= 0 || height <= 0) return;

      time += dt;
      ctx.clearRect(0, 0, width, height);

      const horizonY = height * vanishingPointYRatio;
      const centerX = width * 0.5;

      // Smooth mouse input (lerp)
      if (mouseInside) {
        lerpMx += (targetMx - lerpMx) * 0.1;
        lerpMy += (targetMy - lerpMy) * 0.1;
      } else {
        lerpMx += (-9999 - lerpMx) * 0.1;
        lerpMy += (-9999 - lerpMy) * 0.1;
      }

      // Smooth beam shift
      beamShiftX += (targetBeamShiftX - beamShiftX) * 0.08;
      beamPulse += (1.0 - beamPulse) * 0.04;

      // 1. Soft Reflection & Glow Pool on the floor
      const poolX = centerX + beamShiftX;
      const poolY = horizonY + 25;
      const poolGrad = ctx.createRadialGradient(poolX, poolY, 4, poolX, poolY, width * 0.35);
      poolGrad.addColorStop(0, `rgba(168, 85, 247, ${0.28 * beamPulse})`);
      poolGrad.addColorStop(0.35, `rgba(139, 92, 246, ${0.12 * beamPulse})`);
      poolGrad.addColorStop(0.7, "rgba(99, 102, 241, 0.03)");
      poolGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.save();
      ctx.fillStyle = poolGrad;
      ctx.beginPath();
      ctx.ellipse(poolX, poolY + 15, width * 0.38, 55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Perspective Grid of Glowing Dots
      // Dynamically cap count by viewport
      const numCols = Math.min(48, Math.max(24, Math.round(width / 28)));
      const numRows = Math.min(26, Math.max(16, Math.round((height - horizonY) / 18)));
      const floorHeight = height - horizonY;

      // Update active waves
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        w.radius += w.speed * dt;
        w.opacity = Math.max(0, 1.0 - w.radius / w.maxRadius);
        if (w.radius >= w.maxRadius || w.opacity <= 0) {
          waves.splice(i, 1);
        }
      }

      for (let r = 0; r < numRows; r++) {
        // Perspective depth distribution: denser near horizon, spaced near bottom
        const t = r / (numRows - 1); // 0 at front, 1 near horizon
        const depth = Math.pow(1 - t, 1.7); // 1 at front, 0 at horizon
        const y = horizonY + floorHeight * (1 - t * 0.95);

        // Perspective spreading at this row
        const spread = (y - horizonY) / floorHeight;
        const rowWidth = width * (0.28 + 0.92 * spread);
        const colStep = rowWidth / numCols;
        const startX = centerX - rowWidth * 0.5;

        // Base size shrinks with distance
        const baseRadius = 0.5 + 1.2 * spread;

        // Base dot alpha fades with distance
        const baseAlpha = 0.08 + 0.42 * spread;

        for (let c = 0; c <= numCols; c++) {
          let dotX = startX + c * colStep;
          let dotY = y;

          // Gentle idle float on floor
          const idleWave = Math.sin(dotX * 0.015 + time * 1.2 + r * 0.3) * (0.8 * spread);
          dotY += idleWave;

          // Cursor reaction: Repulsion and displacement
          let mouseDist = 9999;
          let isNearMouse = false;
          let mouseInfluence = 0;

          if (lerpMx > -1000) {
            const dx = dotX - lerpMx;
            const dy = dotY - lerpMy;
            mouseDist = Math.hypot(dx, dy);
            const repelRadius = 140;

            if (mouseDist < repelRadius) {
              isNearMouse = true;
              mouseInfluence = Math.pow(1 - mouseDist / repelRadius, 2);
              const angle = Math.atan2(dy, dx);
              const push = mouseInfluence * 18 * spread;
              dotX += Math.cos(angle) * push;
              dotY += Math.sin(angle) * push;
            }
          }

          // Beam proximity (center vertical light column)
          const beamDist = Math.abs(dotX - (centerX + beamShiftX));
          const beamInfluence = Math.exp(-Math.pow(beamDist / (width * 0.12), 2)) * beamPulse;

          // Waves influence
          let waveInfluence = 0;
          let waveColor = "rgba(185, 169, 255, 1)";
          let isBrokenDot = false;

          for (const w of waves) {
            const distToWaveOrigin = Math.hypot(dotX - w.originX, dotY - w.originY);
            const diff = Math.abs(distToWaveOrigin - w.radius);

            if (diff < w.width) {
              const inf = Math.cos((diff / w.width) * (Math.PI * 0.5)) * w.opacity;

              // Check for tampered visible break
              if (w.isTampered && w.brokenAngle !== undefined) {
                const angle = Math.atan2(dotY - w.originY, dotX - w.originX);
                const angleDiff = Math.abs(angle - w.brokenAngle);
                if (angleDiff < 0.35) {
                  // Broken section in the chain: dots flicker, break, or disappear
                  isBrokenDot = true;
                  continue;
                }
              }

              if (inf > waveInfluence) {
                waveInfluence = inf;
                waveColor = w.color;
              }
            }
          }

          if (isBrokenDot) {
            // Tampered broken gap: skip drawing dot or draw red glitch mark
            ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
            ctx.beginPath();
            ctx.arc(dotX + (Math.random() - 0.5) * 4, dotY, 0.6, 0, Math.PI * 2);
            ctx.fill();
            continue;
          }

          // Determine final color & opacity
          let finalAlpha = baseAlpha;
          let dotRadius = baseRadius;
          let fill = "rgba(226, 222, 248, "; // dim white/lavender default

          if (waveInfluence > 0.05) {
            finalAlpha = Math.min(1.0, baseAlpha + waveInfluence * 0.85);
            dotRadius = baseRadius + waveInfluence * 1.5;
            ctx.fillStyle = waveColor;
          } else if (isNearMouse) {
            // Brighten and turn violet near mouse
            finalAlpha = Math.min(1.0, baseAlpha + mouseInfluence * 0.7);
            dotRadius = baseRadius + mouseInfluence * 1.2;
            ctx.fillStyle = `rgba(196, 181, 253, ${finalAlpha})`;
          } else if (beamInfluence > 0.15) {
            // Accent violet near beam
            finalAlpha = Math.min(0.9, baseAlpha + beamInfluence * 0.45);
            dotRadius = baseRadius + beamInfluence * 0.6;
            ctx.fillStyle = `rgba(185, 169, 255, ${finalAlpha})`;
          } else {
            // Dim lavender-white
            ctx.fillStyle = `${fill}${finalAlpha})`;
          }

          ctx.beginPath();
          ctx.arc(dotX, dotY, Math.max(0.4, dotRadius), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // Animation Loop
    let lastFrameTime = performance.now();
    const loop = (now: number) => {
      if (!isVisible || !isTabVisible) {
        rafId = null;
        return;
      }

      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;

      drawFrame(dt);

      rafId = requestAnimationFrame(loop);
    };

    if (isReduced) {
      drawFrame(0);
    } else {
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("vouch:verify-wave", onVerifyWave);
      window.removeEventListener("vouch:rehearsal-scenario", onRehearsalScenario);
    };
  }, [vanishingPointYRatio]);

  if (!FX.dotField) return null;

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
