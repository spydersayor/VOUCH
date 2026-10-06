# VOUCH: Work you can prove

> Built with Google Antigravity as an AI coding tool.

VOUCH is a verifiable work and escrow platform with an immutable SHA-256 cryptographic ledger, strict role-based access control, integer rupee conservation, and a pure-function Rehearsal Engine.

---

## Quickstart Commands

### 1. Backend Setup
```bash
# Install Python dependencies
python -m pip install -r requirements.txt

# Seed demo data (users, closed projects, structured reviews, and ledger chain)
python -m backend.seed

# Run comprehensive test suite (Phase 1 through Phase 7)
python -m pytest -v

# Start FastAPI backend (port 8000)
python -m uvicorn backend.main:app --reload --port 8000
```

### 2. Next.js App Router Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Run link crawler, role navigation and headless browser render checks
npm run check-links

# Start Next.js dev server (port 3000, proxies /api/* -> 8000)
npm run dev
```

---

## URLs to Open
- **Next.js Frontend (Primary Application):** **[http://localhost:3000](http://localhost:3000)**
- **Rehearsal Engine:** **[http://localhost:3000/rehearsal](http://localhost:3000/rehearsal)**
- **FastAPI Interactive Swagger Docs:** **[http://localhost:8000/docs](http://localhost:8000/docs)**
- **Static Vanilla Fallback (Legacy):** **[http://localhost:8000](http://localhost:8000)**

---

## Demo Accounts

All seed accounts use the default password: **`Password123!`**

| Role | Email | Name | Notes |
| :--- | :--- | :--- | :--- |
| **Sponsor** | `sponsor@vouch.local` | Apex Health AI | Company sponsor with wallet balance |
| **Expert A** | `expert.a@vouch.local` | Dr. Aris Thorne | 4.9 stars, verified biomedical imaging CV |
| **Expert B** | `expert.b@vouch.local` | Prof. Elena Rostova | 4.8 stars, **declared conflict of interest** with Apex |
| **Student A** | `student.a@vouch.local` | Maya Lin | 4.6 stars, strong quality/comm, one late milestone |
| **Student B** | `student.b@vouch.local` | Rohan Mehta | 3.9 stars, fast delivery, flagged twice for similarity |
| **Student C** | `student.c@vouch.local` | Priya Sharma | **Newbie Badge** (no stars yet, removed after 1st closed review) |
| **Admin** | `admin@vouch.local` | System Admin | Platform governance, verification, tamper audit, disputes |

---

## Mocked Now vs. Production Architecture

Per SPEC.md Section 15:

| Subsystem | Demo State (Mocked) | Production Target |
| :--- | :--- | :--- |
| **Payments & Escrow** | Simulated internal ledger wallet in SQLite; strict integer rupee conservation | Multi-currency fiat/crypto escrow gateway (Stripe Connect / Razorpay Route) |
| **Identity & KYC** | Simulated verification queue & admin approval toggle in SQLite | DigiLocker / Aadhaar verification / Stripe Identity automated KYC |
| **Email Verification** | Immediate verification, reset tokens logged to console & UI | Transactional SMTP service (Resend / AWS SES / SendGrid) |
| **Ledger Anchoring** | Local append-only SQLite SHA-256 hash chain with verify endpoint | Periodically anchored Merkle roots to public trust network (Ethereum / Polygon / RFC 6962) |
| **Similarity Check** | 3-word shingle Jaccard overlap against local history & seeded corpus | Vector database embedding similarity (Milvus / Pinecone) + AST code similarity |
| **LLM Scoping** | Deterministic canned milestones & rules; optional `LLM_API_KEY` | Gemini 1.5 Pro / Flash with structured JSON outputs |

---

## 5-Minute Demo Script (Matching the Interactive Demo Guide)

Open **[http://localhost:3000](http://localhost:3000)**, log in as any user, and click the floating **"Demo Guide"** button in the bottom-right corner to walk through the complete story:

1. **Step 1: Post Problem** (Sponsor)
   - Click **Step 1** in the Demo Guide. You are auto-logged in as `sponsor@vouch.local` and taken to `/sponsor/post-problem`.
   - View the enterprise problem brief, milestone breakdown, and sensitivity label.
2. **Step 2: AI Scope** (Sponsor)
   - Click "AI Scope Breakdown" to generate milestones, skill tags, and estimated budget splits.
3. **Step 3: Match & Invite** (Student / Sponsor)
   - View ranked candidate recommendations matching required skills while respecting declared conflicts of interest.
4. **Step 4: Join Charter** (Student A)
   - Log in as `student.a@vouch.local` and open `/charters/proj_retinopathy`.
   - Read the binding IP terms, milestone payment splits, and exit clauses, then click **"Sign and Accept Charter v1"**.
5. **Step 5: Fund Escrow** (Sponsor)
   - Open `/sponsor/wallet` and lock ₹1,00,000 into the milestone escrow locker. Funds are locked server-side.
6. **Step 6: Deliver Work** (Student B)
   - Open `/projects/proj_retinopathy/workspace`. Submit code deliverables with optional AI contribution disclosure.
7. **Step 7: Catch Copied Content** (Admin)
   - Switch to `admin@vouch.local` on `/admin`. Open the **Flagged Submissions** tab to view submissions flagged for &gt;35% similarity, with options to **Clear Flag** or **Confirm Violation**.
8. **Step 8: Accept Milestone** (Sponsor)
   - Sponsor accepts Milestone 1 in the workspace. Rupee payout is distributed according to charter weights with zero creation/loss of funds.
9. **Step 9: Non-Monetary Credential** (Student B)
   - Navigate to `/student/credentials`. View the tamper-evident certificate minted to the ledger with milestone verification hash.
10. **Step 10: Verify Ledger & Tamper Simulation** (Admin)
    - On `/admin`, view the **Ledger Audit** tab. Click **"Demo: Simulate Tamper on Entry #2"**.
    - Notice the immediate red alert banner: **"LEDGER CHAIN BROKEN AT ENTRY #2"**.
    - Click **"Repair Demo Ledger"** to cryptographically re-anchor the sequential hashes back to `VERIFIED INTACT`.
11. **Step 11: Twist (Rehearsal Engine)** (Sponsor / Expert / Admin)
    - Navigate to `/rehearsal` via the sidebar. Select a project and run any of the 5 dry-run simulations:
      - *Student quits at 40%* (pro-rata share, star penalty with floor 1.0 or good cause waiver).
      - *Sponsor withdraws* (unreleased escrow + 10% compensation charged to sponsor, -0.5 stars).
      - *Sponsor goes silent* (auto-acceptance after 7-day window).
      - *AI wrote 70%* (credit assigned to human owner, compute cost disclosed).
      - *Paid becomes unpaid* (charter amendment requiring mutual re-acceptance).

---

## Known Limitations

1. **Local SQLite Storage**: Data and cryptographic ledger entries are stored in a local SQLite file (`vouch.db`) rather than a distributed cloud SQL instance.
2. **Simulated Financial Rails**: Rupee balances, locker escrows, and payouts are simulated with integer precision; real banking integrations (UPI, Razorpay, Stripe) are mocked.
3. **Similarity Engine**: Uses deterministic 3-word shingle Jaccard overlap rather than heavy neural embedding pipelines, ensuring instant offline execution.
4. **Email & KYC Dispatch**: Notifications and verification updates are recorded in-app and on the ledger without sending outbound SMTP emails or SMS messages.
