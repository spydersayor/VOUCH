// Global configuration flag for hero visuals and cursor interactions
// You can toggle any of these flags to false instantly if needed.

export const FX = {
  dotField: true,        // Perspective grid of glowing dots on the lower half of the hero
  cursor: true,          // Custom ring + dot cursor follower with lerp & state transitions
  hero3d: true,          // Glossy chrome/glass cryptographic seal with keyhole & parallax tilt
  beam: true,            // Vertical violet light beam with slow intensity pulse
  statsCountUp: true,    // Animated count-up for hero stat tiles
  rehearsalGlow: true,   // Beam and wave redirection on rehearsal scenario selection
  waves: true,           // Light wave propagation through dot field on ledger verification
};

// Event types for cross-component interactions
export interface VerifyWaveEventDetail {
  status: "ok" | "tampered";
  brokenSeq?: number;
  count?: number;
}

export interface RehearsalScenarioEventDetail {
  scenarioId: string;
  name?: string;
}

// Dispatches a light wave event across the dot field
export function triggerVerifyWave(status: "ok" | "tampered", brokenSeq?: number, count?: number) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<VerifyWaveEventDetail>("vouch:verify-wave", {
    detail: { status, brokenSeq, count },
  });
  window.dispatchEvent(event);
}

// Dispatches a rehearsal engine scenario selection event
export function triggerRehearsalScenario(scenarioId: string, name?: string) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<RehearsalScenarioEventDetail>("vouch:rehearsal-scenario", {
    detail: { scenarioId, name },
  });
  window.dispatchEvent(event);
}
