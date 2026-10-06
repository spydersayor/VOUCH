# VOUCH: Work you can prove

> Built with Google Antigravity as an AI coding tool.

---

## Quickstart Commands

### 1. Backend Setup
```bash
# Install Python dependencies
python -m pip install -r requirements.txt

# Seed demo data (users, closed projects, structured reviews, and ledger chain)
python -m backend.seed

# Run backend tests
python -m pytest -v

# Start FastAPI backend (port 8000)
python -m uvicorn backend.main:app --reload --port 8000
```

### 2. Modern Next.js Frontend Setup
```bash
# Install frontend dependencies (from frontend directory)
cd frontend
npm install

# Start Next.js App Router (port 3000, proxies /api/* -> 8000)
npm run dev
```

---

## URLs to Open
- **Modern Next.js Frontend (Primary):** **[http://localhost:3000](http://localhost:3000)**
- **FastAPI Backend & Interactive Swagger API Docs:** **[http://localhost:8000/docs](http://localhost:8000/docs)**
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
| **Student C** | `student.c@vouch.local` | Priya Sharma | **Newbie Badge** (no stars yet, verified skills shown) |
| **Admin** | `admin@vouch.local` | System Admin | Platform operations, audit, tamper demo, KYC |

---

## Mocked Now vs. Production Architecture

Per SPEC.md Section 15:

| Subsystem | Demo State (Mocked) | Production Target |
| :--- | :--- | :--- |
| **Payments & Escrow** | Simulated internal ledger wallet in SQLite; integer rupee math | Multi-currency fiat/crypto escrow gateway (Stripe Connect / Razorpay Route) |
| **Identity & KYC** | Simulated instant verification badge toggle in DB | DigiLocker / Aadhaar verification / Stripe Identity automated KYC |
| **Email Verification** | Immediate verification, reset tokens logged to console/UI | Transactional SMTP service (Resend / AWS SES / SendGrid) |
| **Ledger Anchoring** | Local append-only SQLite SHA-256 hash chain with verify endpoint | Periodically anchored Merkle roots to public trust network (Ethereum / Polygon / RFC 6962) |
| **Similarity Check** | 3-word shingle Jaccard overlap against local history & seeded corpus | Vector database embedding similarity (Milvus / Pinecone) + AST code similarity |
| **LLM Scoping** | Deterministic canned milestones & rules; optional `LLM_API_KEY` | Gemini 1.5 Pro / Flash with structured JSON outputs |

---

## Key Endpoints

- `GET /` — Web interface & live ledger verification monitor
- `GET /api/ledger/verify` — Public cryptographic ledger chain verifier
- `GET /api/me` — Authenticated profile & wallet balance
- `GET /api/projects` — Public project directory
- `GET /api/projects/{id}/brief` — Server-gated confidential brief (requires accepted current charter)
- `POST /api/payout/calculate` — Exact integer rupee milestone payout calculator
