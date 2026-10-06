# VOUCH Platform Route Registry

This document lists every application route across the public surface, authentication, role workspaces, charter flows, and administration.

| Route | Role / Scope | Built | Description |
|---|---|---|---|
| `/` | Public | Yes | Landing page (Hero, problems, 6-step flow, features, live diary widget, FAQ) |
| `/how-it-works` | Public | Yes | Detailed 6-step flow with cryptographic ledger proof explanation |
| `/open-problems` | Public | Yes | Problem brief directory with skill, model, and budget filters |
| `/pricing` | Public | Yes | Platform fee model, 5% AI reserve, and worked Rs 1,00,000 payout split calculator |
| `/faq` | Public | Yes | Interactive FAQ accordion covering escrow, IP, stars, and verification |
| `/about` | Public | Yes | Platform architecture, immutable diary, and design principles |
| `/contact` | Public | Yes | Contact submission form (logged to immutable ledger) |
| `/terms` | Public | Yes | Standard charter terms, IP assignment rules, and dispute clauses |
| `/privacy` | Public | Yes | Confidentiality pledge and dataset protection policy |
| `/help` | Public | Yes | Rehearsal engine guide, scenario explanations, and judging manual |
| `/students` | Public | Yes | Student persona overview, earnings model, and portfolio proof benefits |
| `/experts` | Public | Yes | Expert advisor overview, code review governance, and reward split |
| `/companies` | Public | Yes | Enterprise sponsor overview, milestone escrow, and verified IP handover |
| `/login` | Public / Guest | Yes | 2-step role-aware login with role selector cards and filtered demo chips |
| `/signup` | Public / Guest | Yes | Role-card registration with Newbie badge assignment and simulated verification |
| `/forgot-password` | Public / Guest | Yes | Simulated password reset generator with on-screen demo tokens |
| `/reset-password` | Public / Guest | Yes | Password reset form using demo tokens |
| `/not-found` | Public | Yes | Custom 404 page linking back to user's role dashboard |
| `/charters/[id]` | Auth (All roles) | Yes | Comprehensive charter review, engagement model badge, rupee split, acceptance |
| `/notifications` | Auth (All roles) | Yes | Full notifications center with unread filter, mark read, and direct links |
| `/settings` | Auth (All roles) | Yes | Account settings, notification preferences, and portfolio links |
| `/users/[id]` | Public / Auth | Yes | Public profile (stars/Newbie badge, finished projects, ratings history, pros/cons) |
| `/student` | Student | Yes | Student workspace: stats, needed actions, applications, earnings, ledger feed |
| `/student/charters`| Student | Yes | Student charter acceptance queue |
| `/student/projects`| Student | Yes | Student active and completed projects |
| `/student/earnings`| Student | Yes | Student rupee payouts, earnings history, and bank status |
| `/student/credentials`| Student | Yes | Student verified credentials, certificates, and badges |
| `/expert` | Expert | Yes | Expert advisor console: stats, reviews queue, conflict declarations, matches |
| `/expert/charters` | Expert | Yes | Expert charter review & co-signature queue |
| `/expert/reviews` | Expert | Yes | Expert milestone review and code submission verification |
| `/expert/earnings`| Expert | Yes | Expert 30% pool earnings and payout breakdowns |
| `/sponsor` | Sponsor | Yes | Sponsor console: stats, posted projects, milestone approvals, wallet & locker |
| `/sponsor/charters`| Sponsor | Yes | Sponsor charter versions and publication status |
| `/sponsor/wallet` | Sponsor | Yes | Escrow lockers, funded amounts, and release tracking |
| `/sponsor/payouts`| Sponsor | Yes | Completed milestone disbursement receipts |
| `/admin` | Admin | Yes | Admin audit desk: verification queue, flags, disputes, simulate-tamper, reset |
| `/admin/users` | Admin | Yes | Registered users directory with KYC status and role badges |
| `/admin/ledger` | Admin | Yes | Full cryptographic ledger explorer with block verification and tamper test |
