"""
VOUCH FastAPI Application
REST JSON under /api, cookie-based session auth, server-side RBAC,
cryptographic ledger verification, charter versioning, and brief gating.
"""

import json
import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

from backend.config import DB_PATH, DEFAULT_STUDENT_WEIGHTS
from backend.database import get_db, init_db
from backend.auth import (
    hash_password,
    verify_password,
    create_session_token,
    set_auth_cookie,
    clear_auth_cookie,
    get_current_user,
    get_optional_user,
)
from backend.rbac import require_role, check_confidential_brief_access
from backend.ledger import record_ledger_entry, verify_ledger, simulate_tamper
from backend.charter import publish_or_update_charter, accept_charter
from backend.payout import calculate_milestone_payout

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="VOUCH API",
    description="Work you can prove - Trust-first collaboration platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===================== Pydantic Schemas =====================
class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    role: str  # student, expert, sponsor, admin
    name: str
    headline: Optional[str] = ""
    skills: Optional[List[str]] = []


class CharterAcceptRequest(BaseModel):
    version: int
    accept_engagement_model: bool = True


class CharterPublishRequest(BaseModel):
    scope: str
    ip_clause: str
    confidentiality_clause: str
    exit_terms: str
    commercialisation_clause: str
    split_config: Optional[Dict[str, Any]] = None
    engagement_model: str


class PayoutCalcRequest(BaseModel):
    amount: int
    student_weights: Optional[List[float]] = None
    expert_present: bool = True


class SimulateTamperRequest(BaseModel):
    seq: Optional[int] = None


# ===================== Auth Endpoints =====================
@app.post("/api/auth/login")
async def login(req: LoginRequest, response: Response):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
        if not user or not verify_password(req.password, user["password_hash"], user["salt"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        token = create_session_token(user["id"])
        set_auth_cookie(response, token)

        return {
            "status": "success",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "headline": user["headline"],
                "stars": user["stars"],
                "newbie_badge": bool(user["newbie_badge"]),
            },
            "token": token,  # Token also provided in body for headless testing
        }


@app.post("/api/auth/signup")
async def signup(req: SignupRequest, response: Response):
    valid_roles = ["student", "expert", "sponsor", "admin"]
    if req.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {valid_roles}")

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already registered.")

        pwd_hash, salt = hash_password(req.password)
        user_id = f"usr_{os.urandom(8).hex()}"
        newbie = 1 if req.role == "student" else 0

        conn.execute(
            """
            INSERT INTO users (id, email, password_hash, salt, role, name, headline, skills_json, newbie_badge)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, req.email, pwd_hash, salt, req.role, req.name, req.headline or "", json.dumps(req.skills or []), newbie),
        )

        init_bal = 500000 if req.role == "sponsor" else 10000
        conn.execute("INSERT INTO wallets (user_id, balance) VALUES (?, ?)", (user_id, init_bal))

        token = create_session_token(user_id)
        set_auth_cookie(response, token)

        record_ledger_entry(
            actor=user_id,
            action="USER_SIGNUP",
            payload={"user_id": user_id, "email": req.email, "role": req.role},
            conn=conn,
        )

        return {
            "status": "success",
            "user": {
                "id": user_id,
                "email": req.email,
                "name": req.name,
                "role": req.role,
                "newbie_badge": bool(newbie),
            },
            "token": token,
        }


@app.post("/api/auth/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"status": "success", "message": "Logged out successfully."}


@app.get("/api/me")
async def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        wallet = conn.execute("SELECT balance FROM wallets WHERE user_id = ?", (user["id"],)).fetchone()
        balance = wallet["balance"] if wallet else 0

        skills = json.loads(user.get("skills_json") or "[]")
        interests = json.loads(user.get("interests_json") or "[]")

        return {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["name"],
            "headline": user["headline"],
            "skills": skills,
            "interests": interests,
            "stars": user["stars"],
            "newbie_badge": bool(user["newbie_badge"]),
            "is_kyc_verified": bool(user["is_kyc_verified"]),
            "wallet_balance": balance,
        }


# ===================== Ledger Endpoints =====================
@app.get("/api/ledger/verify")
async def get_ledger_verification():
    """
    Public verification endpoint (SPEC.md Section 3 & 11).
    Validates complete SHA-256 hash chaining of all recorded events.
    """
    return verify_ledger()


@app.get("/api/ledger")
async def get_ledger_entries(limit: int = 50, project_id: Optional[str] = None):
    with get_db() as conn:
        if project_id:
            # Filter entries where payload has project_id
            rows = conn.execute("SELECT * FROM ledger ORDER BY seq DESC LIMIT ?", (limit * 3,)).fetchall()
            filtered = []
            for r in rows:
                p = json.loads(r["payload_json"])
                if p.get("project_id") == project_id:
                    filtered.append(dict(r))
                if len(filtered) >= limit:
                    break
            return {"entries": filtered}
        else:
            rows = conn.execute("SELECT * FROM ledger ORDER BY seq DESC LIMIT ?", (limit,)).fetchall()
            return {"entries": [dict(r) for r in rows]}


@app.post("/api/ledger/simulate-tamper")
async def post_simulate_tamper(
    req: SimulateTamperRequest = None,
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """
    Admin-only demo tool: corrupts an entry in the ledger DB to demonstrate tamper detection.
    """
    target = req.seq if req else None
    return simulate_tamper(target)


# ===================== Project & Brief Endpoints =====================
@app.get("/api/projects")
async def list_projects():
    """Public summary of projects (no confidential brief)."""
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT id, title, public_summary, budget, engagement_model, status, sponsor_id, created_at
            FROM projects WHERE status != 'draft' ORDER BY created_at DESC
            """
        ).fetchall()
        return {"projects": [dict(r) for r in rows]}


@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Public project details and milestone summaries."""
    with get_db() as conn:
        proj = conn.execute(
            """
            SELECT id, title, public_summary, budget, engagement_model, status, sponsor_id, created_at
            FROM projects WHERE id = ?
            """,
            (project_id,),
        ).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        milestones = conn.execute(
            "SELECT id, sequence, title, description, budget, status FROM milestones WHERE project_id = ? ORDER BY sequence ASC",
            (project_id,),
        ).fetchall()

        charter = conn.execute(
            "SELECT version, engagement_model, scope, is_current FROM charters WHERE project_id = ? AND is_current = 1",
            (project_id,),
        ).fetchone()

        return {
            "project": dict(proj),
            "milestones": [dict(m) for m in milestones],
            "charter": dict(charter) if charter else None,
        }


@app.get("/api/projects/{project_id}/brief")
async def get_confidential_brief(
    project_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    CONFIDENTIAL BRIEF & DATASETS.
    Strictly gated: Only returns data if user accepted the CURRENT charter version or is the sponsor owner.
    """
    check_confidential_brief_access(project_id, user)

    with get_db() as conn:
        proj = conn.execute(
            "SELECT id, title, confidential_brief, datasets_json, engagement_model FROM projects WHERE id = ?",
            (project_id,),
        ).fetchone()

        return {
            "project_id": proj["id"],
            "title": proj["title"],
            "confidential_brief": proj["confidential_brief"],
            "datasets": json.loads(proj["datasets_json"] or "[]"),
            "access_granted_to": user["email"],
            "role": user["role"],
        }


# ===================== Charter Endpoints =====================
@app.get("/api/projects/{project_id}/charter")
async def get_project_charter(
    project_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    with get_db() as conn:
        charter = conn.execute(
            "SELECT * FROM charters WHERE project_id = ? AND is_current = 1",
            (project_id,),
        ).fetchone()
        if not charter:
            raise HTTPException(status_code=404, detail="No active charter found for this project.")

        accepted = False
        if user:
            acc = conn.execute(
                """
                SELECT * FROM charter_acceptances
                WHERE project_id = ? AND user_id = ? AND version = ? AND engagement_model_accepted = 1
                """,
                (project_id, user["id"], charter["version"]),
            ).fetchone()
            accepted = bool(acc)

        return {
            "charter": {
                "id": charter["id"],
                "project_id": charter["project_id"],
                "version": charter["version"],
                "engagement_model": charter["engagement_model"],
                "scope": charter["scope"],
                "ip_clause": charter["ip_clause"],
                "confidentiality_clause": charter["confidentiality_clause"],
                "exit_terms": charter["exit_terms"],
                "commercialisation_clause": charter["commercialisation_clause"],
                "split_config": json.loads(charter["split_config_json"]),
                "is_current": bool(charter["is_current"]),
            },
            "user_accepted_current_version": accepted,
        }


@app.post("/api/projects/{project_id}/charter/accept")
async def post_accept_charter(
    project_id: str,
    req: CharterAcceptRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    return accept_charter(
        project_id=project_id,
        user_id=user["id"],
        version=req.version,
        accept_engagement_model=req.accept_engagement_model,
    )


@app.post("/api/projects/{project_id}/charter")
async def post_publish_charter(
    project_id: str,
    req: CharterPublishRequest,
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    split_cfg = req.split_config or {
        "platform_fee_pct": 0.10,
        "ai_reserve_pct": 0.05,
        "expert_pool_pct": 0.30,
        "student_pool_pct": 0.70,
        "student_weights": DEFAULT_STUDENT_WEIGHTS,
    }
    return publish_or_update_charter(
        project_id=project_id,
        actor_id=user["id"],
        scope=req.scope,
        ip_clause=req.ip_clause,
        confidentiality_clause=req.confidentiality_clause,
        exit_terms=req.exit_terms,
        commercialisation_clause=req.commercialisation_clause,
        split_config=split_cfg,
        engagement_model=req.engagement_model,
    )


# ===================== Role Protected Routes (Testing RBAC) =====================
@app.post("/api/sponsor/projects/create")
async def sponsor_create_project(
    data: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_role("sponsor")),
):
    return {"status": "ok", "message": "Sponsor project creation authorized"}


@app.post("/api/sponsor/withdraw")
async def sponsor_withdraw_project(
    data: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_role("sponsor")),
):
    return {"status": "ok", "message": "Sponsor withdrawal authorized"}


@app.get("/api/admin/audit")
async def admin_audit(
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    return {"status": "ok", "message": "Admin audit access granted"}


@app.post("/api/admin/reset")
async def admin_reset(
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    from backend.seed import seed_database
    seed_database()
    return {"status": "ok", "message": "Demo data reset successfully"}


# ===================== Payout Calculator =====================
@app.post("/api/payout/calculate")
async def post_calculate_payout(req: PayoutCalcRequest):
    return calculate_milestone_payout(
        amount=req.amount,
        student_weights=req.student_weights,
        expert_present=req.expert_present,
    )


# Mount static files if directory exists
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
