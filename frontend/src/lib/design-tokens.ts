// Centralized VOUCH Design System Tokens
// Aligned with the Tandem aesthetic baseline (atmospheric dark, hairline borders, lavender glow)

export const TOKENS = {
  colors: {
    stage: "#050508",
    tile: "#0c0d12",
    plate: "#121218",
    plateElevated: "#181824",
    
    // Hairline border scales
    border: "rgba(255, 255, 255, 0.08)",
    borderSubtle: "rgba(255, 255, 255, 0.04)",
    borderHover: "rgba(185, 169, 255, 0.35)",
    borderActive: "rgba(185, 169, 255, 0.65)",
    
    // Violet Light-Source Accent
    lavender: "#b9a9ff",
    violet: "#8f7cff",
    violetGlow: "rgba(168, 85, 247, 0.35)",
    
    // Semantic Status Signals
    verified: "#10b981",
    verifiedBg: "rgba(16, 185, 129, 0.12)",
    verifiedBorder: "rgba(16, 185, 129, 0.35)",
    
    tampered: "#f43f5e",
    tamperedBg: "rgba(244, 63, 94, 0.12)",
    tamperedBorder: "rgba(244, 63, 94, 0.4)",
    
    pending: "#f59e0b",
    pendingBg: "rgba(245, 158, 11, 0.12)",
    pendingBorder: "rgba(245, 158, 11, 0.35)",
    
    // Text
    textPrimary: "#f3f2ff",
    textSecondary: "#8b8ea0",
    textMuted: "#5c5c68",
  },
  
  typography: {
    fontSans: 'var(--font-sans, "Inter", system-ui, sans-serif)',
    fontMono: 'var(--font-mono, "Geist Mono", ui-monospace, monospace)',
    microLabel: "font-mono text-[11px] tracking-[0.2em] uppercase text-[#8b8ea0]",
  },
  
  shadows: {
    card: "0 10px 40px rgba(0, 0, 0, 0.5)",
    cardHover: "0 14px 45px rgba(0, 0, 0, 0.7), 0 0 24px rgba(168, 85, 247, 0.15)",
    glowPill: "0 0 14px rgba(143, 124, 255, 0.25), inset 0 0 12px rgba(143, 124, 255, 0.1)",
    glowPillHover: "0 0 28px rgba(168, 85, 247, 0.6), inset 0 0 16px rgba(185, 169, 255, 0.25)",
  },
  
  transitions: {
    ease: "cubic-bezier(0.2, 0.75, 0.2, 1)",
    fast: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    smooth: "all 0.35s cubic-bezier(0.2, 0.75, 0.2, 1)",
  }
};
