# VOUCH Complete Frontend Redesign Plan
*Atmospheric Dark Mode & Typography Alignment with Tandem Baseline*

## 1. Audit & Inventory

### 1.1 Baseline Hero Assets (Strictly Preserved)
- `src/components/fx/DotField.tsx`: Canvas 2D perspective ground grid with cursor repel, beam proximity, and verification wave.
- `src/components/fx/CursorFollower.tsx`: Lerped ring + dot cursor with link/button morphing and input protection.
- `src/components/fx/HeroSealCenterpiece.tsx`: 3D chrome/glass cryptographic seal with keyhole and floating hash blocks.
- `src/components/fx/HeroScene.tsx`: Atmospheric backdrop container with vignette and light cone.
- `src/components/fx/fx-config.ts`: Central toggle flags (`FX`) and custom event emitters (`triggerVerifyWave`, `triggerRehearsalScenario`).
- `src/components/hero/HeroTandemLayout.tsx`: Tandem-style header rail, headline, pill CTA, avatar stack, and stat count-ups.

### 1.2 Global Shell & Components
- `src/components/shell/AppShell.tsx`: Navigation bar, notifications, role routing, and footer.
- `src/components/shell/RoleSidebar.tsx`: Dashboard sidebar navigation for students, experts, sponsors, admins.
- `src/components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`: Core atomic primitives.
- `src/components/pros-cons/ProsConsPanel.tsx`: Match analysis with objective pros and cons.

### 1.3 Landing & Informational Pages
- `src/app/page.tsx`: Main landing page (Statement, Shelf, Detail Rooms, Principles, Roles, Live Verifier, FAQ, Closing CTA).
- `src/app/how-it-works/page.tsx`: 6-step deterministic protocol and exit rules.
- `src/app/open-problems/page.tsx`: Browse open industry problems with escrow badges.
- `src/app/pricing/page.tsx`: Engagement models, fee schedule, and 0% student fee guarantee.
- `src/app/faq/page.tsx`: Accordion list of technical and operational questions.
- `src/app/about/page.tsx`, `src/app/contact/page.tsx`, `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`, `src/app/help/page.tsx`.
- Role landing pages: `src/app/students/page.tsx`, `src/app/experts/page.tsx`, `src/app/companies/page.tsx`.

### 1.4 Application & Dashboard Pages
- Auth: `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`.
- Student: `src/app/student/page.tsx`, `src/app/student/matches/page.tsx`, `src/app/student/applications/page.tsx`, `src/app/student/credentials/page.tsx`.
- Expert: `src/app/expert/page.tsx`, `src/app/expert/matches/page.tsx`, `src/app/expert/conflicts/page.tsx`.
- Sponsor: `src/app/sponsor/page.tsx`, `src/app/sponsor/post-problem/page.tsx`, `src/app/sponsor/projects/page.tsx`, `src/app/sponsor/projects/[id]/page.tsx`, `src/app/sponsor/wallet/page.tsx`.
- Admin / Governance: `src/app/admin/page.tsx` (Ledger tamper simulation, dispute queues, DB reset).
- Charters: `src/app/charters/[id]/page.tsx` (Bilateral agreement, IP clauses, split rules, acceptance).
- Projects: `src/app/projects/[id]/workspace/page.tsx`, `src/app/projects/[id]/timeline/page.tsx`.
- Notifications: `src/app/notifications/page.tsx`.

---

## 2. Design Tokens Extracted from Tandem Baseline

### 2.1 Color Palette
- **Stage Background**: `#050508` (deep atmospheric stage)
- **Surfaces**:
  - Tile / Card: `#0c0d12` (subtle dark plate)
  - Elevated Plate: `#121218`
  - Active Highlight Plate: `#181824`
- **Hairline Borders**: `rgba(255, 255, 255, 0.08)` to `rgba(185, 169, 255, 0.25)`
- **Violet Accent (Light Source)**:
  - Primary Lavender: `#b9a9ff` (`var(--lav)`)
  - Deep Violet: `#8f7cff` (`var(--lav2)`)
  - Glow Source: `rgba(168, 85, 247, 0.35)` to `rgba(185, 169, 255, 0.7)`
- **Semantic Status Signals**:
  - **Verified / Intact**: `#10b981` / `#14b8a6` (Emerald / Teal glow)
  - **Tampered / Flagged / Broken**: `#ef4444` / `#f43f5e` (Rose / Crimson alert)
  - **Pending / In Review / Gold**: `#f59e0b` / `#d97706` (Amber gold)
  - **Muted Text**: `#8b8ea0` / `#5c5c68`

### 2.2 Typography Scale
- **Headlines**: Extra-light / Light weights (`font-extralight` / `font-light`, `tracking-tight`), fluid `clamp(32px, 5vw, 64px)` with deliberate line breaks and a single violet-tinted glow phrase.
- **Eyebrows / Labels**: `font-mono`, `text-[11px]`, `tracking-[0.2em]`, uppercase.
- **Ledger / Cryptography**: `font-mono`, `text-xs` / `text-sm`, hashes, sequence tags, rupee amounts.
- **Body**: `font-sans`, `text-slate-300`, `leading-relaxed`.

### 2.3 Motion & Easing
- Cubic Easing: `cubic-bezier(0.2, 0.75, 0.2, 1)` (`var(--ease)`)
- Fast out / smooth settle: `cubic-bezier(0.16, 1, 0.3, 1)`
- `prefers-reduced-motion`: 0 duration, static renders.

---

## 3. Scope of Changes

### 3.1 Design System & CSS Centralization
- Centralize all colors, typography, border styles, and glow utilities in `frontend/src/app/globals.css` and a shared tokens helper `frontend/src/lib/design-tokens.ts`.
- Update `button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx` to use the dark atmospheric surface styling, hairline borders, and glowing states.

### 3.2 Global Shell Restyling
- **Top Nav**: Dark stage transparency at top, frosted glass on scroll, VOUCH logo with glowing badge, hairline pill CTA, accessible drawer menu for mobile.
- **Footer**: Giant VOUCH display wordmark with subtle gradient, multi-column navigation, simulated KYC/escrow disclaimer, back-to-top button.
- **App Shell**: Seamless dark stage with subtle ambient backdrop and `CursorFollower`.

### 3.3 Landing Page Restructure (Below Hero)
1. **Statement Section**: High-impact editorial statement ("Others record what happened. VOUCH proves it, and rehearses what could happen.") with scroll reveal.
2. **Shelf Section (Engagement Models)**: Horizontal scroll-snap shelf of 4 tall cards (Funded, Stipend, Knowledge-sharing, Institutional credit) with beam highlight and keyboard navigation. Non-monetary models strictly omit rupee visuals.
3. **Detail / Pinned Work Rooms (01/04)**:
   - 01: Receipt-Backed Stars
   - 02: Rehearsal Engine
   - 03: Human-Credited AI Work
   - 04: Bilateral Single Charter
4. **Principles (Studio Section)**: Large numbered statements with capabilities grid underneath.
5. **Roles (Journal Section)**: Student, Expert, Sponsor, Admin, and AI Agent cards with strict PRD guardrails.
6. **Live Ledger Verifier & Rehearsal Sandbox**: The hero moment with real-time verification wave triggers.
7. **FAQ & Closing CTA**.

### 3.4 App Screens Restyling
- **Login / Signup**: Split layout with atmospheric glow backdrop, large inputs, clear role segmented controls.
- **Dashboards (Student, Expert, Sponsor, Admin)**: Dense telemetry stats, hairline-divided lists, milestone status badges, escrow split bars.
- **Charters (`/charters/[id]`)**: Version timeline, signature stamps, distinct styling for funded vs non-monetary models.
- **Matching (`/expert/matches`, `/student/matches`)**: Match scores, transparent pros/cons pills, newcomer badge, muted conflict logs.
- **Projects & Workspace (`/projects/[id]/workspace`, `/timeline`)**: AI agent actions tied to human owner, similarity review cards, milestone submission locks.
- **Ledger & Admin (`/admin`)**: Monospace audit table, truncated SHA-256 hashes with copy, sequential link indicators, live tamper test buttons.

---

## 4. What is Deliberately NOT Touched (Safety Rules)
1. **API Endpoints & Fetch Handlers**: All calls to `/api/ledger/verify`, `/api/ledger/simulate-tamper`, `/api/admin/reset`, `/api/charters/*`, `/api/projects/*`, `/api/auth/*` remain completely unchanged.
2. **Data Schemas & State Logic**: React Query hooks, form state hooks (`react-hook-form`, `zod`), auth context (`useAuth`), role guards (`RoleGuard`), and verification calculations remain 100% intact.
3. **DOM Identifiers & Props**: All `id`, `name`, `data-testid`, `aria-label`, and critical class names referenced by tests or scripts are preserved.
4. **Hero 3D Scene & Cursor**: `HeroScene`, `DotField`, `HeroSealCenterpiece`, and `CursorFollower` are treated as the visual baseline and not rewritten.
