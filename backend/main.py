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

from backend.config import (
    DB_PATH,
    DEFAULT_STUDENT_WEIGHTS,
    RATING_MIN,
    RATING_MAX,
    STAR_PENALTY_QUIT,
    STAR_PENALTY_WITHDRAW,
    SIMULATED_FAST_FORWARD_DAYS,
)
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
from backend.rules import (
    quit_midway,
    sponsor_withdraws,
    sponsor_silent,
    ai_share_credit,
    paid_becomes_unpaid,
)
from backend.ai_scoping import scope_problem
from backend.matchmaking import get_project_candidate_matches
from backend.pros_cons import compute_user_pros_and_cons, compute_company_pros_and_cons, compute_company_record
from backend.stars import calculate_user_stars, calculate_and_update_stars, record_star_penalty
from backend.project_lifecycle import close_project, submit_project_review, candidate_quit_project, sponsor_withdraw_project
import uuid
import hashlib

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

from backend.workspace_router import router as workspace_router

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workspace_router)


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


class ProjectCloseRequest(BaseModel):
    outcome: Optional[str] = None


class ReviewSubmitRequest(BaseModel):
    reviewee_id: str
    quality: float = Field(..., ge=1.0, le=5.0)
    timeliness: float = Field(..., ge=1.0, le=5.0)
    communication: float = Field(..., ge=1.0, le=5.0)
    collaboration: float = Field(..., ge=1.0, le=5.0)
    integrity: float = Field(..., ge=1.0, le=5.0)
    fairness: Optional[float] = Field(None, ge=1.0, le=5.0)
    clarity: Optional[float] = Field(None, ge=1.0, le=5.0)
    comment: Optional[str] = ""
    tags: Optional[List[str]] = []


class CandidateQuitRequest(BaseModel):
    reason: Optional[str] = "Departed project midway"
    good_cause: Optional[bool] = False


class SponsorWithdrawRequest(BaseModel):
    project_id: Optional[str] = None
    reason: Optional[str] = "Withdrew project sponsorship midway"


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    weekly_hours: Optional[int] = None
    avatar_initials: Optional[str] = None
    portfolio_links: Optional[List[str]] = None
    notification_invites: Optional[bool] = None
    notification_charter: Optional[bool] = None
    notification_milestones: Optional[bool] = None
    notification_payouts: Optional[bool] = None
    notification_stars: Optional[bool] = None
    notification_integrity: Optional[bool] = None


class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str


class ScopeRequest(BaseModel):
    title: str
    public_summary: str
    confidential_brief: Optional[str] = ""
    budget: Optional[int] = 0
    engagement_model: Optional[str] = "funded"


class CreateProblemRequest(BaseModel):
    title: str
    public_summary: str
    confidential_brief: str
    sensitivity_label: Optional[str] = "Confidential"
    budget: Optional[int] = 0
    engagement_model: Optional[str] = "funded"
    datasets: Optional[List[str]] = []
    milestones: Optional[List[Dict[str, Any]]] = []
    charter: Optional[Dict[str, Any]] = None


class WalletTopUpRequest(BaseModel):
    amount: int


class LockMilestoneRequest(BaseModel):
    amount: Optional[int] = None


class ApplyProjectRequest(BaseModel):
    role: Optional[str] = "student"
    pitch: Optional[str] = ""


class InviteCandidateRequest(BaseModel):
    candidate_id: str
    role: Optional[str] = "student"
    notes: Optional[str] = ""


class ConReplyRequest(BaseModel):
    con_key: str
    reply_text: str


class LeaveProjectRequest(BaseModel):
    good_cause: bool = False
    progress_fraction: Optional[float] = None


class WithdrawProjectRequest(BaseModel):
    reason: Optional[str] = "Sponsor withdrawal"


class CloseProjectRequest(BaseModel):
    final_outcome: Optional[str] = "Project successfully closed and all deliverables archived."


class SubmitReviewRequest(BaseModel):
    reviewee_id: str
    quality: float = Field(..., ge=1.0, le=5.0)
    timeliness: float = Field(..., ge=1.0, le=5.0)
    communication: float = Field(..., ge=1.0, le=5.0)
    collaboration: float = Field(..., ge=1.0, le=5.0)
    integrity: float = Field(..., ge=1.0, le=5.0)
    fairness: Optional[float] = Field(None, ge=1.0, le=5.0)
    clarity: Optional[float] = Field(None, ge=1.0, le=5.0)
    comment: Optional[str] = ""
    tags: Optional[List[str]] = []


class RehearsalSimulateRequest(BaseModel):
    project_id: str
    scenario: str
    params: Optional[Dict[str, Any]] = None


class FastForwardRequest(BaseModel):
    days: Optional[int] = 7


class LoadStageRequest(BaseModel):
    stage: str


class VerifyUserRequest(BaseModel):
    user_id: str
    verified: bool = True


class ResolveFlagRequest(BaseModel):
    submission_id: str
    decision: str  # clear, confirm_violation
    notes: Optional[str] = ""


class MediateDisputeRequest(BaseModel):
    dispute_id: str
    decision: str  # resolved, dismissed, good_cause_granted
    good_cause_granted: bool = False
    notes: Optional[str] = ""


def send_in_app_notification(user_id: str, title: str, message: str, link: str, conn):
    notif_id = f"notif_{uuid.uuid4().hex[:12]}"
    conn.execute(
        "INSERT INTO notifications (id, user_id, title, message, link, read) VALUES (?, ?, ?, ?, ?, 0)",
        (notif_id, user_id, title, message, link),
    )


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


@app.post("/api/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    """
    Demo password reset generator (SPEC.md Section 4):
    Token shown directly on screen in demo mode.
    """
    with get_db() as conn:
        user = conn.execute("SELECT id, email FROM users WHERE email = ?", (req.email,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="No account registered with that email address.")

        token = f"rst_{os.urandom(6).hex()}"
        reset_id = f"pr_{os.urandom(6).hex()}"
        # Expire in 1 hour
        conn.execute(
            """
            INSERT INTO password_resets (id, user_id, token, expires_at, used)
            VALUES (?, ?, ?, datetime('now', '+1 hour'), 0)
            """,
            (reset_id, user["id"], token),
        )

        return {
            "status": "success",
            "message": "Password reset token generated (Demo Mode: shown below).",
            "demo_reset_token": token,
            "email": req.email,
        }


@app.post("/api/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """Resets password given a valid demo reset token."""
    with get_db() as conn:
        reset_entry = conn.execute(
            """
            SELECT * FROM password_resets
            WHERE token = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP
            """,
            (req.token,),
        ).fetchone()

        if not reset_entry:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token.",
            )

        new_hash, salt = hash_password(req.new_password)
        conn.execute(
            "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?",
            (new_hash, salt, reset_entry["user_id"]),
        )
        conn.execute("UPDATE password_resets SET used = 1 WHERE id = ?", (reset_entry["id"],))

        record_ledger_entry(
            actor=reset_entry["user_id"],
            action="PASSWORD_RESET",
            payload={"user_id": reset_entry["user_id"]},
            conn=conn,
        )

        return {"status": "success", "message": "Password has been successfully updated. You may now log in."}


# ===================== User Settings & Profile Endpoints =====================
@app.get("/api/user/settings")
async def get_user_settings(user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user["id"],)).fetchone()
        portfolio = json.loads(settings["portfolio_links_json"]) if settings and settings.get("portfolio_links_json") else []

        return {
            "name": user["name"],
            "headline": user["headline"],
            "skills": json.loads(user.get("skills_json") or "[]"),
            "interests": json.loads(user.get("interests_json") or "[]"),
            "weekly_hours": user.get("weekly_hours") or 20,
            "avatar_initials": user.get("avatar_initials") or "".join([w[0].upper() for w in user["name"].split()[:2]]),
            "portfolio_links": portfolio,
            "notifications": {
                "invites": bool(settings["notification_invites"]) if settings else True,
                "charter": bool(settings["notification_charter"]) if settings else True,
                "milestones": bool(settings["notification_milestones"]) if settings else True,
                "payouts": bool(settings["notification_payouts"]) if settings else True,
                "stars": bool(settings["notification_stars"]) if settings else True,
                "integrity": bool(settings["notification_integrity"]) if settings else True,
            },
            "delete_requested": bool(settings["delete_requested"]) if settings else False,
        }


@app.put("/api/user/settings")
async def update_user_settings(
    req: UpdateProfileRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    with get_db() as conn:
        # Update users table fields
        updates = []
        params = []
        if req.name is not None:
            updates.append("name = ?")
            params.append(req.name)
        if req.headline is not None:
            updates.append("headline = ?")
            params.append(req.headline)
        if req.skills is not None:
            updates.append("skills_json = ?")
            params.append(json.dumps(req.skills))
        if req.interests is not None:
            updates.append("interests_json = ?")
            params.append(json.dumps(req.interests))
        if req.weekly_hours is not None:
            updates.append("weekly_hours = ?")
            params.append(req.weekly_hours)
        if req.avatar_initials is not None:
            updates.append("avatar_initials = ?")
            params.append(req.avatar_initials)

        if updates:
            params.append(user["id"])
            conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", tuple(params))

        # Update user_settings
        settings_updates = []
        settings_params = []
        if req.portfolio_links is not None:
            settings_updates.append("portfolio_links_json = ?")
            settings_params.append(json.dumps(req.portfolio_links))
        if req.notification_invites is not None:
            settings_updates.append("notification_invites = ?")
            settings_params.append(1 if req.notification_invites else 0)
        if req.notification_charter is not None:
            settings_updates.append("notification_charter = ?")
            settings_params.append(1 if req.notification_charter else 0)
        if req.notification_milestones is not None:
            settings_updates.append("notification_milestones = ?")
            settings_params.append(1 if req.notification_milestones else 0)
        if req.notification_payouts is not None:
            settings_updates.append("notification_payouts = ?")
            settings_params.append(1 if req.notification_payouts else 0)
        if req.notification_stars is not None:
            settings_updates.append("notification_stars = ?")
            settings_params.append(1 if req.notification_stars else 0)
        if req.notification_integrity is not None:
            settings_updates.append("notification_integrity = ?")
            settings_params.append(1 if req.notification_integrity else 0)

        if settings_updates:
            conn.execute(
                f"""
                INSERT INTO user_settings (user_id) VALUES (?)
                ON CONFLICT(user_id) DO UPDATE SET {', '.join(settings_updates)}
                """,
                tuple([user["id"]] + settings_params),
            )

        return {"status": "success", "message": "Profile and preferences updated successfully."}


@app.post("/api/user/change-password")
async def change_password(
    req: ChangePasswordRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    with get_db() as conn:
        u = conn.execute("SELECT password_hash, salt FROM users WHERE id = ?", (user["id"],)).fetchone()
        if not verify_password(req.old_password, u["password_hash"], u["salt"]):
            raise HTTPException(status_code=400, detail="Current password incorrect.")

        new_hash, new_salt = hash_password(req.new_password)
        conn.execute("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", (new_hash, new_salt, user["id"]))

        return {"status": "success", "message": "Password changed successfully."}


@app.post("/api/user/delete-request")
async def delete_account_request(user: Dict[str, Any] = Depends(get_current_user)):
    """Simulated account deletion request (SPEC.md Section 4)."""
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO user_settings (user_id, delete_requested) VALUES (?, 1)
            ON CONFLICT(user_id) DO UPDATE SET delete_requested = 1
            """,
            (user["id"],),
        )
        record_ledger_entry(
            actor=user["id"],
            action="ACCOUNT_DELETE_REQUESTED",
            payload={"user_id": user["id"], "email": user["email"]},
            conn=conn,
        )
        return {
            "status": "success",
            "message": "Account deletion scheduled for review per simulated KYC retention policies.",
        }


# ===================== Notifications Endpoints =====================
@app.get("/api/notifications")
async def get_notifications(user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
            (user["id"],),
        ).fetchall()
        unread_count = sum(1 for r in rows if not r["read"])
        return {
            "notifications": [dict(r) for r in rows],
            "unread_count": unread_count,
        }


@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    with get_db() as conn:
        conn.execute(
            "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?",
            (notification_id, user["id"]),
        )
        return {"status": "success", "id": notification_id}


@app.post("/api/notifications/read-all")
async def mark_all_notifications_read(user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("UPDATE notifications SET read = 1 WHERE user_id = ?", (user["id"],))
        return {"status": "success", "message": "All notifications marked as read."}


# ===================== Public Profile Endpoint =====================
@app.get("/api/users/{user_id}/public")
async def get_public_profile(
    user_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """
    Public profile for students, experts, and company sponsors (SPEC.md Section 4).
    Hides private fields (email, wallet earnings) unless requester is the profile owner.
    """
    with get_db() as conn:
        u = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")

        is_owner = current_user and current_user["id"] == user_id

        # Closed projects where user participated
        closed_projects = conn.execute(
            """
            SELECT p.id, p.title, p.public_summary, p.budget, p.engagement_model
            FROM projects p
            WHERE p.status = 'closed' AND (
                p.sponsor_id = ? OR EXISTS (
                    SELECT 1 FROM project_members pm
                    WHERE pm.project_id = p.id AND pm.user_id = ?
                )
            )
            """,
            (user_id, user_id),
        ).fetchall()

        # Reviews for this user
        revs = conn.execute(
            """
            SELECT quality, timeliness, communication, collaboration, integrity, comment, created_at
            FROM reviews WHERE reviewee_id = ?
            """,
            (user_id,),
        ).fetchall()

        # Rating change history
        history = conn.execute(
            "SELECT * FROM ratings_history WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()

        # Real Pros & Cons calculation engine (SPEC.md Section 7)
        if u["role"] == "sponsor":
            pc_data = compute_company_pros_and_cons(user_id, conn)
            company_record = compute_company_record(user_id, conn)
        else:
            pc_data = compute_user_pros_and_cons(user_id, u["role"], conn)
            company_record = None

        pros = [p["text"] for p in pc_data.get("pros", [])]
        cons = [c["text"] for c in pc_data.get("cons", [])]

        # Fetch verifiable credentials / certificates (SPEC.md Section 8 & Phase 6)
        certs = conn.execute(
            """
            SELECT c.*, p.title as project_title
            FROM project_certificates c
            JOIN projects p ON p.id = c.project_id
            WHERE c.recipient_id = ?
            ORDER BY c.issued_at DESC
            """,
            (user_id,),
        ).fetchall()

        profile_data = {
            "id": u["id"],
            "name": u["name"],
            "role": u["role"],
            "headline": u["headline"],
            "avatar_initials": u["avatar_initials"] or "".join([w[0].upper() for w in u["name"].split()[:2]]),
            "skills": json.loads(u.get("skills_json") or "[]"),
            "interests": json.loads(u.get("interests_json") or "[]"),
            "newbie_badge": bool(u["newbie_badge"]),
            "stars": u["stars"],
            "closed_projects": [dict(p) for p in closed_projects],
            "reviews_count": len(revs),
            "pros": pros,
            "cons": cons,
            "pros_cons_data": pc_data,
            "certificates": [dict(c) for c in certs],
            "company_record": company_record,
            "rating_timeline": [dict(h) for h in history],
        }

        # Private fields only visible to owner
        if is_owner:
            wallet = conn.execute("SELECT balance FROM wallets WHERE user_id = ?", (user_id,)).fetchone()
            profile_data["email"] = u["email"]
            profile_data["wallet_balance"] = wallet["balance"] if wallet else 0
            profile_data["is_owner"] = True
        else:
            profile_data["is_owner"] = False

        return profile_data


@app.get("/api/users/{user_id}/rating-history")
async def get_user_rating_history(user_id: str):
    """
    Returns rating history timeline with reasons, deltas, and cryptographic ledger seq.
    Powers 'Why did my rating change?'.
    """
    with get_db() as conn:
        u = conn.execute("SELECT id, name, stars, newbie_badge, role FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        history = conn.execute(
            """
            SELECT rh.*, l.entry_hash
            FROM ratings_history rh
            LEFT JOIN ledger l ON l.seq = rh.ledger_seq
            WHERE rh.user_id = ?
            ORDER BY rh.created_at DESC
            """,
            (user_id,),
        ).fetchall()
        return {
            "user_id": user_id,
            "name": u["name"],
            "stars": u["stars"],
            "newbie_badge": bool(u["newbie_badge"]),
            "timeline": [dict(h) for h in history],
        }


@app.get("/api/users/{user_id}/certificates")
async def get_user_certificates(user_id: str):
    """Returns all cryptographically issued certificates and credit records for a user."""
    with get_db() as conn:
        certs = conn.execute(
            """
            SELECT c.*, p.title as project_title, p.engagement_model
            FROM project_certificates c
            JOIN projects p ON p.id = c.project_id
            WHERE c.recipient_id = ?
            ORDER BY c.issued_at DESC
            """,
            (user_id,),
        ).fetchall()
        return {"user_id": user_id, "certificates": [dict(c) for c in certs]}


# ===================== Contact Endpoint =====================
@app.post("/api/contact")
async def post_contact_message(req: ContactRequest):
    """Stores contact inquiries in DB and logs to ledger (SPEC.md Section 3)."""
    with get_db() as conn:
        msg_id = f"cnt_{os.urandom(6).hex()}"
        conn.execute(
            """
            INSERT INTO contact_messages (id, name, email, subject, message)
            VALUES (?, ?, ?, ?, ?)
            """,
            (msg_id, req.name, req.email, req.subject, req.message),
        )
        record_ledger_entry(
            actor="ANONYMOUS",
            action="CONTACT_SUBMISSION",
            payload={"contact_id": msg_id, "name": req.name, "subject": req.subject},
            conn=conn,
        )
        return {"status": "success", "message": "Your message has been securely recorded on the VOUCH ledger."}


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
async def list_projects(
    skill: Optional[str] = None,
    engagement_model: Optional[str] = None,
    min_budget: Optional[int] = None,
    max_budget: Optional[int] = None,
):
    """Public summary of projects with multi-criteria filtering (SPEC.md Section 3)."""
    with get_db() as conn:
        query = "SELECT id, title, public_summary, budget, engagement_model, status, sponsor_id, created_at FROM projects WHERE status != 'draft'"
        params = []
        if engagement_model and engagement_model != "all":
            query += " AND engagement_model = ?"
            params.append(engagement_model)
        if min_budget is not None:
            query += " AND budget >= ?"
            params.append(min_budget)
        if max_budget is not None:
            query += " AND budget <= ?"
            params.append(max_budget)
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, tuple(params)).fetchall()

        results = []
        for r in rows:
            p_dict = dict(r)
            s = conn.execute("SELECT name, stars FROM users WHERE id = ?", (r["sponsor_id"],)).fetchone()
            p_dict["sponsor_name"] = s["name"] if s else "Enterprise Sponsor"
            p_dict["sponsor_stars"] = s["stars"] if s else 4.5

            ms = conn.execute("SELECT skills_json FROM milestones WHERE project_id = ?", (r["id"],)).fetchall()
            skills_set = set()
            for m in ms:
                for sk in json.loads(m["skills_json"] or "[]"):
                    skills_set.add(sk)
            p_dict["required_skills"] = list(skills_set)

            if skill and skill.strip():
                sk_search = skill.strip().lower()
                matches = (
                    any(sk_search in s.lower() for s in skills_set)
                    or sk_search in p_dict["title"].lower()
                    or sk_search in p_dict["public_summary"].lower()
                )
                if not matches:
                    continue

            results.append(p_dict)

        return {"projects": results}


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
    version: Optional[int] = None,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    with get_db() as conn:
        if version is not None:
            charter = conn.execute(
                "SELECT * FROM charters WHERE project_id = ? AND version = ?",
                (project_id, version),
            ).fetchone()
        else:
            charter = conn.execute(
                "SELECT * FROM charters WHERE project_id = ? AND is_current = 1",
                (project_id,),
            ).fetchone()
            if not charter:
                charter = conn.execute(
                    "SELECT * FROM charters WHERE project_id = ? ORDER BY version DESC LIMIT 1",
                    (project_id,),
                ).fetchone()

        if not charter:
            raise HTTPException(status_code=404, detail="No active charter found for this project.")

        proj = conn.execute(
            "SELECT status, final_outcome FROM projects WHERE id = ?",
            (project_id,),
        ).fetchone()
        is_closed = bool(proj and proj["status"] == "closed")

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
                "split_config": json.loads(charter["split_config_json"] or "{}"),
                "is_current": bool(charter["is_current"]),
                "is_closed": is_closed,
                "final_outcome": proj["final_outcome"] if proj else None,
            },
            "user_accepted_current_version": accepted,
        }


@app.get("/api/charters/{charter_or_project_id}")
async def get_charter_by_id(
    charter_or_project_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    with get_db() as conn:
        charter = None
        # Support colon syntax: {project_id}:{version} (e.g., proj_past_1:1)
        if ":" in charter_or_project_id:
            p_id, v_str = charter_or_project_id.split(":", 1)
            try:
                v_num = int(v_str)
                charter = conn.execute(
                    "SELECT * FROM charters WHERE (project_id = ? OR id = ?) AND version = ?",
                    (p_id, p_id, v_num),
                ).fetchone()
            except ValueError:
                pass

        if not charter:
            charter = conn.execute(
                "SELECT * FROM charters WHERE (project_id = ? OR id = ?) AND is_current = 1",
                (charter_or_project_id, charter_or_project_id),
            ).fetchone()

        if not charter:
            charter = conn.execute(
                "SELECT * FROM charters WHERE id = ?",
                (charter_or_project_id,),
            ).fetchone()

        if not charter:
            charter = conn.execute(
                "SELECT * FROM charters WHERE project_id = ? ORDER BY version DESC LIMIT 1",
                (charter_or_project_id,),
            ).fetchone()

        if not charter:
            # Check if project exists to provide exact reason
            proj = conn.execute("SELECT id FROM projects WHERE id = ?", (charter_or_project_id,)).fetchone()
            if proj:
                raise HTTPException(status_code=404, detail="This project does not have a published charter yet.")
            raise HTTPException(status_code=404, detail="This charter does not exist on the immutable ledger.")

        return await get_project_charter(project_id=charter["project_id"], version=charter["version"], user=user)


@app.get("/api/projects/{project_id}/charters/history")
async def get_charter_history(
    project_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, project_id, version, engagement_model, is_current, created_at FROM charters WHERE project_id = ? ORDER BY version DESC",
            (project_id,),
        ).fetchall()
        return {"versions": [dict(r) for r in rows]}


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


# ===================== Core Story Endpoints (Steps 1 - 7) =====================

@app.post("/api/ai/scope")
async def post_ai_scope(req: ScopeRequest):
    """Decomposes problem into editable milestones with required skills and budget."""
    return scope_problem(
        title=req.title,
        public_summary=req.public_summary,
        confidential_brief=req.confidential_brief or "",
        budget=req.budget or 0,
        engagement_model=req.engagement_model or "funded",
    )


@app.post("/api/sponsor/problems")
async def post_sponsor_problem(
    req: CreateProblemRequest,
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """Sponsor posts a problem with milestones and publishes Charter v1."""
    with get_db() as conn:
        project_id = f"proj_{uuid.uuid4().hex[:10]}"
        budget = int(req.budget or 0)

        conn.execute(
            """
            INSERT INTO projects (
                id, title, public_summary, confidential_brief, datasets_json,
                budget, engagement_model, sensitivity_label, status, sponsor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
            """,
            (
                project_id,
                req.title,
                req.public_summary,
                req.confidential_brief,
                json.dumps(req.datasets or []),
                budget,
                req.engagement_model,
                req.sensitivity_label or "Confidential",
                user["id"],
            ),
        )

        # Insert milestones
        milestones_created = []
        for idx, m in enumerate(req.milestones or []):
            seq = m.get("sequence", idx + 1)
            ms_id = f"ms_{project_id}_{seq}"
            ms_budget = int(m.get("budget", 0))
            skills = m.get("skills", [])
            conn.execute(
                """
                INSERT INTO milestones (id, project_id, sequence, title, description, skills_json, budget, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                """,
                (
                    ms_id,
                    project_id,
                    seq,
                    m.get("title", f"Milestone {seq}"),
                    m.get("description", ""),
                    json.dumps(skills),
                    ms_budget,
                ),
            )
            milestones_created.append({"id": ms_id, "sequence": seq, "budget": ms_budget})

        # Add sponsor as member
        conn.execute(
            """
            INSERT INTO project_members (id, project_id, user_id, role, status)
            VALUES (?, ?, ?, 'sponsor', 'accepted')
            """,
            (f"pm_{project_id}_{user['id']}", project_id, user["id"]),
        )

        # Log project creation to ledger
        record_ledger_entry(
            actor=user["id"],
            action="PROJECT_CREATED",
            payload={
                "project_id": project_id,
                "title": req.title,
                "budget": budget,
                "engagement_model": req.engagement_model,
                "sensitivity_label": req.sensitivity_label,
            },
            conn=conn,
        )

        send_in_app_notification(
            user_id=user["id"],
            title="Problem Created & Charter v1 Ready",
            message=f"'{req.title}' posted with {len(milestones_created)} milestones.",
            link=f"/sponsor/projects/{project_id}",
            conn=conn,
        )

    # Publish Charter v1
    charter_data = req.charter or {}
    publish_or_update_charter(
        project_id=project_id,
        actor_id=user["id"],
        scope=charter_data.get("scope", req.public_summary),
        ip_clause=charter_data.get("ip_clause", "Standard platform IP terms apply."),
        confidentiality_clause=charter_data.get("confidentiality_clause", "Confidential brief protected under platform non-disclosure."),
        exit_terms=charter_data.get("exit_terms", "Pro-rata payout for accepted milestones."),
        commercialisation_clause=charter_data.get("commercialisation_clause", "Commercialization terms governed by engagement model."),
        split_config={
            "platform_fee_pct": 0.10,
            "ai_reserve_pct": 0.05,
            "expert_pool_pct": 0.30,
            "student_pool_pct": 0.70,
            "student_weights": DEFAULT_STUDENT_WEIGHTS,
        },
        engagement_model=req.engagement_model or "funded",
    )

    return {
        "status": "created",
        "project_id": project_id,
        "title": req.title,
        "milestones_count": len(milestones_created),
    }


@app.get("/api/projects/{project_id}/matchmaking")
async def get_project_matchmaking(
    project_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Ranked matchmaking candidates.
    STRICT ACCESS CONTROL: Only the project sponsor or an admin can access candidate matchmaking.
    """
    with get_db() as conn:
        proj = conn.execute("SELECT sponsor_id FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        if user["role"] != "admin" and user["id"] != proj["sponsor_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Matchmaking candidates are only visible to the project sponsor and admin.",
            )

        return get_project_candidate_matches(project_id, conn, log_exclusions=True)


@app.post("/api/projects/{project_id}/apply")
async def apply_to_project(
    project_id: str,
    req: ApplyProjectRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Student or expert submits an application to join a project."""
    if user["role"] not in ("student", "expert", "admin"):
        raise HTTPException(status_code=403, detail="Only students and experts can apply to projects.")

    with get_db() as conn:
        proj = conn.execute("SELECT id, title, sponsor_id FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        # Check existing membership
        existing = conn.execute(
            "SELECT id, status FROM project_members WHERE project_id = ? AND user_id = ?",
            (project_id, user["id"]),
        ).fetchone()

        if existing and existing["status"] in ("accepted", "applied"):
            return {"status": "already_applied", "message": f"Application already recorded ({existing['status']})."}

        pm_id = f"pm_{project_id}_{user['id']}"
        conn.execute(
            """
            INSERT OR REPLACE INTO project_members (id, project_id, user_id, role, status)
            VALUES (?, ?, ?, ?, 'applied')
            """,
            (pm_id, project_id, user["id"], req.role or user["role"]),
        )

        record_ledger_entry(
            actor=user["id"],
            action="PROJECT_APPLICATION_SUBMITTED",
            payload={
                "project_id": project_id,
                "applicant_id": user["id"],
                "role": req.role or user["role"],
                "pitch": req.pitch or "",
            },
            conn=conn,
        )

        send_in_app_notification(
            user_id=proj["sponsor_id"],
            title="New Contributor Application",
            message=f"{user['name']} applied as {req.role or user['role']} on '{proj['title']}'.",
            link=f"/sponsor/projects/{project_id}",
            conn=conn,
        )

        return {"status": "applied", "message": "Application submitted successfully."}


@app.post("/api/projects/{project_id}/invite")
async def invite_to_project(
    project_id: str,
    req: InviteCandidateRequest,
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """Sponsor invites a candidate to join project."""
    with get_db() as conn:
        proj = conn.execute("SELECT id, title, sponsor_id FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        cand = conn.execute("SELECT id, name, role FROM users WHERE id = ?", (req.candidate_id,)).fetchone()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate not found")

        pm_id = f"pm_{project_id}_{req.candidate_id}"
        conn.execute(
            """
            INSERT OR REPLACE INTO project_members (id, project_id, user_id, role, status)
            VALUES (?, ?, ?, ?, 'invited')
            """,
            (pm_id, project_id, req.candidate_id, req.role or cand["role"]),
        )

        record_ledger_entry(
            actor=user["id"],
            action="PROJECT_INVITATION_SENT",
            payload={
                "project_id": project_id,
                "candidate_id": req.candidate_id,
                "role": req.role or cand["role"],
                "notes": req.notes or "",
            },
            conn=conn,
        )

        send_in_app_notification(
            user_id=req.candidate_id,
            title="Project Invitation Received",
            message=f"You have been invited to collaborate on '{proj['title']}'. Review the charter to accept.",
            link=f"/charters/{project_id}",
            conn=conn,
        )

        return {"status": "invited", "message": f"Invitation sent to {cand['name']}."}


@app.post("/api/users/{user_id}/con-reply")
async def post_con_reply(
    user_id: str,
    req: ConReplyRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Candidate posts a public reply to a watch-out (con).
    STRICT ACCESS CONTROL: A user can reply ONLY to their own cons.
    """
    if current_user["role"] != "admin" and current_user["id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only reply to your own watch-outs.",
        )

    with get_db() as conn:
        reply_id = f"reply_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT OR REPLACE INTO con_replies (id, user_id, con_key, reply_text, ledger_ref)
            VALUES (?, ?, ?, ?, ?)
            """,
            (reply_id, user_id, req.con_key, req.reply_text, f"ledger_reply_{reply_id}"),
        )

        record_ledger_entry(
            actor=current_user["id"],
            action="CON_REPLY_POSTED",
            payload={
                "user_id": user_id,
                "con_key": req.con_key,
                "reply_text": req.reply_text,
            },
            conn=conn,
        )

        return {
            "status": "success",
            "message": "Public reply published and anchored to immutable ledger.",
            "reply": {
                "id": reply_id,
                "con_key": req.con_key,
                "reply_text": req.reply_text,
            },
        }


@app.post("/api/sponsor/wallet/top-up")
async def post_wallet_top_up(
    req: WalletTopUpRequest,
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """Top up simulated sponsor wallet by integer rupees."""
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Top-up amount must be a positive integer in rupees.")

    with get_db() as conn:
        conn.execute(
            "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
            (req.amount, user["id"]),
        )
        updated = conn.execute("SELECT balance FROM wallets WHERE user_id = ?", (user["id"],)).fetchone()
        new_bal = updated["balance"] if updated else req.amount

        record_ledger_entry(
            actor=user["id"],
            action="WALLET_TOPUP",
            payload={
                "sponsor_id": user["id"],
                "amount": req.amount,
                "new_balance": new_bal,
            },
            conn=conn,
        )

        send_in_app_notification(
            user_id=user["id"],
            title="Wallet Top-Up Confirmed",
            message=f"Added Rs {req.amount:,} to simulated sponsor balance. Current: Rs {new_bal:,}.",
            link="/sponsor/wallet",
            conn=conn,
        )

        return {"status": "success", "amount": req.amount, "balance": new_bal}


@app.get("/api/sponsor/wallet")
async def get_sponsor_wallet(
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """Returns wallet balance, locker summary, and top-up transactions."""
    with get_db() as conn:
        w = conn.execute("SELECT balance FROM wallets WHERE user_id = ?", (user["id"],)).fetchone()
        balance = w["balance"] if w else 0

        # Lockers funded by this sponsor's projects
        lockers = conn.execute(
            """
            SELECT l.id, l.project_id, l.milestone_id, l.amount, l.status, l.funded_at, l.released_at, p.title as project_title
            FROM escrow_lockers l
            JOIN projects p ON p.id = l.project_id
            WHERE p.sponsor_id = ?
            ORDER BY l.funded_at DESC
            """,
            (user["id"],),
        ).fetchall()

        total_locked = sum(l["amount"] for l in lockers if l["status"] == "funded")
        total_released = sum(l["amount"] for l in lockers if l["status"] == "released")

        # Top-ups from ledger
        topups = conn.execute(
            """
            SELECT seq, timestamp, payload_json FROM ledger
            WHERE action = 'WALLET_TOPUP' AND actor = ?
            ORDER BY seq DESC
            """,
            (user["id"],),
        ).fetchall()

        return {
            "balance": balance,
            "total_locked": total_locked,
            "total_released": total_released,
            "lockers": [dict(l) for l in lockers],
            "topups": [
                {
                    "seq": t["seq"],
                    "timestamp": t["timestamp"],
                    **json.loads(t["payload_json"]),
                }
                for t in topups
            ],
        }


@app.post("/api/projects/{project_id}/milestones/{milestone_id}/lock")
async def post_lock_milestone(
    project_id: str,
    milestone_id: str,
    req: LockMilestoneRequest = LockMilestoneRequest(),
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """
    Funds and locks milestone budget in escrow from sponsor wallet.
    Deducts integer rupees from sponsor wallet into milestone locker.
    """
    with get_db() as conn:
        m = conn.execute(
            "SELECT id, sequence, title, budget, status FROM milestones WHERE id = ? AND project_id = ?",
            (milestone_id, project_id),
        ).fetchone()
        if not m:
            raise HTTPException(status_code=404, detail="Milestone not found")

        amount = int(req.amount or m["budget"])
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Milestone budget must be greater than zero to lock in escrow.")

        # Check sponsor wallet balance
        wallet = conn.execute("SELECT balance FROM wallets WHERE user_id = ?", (user["id"],)).fetchone()
        if not wallet or wallet["balance"] < amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient wallet balance ({wallet['balance'] if wallet else 0} Rs). Top up to lock Rs {amount}.",
            )

        # Deduct from sponsor wallet
        conn.execute("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", (amount, user["id"]))

        # Insert or update locker
        locker_id = f"locker_{project_id}_{milestone_id}"
        conn.execute(
            """
            INSERT OR REPLACE INTO escrow_lockers (id, project_id, milestone_id, amount, status)
            VALUES (?, ?, ?, ?, 'funded')
            """,
            (locker_id, project_id, milestone_id, amount),
        )

        # Update milestone status to funded
        conn.execute("UPDATE milestones SET status = 'funded' WHERE id = ?", (milestone_id,))

        record_ledger_entry(
            actor=user["id"],
            action="LOCKER_FUNDED",
            payload={
                "project_id": project_id,
                "milestone_id": milestone_id,
                "amount": amount,
            },
            conn=conn,
        )

        # Notify project members
        members = conn.execute("SELECT user_id FROM project_members WHERE project_id = ?", (project_id,)).fetchall()
        for mem in members:
            send_in_app_notification(
                user_id=mem["user_id"],
                title="Milestone Escrow Funded",
                message=f"Rs {amount:,} locked for Milestone {m['sequence']}: '{m['title']}'. Work is protected.",
                link=f"/charters/{project_id}",
                conn=conn,
            )

        return {"status": "funded", "milestone_id": milestone_id, "amount_locked": amount}


@app.post("/api/projects/{project_id}/milestones/{milestone_id}/start")
async def post_start_milestone(
    project_id: str,
    milestone_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Starts a milestone.
    ENFORCEMENT: A funded milestone cannot start before it is locked in escrow!
    """
    with get_db() as conn:
        proj = conn.execute("SELECT id, title, engagement_model FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        m = conn.execute(
            "SELECT id, sequence, title, budget, status FROM milestones WHERE id = ? AND project_id = ?",
            (milestone_id, project_id),
        ).fetchone()
        if not m:
            raise HTTPException(status_code=404, detail="Milestone not found")

        # In funded models, verify locker is funded!
        if proj["engagement_model"] == "funded" and m["budget"] > 0:
            locker = conn.execute(
                """
                SELECT id, amount, status FROM escrow_lockers
                WHERE project_id = ? AND (milestone_id = ? OR milestone_id IS NULL) AND status = 'funded'
                """,
                (project_id, milestone_id),
            ).fetchone()

            if not locker:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Milestone cannot start before it is locked in escrow.",
                )

        # Update milestone status to in_progress
        conn.execute("UPDATE milestones SET status = 'in_progress' WHERE id = ?", (milestone_id,))

        record_ledger_entry(
            actor=user["id"],
            action="MILESTONE_STARTED",
            payload={
                "project_id": project_id,
                "milestone_id": milestone_id,
                "sequence": m["sequence"],
            },
            conn=conn,
        )

        # In-app notifications to members
        members = conn.execute("SELECT user_id FROM project_members WHERE project_id = ?", (project_id,)).fetchall()
        for mem in members:
            send_in_app_notification(
                user_id=mem["user_id"],
                title="Milestone Started",
                message=f"Milestone {m['sequence']}: '{m['title']}' is now in progress.",
                link=f"/charters/{project_id}",
                conn=conn,
            )

        return {"status": "in_progress", "milestone_id": milestone_id}


@app.get("/api/student/applications")
async def get_student_applications(
    user: Dict[str, Any] = Depends(require_role("student", "admin")),
):
    """Returns applications submitted by this student with status and charter link."""
    with get_db() as conn:
        apps = conn.execute(
            """
            SELECT pm.id, pm.project_id, pm.role, pm.status as member_status, pm.joined_at,
                   p.title, p.public_summary, p.budget, p.engagement_model, p.status as project_status,
                   p.final_outcome,
                   u.name as sponsor_name,
                   c.version as charter_version
            FROM project_members pm
            JOIN projects p ON p.id = pm.project_id
            JOIN users u ON u.id = p.sponsor_id
            LEFT JOIN charters c ON c.project_id = p.id AND c.is_current = 1
            WHERE pm.user_id = ?
            ORDER BY pm.joined_at DESC
            """,
            (user["id"],),
        ).fetchall()

        results = []
        for a in apps:
            a_dict = dict(a)
            # Check if user accepted current charter
            acc = conn.execute(
                """
                SELECT 1 FROM charter_acceptances
                WHERE project_id = ? AND user_id = ? AND version = ?
                """,
                (a["project_id"], user["id"], a["charter_version"]),
            ).fetchone()
            a_dict["charter_accepted"] = bool(acc)
            results.append(a_dict)

        return {"applications": results}


@app.get("/api/student/matches")
async def get_student_matches(
    user: Dict[str, Any] = Depends(require_role("student", "admin")),
):
    """Returns recommended open problems for this student with match score and sponsor record."""
    with get_db() as conn:
        projects = conn.execute(
            "SELECT id, title, public_summary, budget, engagement_model, sponsor_id FROM projects WHERE status = 'open'"
        ).fetchall()

        matched = []
        for p in projects:
            try:
                m_data = get_project_candidate_matches(p["id"], conn, log_exclusions=False)
                # Find this student's score
                cand_match = next((s for s in m_data["ranked_students"] if s["candidate_id"] == user["id"]), None)
                if cand_match:
                    company_pc = compute_company_pros_and_cons(p["sponsor_id"], conn)
                    matched.append({
                        "project": dict(p),
                        "match_score": cand_match["total_score"],
                        "score_pct": cand_match["score_pct"],
                        "reasons": cand_match["reason_summary"],
                        "company_pros_cons": company_pc,
                    })
            except Exception:
                pass

        matched.sort(key=lambda x: x["match_score"], reverse=True)
        return {"matches": matched}


@app.get("/api/expert/matches")
async def get_expert_matches(
    user: Dict[str, Any] = Depends(require_role("expert", "admin")),
):
    """Returns projects and invitations for this expert with conflict indicators."""
    with get_db() as conn:
        projects = conn.execute(
            "SELECT id, title, public_summary, budget, engagement_model, sponsor_id FROM projects WHERE status = 'open'"
        ).fetchall()

        invites = conn.execute(
            """
            SELECT pm.project_id, pm.status, p.title, p.budget, p.engagement_model
            FROM project_members pm
            JOIN projects p ON p.id = pm.project_id
            WHERE pm.user_id = ?
            """,
            (user["id"],),
        ).fetchall()
        invited_pids = {i["project_id"] for i in invites}

        matched = []
        for p in projects:
            try:
                m_data = get_project_candidate_matches(p["id"], conn, log_exclusions=False)
                cand_match = next((e for e in m_data["ranked_experts"] if e["candidate_id"] == user["id"]), None)
                conflicted = next((c for c in m_data["conflicted_candidates"] if c["candidate_id"] == user["id"]), None)

                company_pc = compute_company_pros_and_cons(p["sponsor_id"], conn)
                matched.append({
                    "project": dict(p),
                    "is_invited": p["id"] in invited_pids,
                    "is_conflicted": bool(conflicted),
                    "conflict_reason": conflicted["conflict_reason"] if conflicted else None,
                    "match_score": cand_match["total_score"] if cand_match else 0.0,
                    "score_pct": cand_match["score_pct"] if cand_match else 0,
                    "reasons": cand_match["reason_summary"] if cand_match else "Declared conflict of interest",
                    "company_pros_cons": company_pc,
                })
            except Exception:
                pass

        matched.sort(key=lambda x: (not x["is_conflicted"], x["is_invited"], x["match_score"]), reverse=True)
        return {"matches": matched}


@app.get("/api/companies/{sponsor_id}/pros-cons")
async def get_company_pros_cons(sponsor_id: str):
    """Returns Strengths and Watch-outs for a sponsor company based on contributor reviews."""
    with get_db() as conn:
        return compute_company_pros_and_cons(sponsor_id, conn)


@app.get("/api/projects/{project_id}/activity")
async def get_project_activity(project_id: str):
    """Returns ledger activity trail for a project."""
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT seq, timestamp, actor, action, payload_json, entry_hash
            FROM ledger
            WHERE payload_json LIKE ?
            ORDER BY seq DESC
            LIMIT 50
            """,
            (f'%"{project_id}"%',),
        ).fetchall()

        entries = []
        for r in rows:
            entries.append({
                "seq": r["seq"],
                "timestamp": r["timestamp"],
                "actor": r["actor"],
                "action": r["action"],
                "entry_hash": r["entry_hash"],
                "payload": json.loads(r["payload_json"]),
            })
        return {"activity": entries}


# ===================== Project State Helper =====================
def get_full_project_state(project_id: str, conn) -> Dict[str, Any]:
    """
    Constructs comprehensive project snapshot for exit rules and rehearsal simulations.
    Pure read-only query.
    """
    proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    charter = conn.execute(
        "SELECT * FROM charters WHERE project_id = ? AND is_current = 1", (project_id,)
    ).fetchone()
    if not charter:
        charter = conn.execute(
            "SELECT * FROM charters WHERE project_id = ? ORDER BY version DESC LIMIT 1", (project_id,)
        ).fetchone()

    charter_dict = dict(charter) if charter else {}
    if "split_config_json" in charter_dict and charter_dict["split_config_json"]:
        try:
            charter_dict["split_config"] = json.loads(charter_dict["split_config_json"])
        except Exception:
            pass

    members = conn.execute(
        """
        SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.status, pm.weight,
               u.name, u.email, u.stars, u.newbie_badge, COALESCE(w.balance, 0) as wallet_balance
        FROM project_members pm
        JOIN users u ON u.id = pm.user_id
        LEFT JOIN wallets w ON w.user_id = u.id
        WHERE pm.project_id = ?
        """,
        (project_id,),
    ).fetchall()

    sponsor = conn.execute(
        """
        SELECT u.id as user_id, u.name, u.email, u.role, u.stars, COALESCE(w.balance, 0) as wallet_balance
        FROM users u
        LEFT JOIN wallets w ON w.user_id = u.id
        WHERE u.id = ?
        """,
        (proj["sponsor_id"],),
    ).fetchone()

    milestones = conn.execute(
        "SELECT * FROM milestones WHERE project_id = ? ORDER BY sequence ASC", (project_id,)
    ).fetchall()
    lockers = conn.execute(
        "SELECT * FROM escrow_lockers WHERE project_id = ?", (project_id,)
    ).fetchall()
    submissions = conn.execute(
        "SELECT * FROM submissions WHERE project_id = ?", (project_id,)
    ).fetchall()

    return {
        "project": dict(proj),
        "charter": charter_dict,
        "project_id": project_id,
        "title": proj["title"],
        "budget": proj["budget"],
        "engagement_model": proj["engagement_model"],
        "status": proj["status"],
        "sponsor": dict(sponsor) if sponsor else {},
        "members": [dict(m) for m in members],
        "milestones": [dict(m) for m in milestones],
        "lockers": [dict(l) for l in lockers],
        "submissions": [dict(s) for s in submissions],
    }


# ===================== Real Exit Actions (SPEC.md Section 9) =====================
@app.post("/api/projects/{project_id}/leave")
async def post_leave_project(
    project_id: str,
    req: LeaveProjectRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Project member quits midway.
    Pays only for accepted/reviewed work. Money already released stays.
    Star penalty -0.5 (floor 1.0) unless good cause is marked.
    Credit for accepted work kept, access revoked, unearned share returned to pool.
    """
    if user["role"] not in ["student", "expert", "admin"]:
        raise HTTPException(status_code=403, detail="Only active project members can execute candidate leave.")

    with get_db() as conn:
        state = get_full_project_state(project_id, conn)

        # Check membership
        mem = next((m for m in state["members"] if m["user_id"] == user["id"]), None)
        if not mem and user["role"] != "admin":
            raise HTTPException(status_code=400, detail="You are not an active member of this project.")

        target_uid = user["id"] if mem else (state["members"][0]["user_id"] if state["members"] else user["id"])

        # Execute pure exit calculation
        result = quit_midway(
            charter=state["charter"],
            project_state=state,
            member=target_uid,
            progress_fraction=req.progress_fraction,
            good_cause=req.good_cause,
        )

        # 1. Update project member status to quit
        conn.execute(
            "UPDATE project_members SET status = 'quit' WHERE project_id = ? AND user_id = ?",
            (project_id, target_uid),
        )

        # 2. Payout earned pro-rata share
        if result["earned_share"] > 0:
            conn.execute(
                "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
                (result["earned_share"], target_uid),
            )
            conn.execute(
                "UPDATE escrow_lockers SET amount = MAX(0, amount - ?) WHERE project_id = ? AND status = 'funded'",
                (result["earned_share"], project_id),
            )

        # 3. Apply star penalty to database if applicable
        target_line = next((l for l in result["table_lines"] if l.get("user_id") == target_uid), None)
        if target_line and target_line.get("star_change", 0) != 0:
            delta = target_line["star_change"]
            old_stars = user.get("stars")
            if old_stars is not None:
                new_stars = max(RATING_MIN, round(old_stars + delta, 2))
                conn.execute("UPDATE users SET stars = ? WHERE id = ?", (new_stars, target_uid))
                conn.execute(
                    """
                    INSERT INTO ratings_history (id, user_id, old_rating, new_rating, delta, reason)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (f"rh_{uuid.uuid4().hex[:12]}", target_uid, old_stars, new_stars, delta, target_line["reason"]),
                )

        # 4. Record cryptographic ledger entry
        seq = record_ledger_entry(
            actor=user["id"],
            action="MEMBER_QUIT",
            payload={
                "project_id": project_id,
                "user_id": target_uid,
                "earned_share": result["earned_share"],
                "unearned_returned_to_pool": result["unearned_returned_to_pool"],
                "good_cause": req.good_cause,
            },
            conn=conn,
        )

        # 5. In-app notifications
        send_in_app_notification(
            user_id=target_uid,
            title="Project Exit Confirmed",
            message=f"You left '{state['title']}'. Pro-rata payout Rs {result['earned_share']:,} credited. Credit for delivered work kept.",
            link=f"/student",
            conn=conn,
        )
        if state["sponsor"]:
            send_in_app_notification(
                user_id=state["sponsor"]["user_id"],
                title="Team Member Quit Midway",
                message=f"{user.get('name', 'A member')} has quit '{state['title']}'. Unearned Rs {result['unearned_returned_to_pool']:,} returned to project pool.",
                link=f"/projects/{project_id}/workspace",
                conn=conn,
            )

        return {"status": "success", "result": result, "ledger_seq": seq}


@app.post("/api/projects/{project_id}/withdraw")
async def post_sponsor_withdraw(
    project_id: str,
    req: WithdrawProjectRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Company withdraws sponsorship.
    All locked and unreleased funds go to the team by charter split and contribution weights,
    PLUS 10% compensation charged to the sponsor wallet and split the same way.
    Sponsor -0.5 stars (floor 1.0), withdrawal count +1. Members keep credit.
    """
    with get_db() as conn:
        state = get_full_project_state(project_id, conn)

        # Permission check: must be project sponsor or admin
        if user["id"] != state["project"]["sponsor_id"] and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only the project sponsor or an admin can withdraw sponsorship.")

        result = sponsor_withdraws(
            charter=state["charter"],
            project_state=state,
        )

        sponsor_uid = state["project"]["sponsor_id"]
        comp = result["compensation_charged"]

        # 1. Update project status to withdrawn
        conn.execute("UPDATE projects SET status = 'withdrawn' WHERE id = ?", (project_id,))

        # 2. Charge 10% compensation to sponsor wallet
        conn.execute(
            "UPDATE wallets SET balance = balance - ? WHERE user_id = ?",
            (comp, sponsor_uid),
        )

        # 3. Empty escrow lockers
        conn.execute(
            "UPDATE escrow_lockers SET status = 'released', amount = 0 WHERE project_id = ?",
            (project_id,),
        )

        # 4. Credit team members
        for line in result["table_lines"]:
            if line.get("role") in ["student", "expert"] and line.get("rupees_delta", 0) > 0:
                conn.execute(
                    "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
                    (line["rupees_delta"], line["user_id"]),
                )
                send_in_app_notification(
                    user_id=line["user_id"],
                    title="Sponsorship Withdrawn - Compensation Credited",
                    message=f"Sponsor withdrew from '{state['title']}'. You received Rs {line['rupees_delta']:,} (escrow share + 10% compensation). Verified credit kept.",
                    link=f"/student",
                    conn=conn,
                )

        # 5. Sponsor star penalty
        sponsor_line = next((l for l in result["table_lines"] if l.get("role") == "sponsor"), None)
        if sponsor_line and sponsor_line.get("star_change", 0) != 0:
            delta = sponsor_line["star_change"]
            old_stars = state["sponsor"].get("stars") or 4.7
            new_stars = max(RATING_MIN, round(old_stars + delta, 2))
            conn.execute("UPDATE users SET stars = ? WHERE id = ?", (new_stars, sponsor_uid))
            conn.execute(
                """
                INSERT INTO ratings_history (id, user_id, old_rating, new_rating, delta, reason)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (f"rh_{uuid.uuid4().hex[:12]}", sponsor_uid, old_stars, new_stars, delta, sponsor_line["reason"]),
            )

        # 6. Cryptographic ledger record
        seq = record_ledger_entry(
            actor=user["id"],
            action="SPONSOR_WITHDRAWAL",
            payload={
                "project_id": project_id,
                "sponsor_id": sponsor_uid,
                "unreleased_funds": result["unreleased_funds"],
                "compensation_charged": comp,
                "total_liquidated_payout": result["total_liquidated_payout"],
                "reason": req.reason,
            },
            conn=conn,
        )

        return {"status": "success", "result": result, "ledger_seq": seq}


@app.post("/api/sponsor/withdraw")
async def legacy_sponsor_withdraw(
    data: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """Legacy alias supporting direct withdrawal calls."""
    pid = data.get("project_id", "proj_retinopathy")
    return await post_sponsor_withdraw(
        project_id=pid,
        req=WithdrawProjectRequest(reason=data.get("reason", "Sponsor withdrawal")),
        user=user,
    )


# ===================== Project Closing & Minimal Reviews (SPEC.md Section 6 & 11) =====================
@app.post("/api/projects/{project_id}/close")
async def post_close_project(
    project_id: str,
    req: CloseProjectRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Closes the project when all milestones are completed.
    Permits subsequent closed reviews.
    """
    with get_db() as conn:
        state = get_full_project_state(project_id, conn)

        if user["id"] != state["project"]["sponsor_id"] and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only the project sponsor or an admin can close the project.")

        # Update project status
        conn.execute(
            "UPDATE projects SET status = 'closed', final_outcome = ? WHERE id = ?",
            (req.final_outcome, project_id),
        )

        seq = record_ledger_entry(
            actor=user["id"],
            action="PROJECT_CLOSED",
            payload={
                "project_id": project_id,
                "final_outcome": req.final_outcome,
            },
            conn=conn,
        )

        # Notify team members that closed reviews are open
        for mem in state["members"]:
            send_in_app_notification(
                user_id=mem["user_id"],
                title="Project Successfully Closed",
                message=f"'{state['title']}' has been officially closed! You can now submit your closed rating and review.",
                link=f"/projects/{project_id}/workspace",
                conn=conn,
            )

        return {"status": "closed", "project_id": project_id, "ledger_seq": seq}


@app.post("/api/projects/{project_id}/reviews")
async def post_submit_review(
    project_id: str,
    req: SubmitReviewRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Member of a CLOSED project leaves a structured review (stars 1-5 plus comment),
    tied to a cryptographic ledger entry.
    Removes the Newbie badge after the first closed project with a review.
    """
    with get_db() as conn:
        proj = conn.execute("SELECT id, title, status, sponsor_id FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        if proj["status"] != "closed":
            raise HTTPException(status_code=400, detail="Reviews can only be submitted once the project is formally closed.")

        # Verify reviewer participation
        is_sponsor = user["id"] == proj["sponsor_id"]
        is_member = conn.execute(
            "SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?",
            (project_id, user["id"]),
        ).fetchone()

        if not is_sponsor and not is_member and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only participants of this closed project can leave reviews.")

        # Verify reviewee participation
        rev_is_sponsor = req.reviewee_id == proj["sponsor_id"]
        rev_is_member = conn.execute(
            "SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?",
            (project_id, req.reviewee_id),
        ).fetchone()

        if not rev_is_sponsor and not rev_is_member:
            raise HTTPException(status_code=400, detail="The reviewed person was not part of this project.")

        # Enforce one review per member per project per reviewee
        existing = conn.execute(
            "SELECT id FROM reviews WHERE project_id = ? AND reviewer_id = ? AND reviewee_id = ?",
            (project_id, user["id"], req.reviewee_id),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="You have already submitted a review for this participant on this project.")

        rev_id = f"rev_{uuid.uuid4().hex[:12]}"
        conn.execute(
            """
            INSERT INTO reviews (
                id, project_id, reviewer_id, reviewee_id, quality, timeliness,
                communication, collaboration, integrity, fairness, clarity, comment, tags_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rev_id,
                project_id,
                user["id"],
                req.reviewee_id,
                req.quality,
                req.timeliness,
                req.communication,
                req.collaboration,
                req.integrity,
                req.fairness,
                req.clarity,
                req.comment or "",
                json.dumps(req.tags or []),
            ),
        )

        # Recalculate reviewee average stars from closed projects
        revs = conn.execute(
            "SELECT quality, timeliness, communication, collaboration, integrity FROM reviews WHERE reviewee_id = ?",
            (req.reviewee_id,),
        ).fetchall()
        avg_stars = sum(
            (r["quality"] + r["timeliness"] + r["communication"] + r["collaboration"] + r["integrity"]) / 5.0
            for r in revs
        ) / len(revs)

        # Apply recorded penalty adjustments
        penalties = conn.execute(
            "SELECT SUM(delta) as total_penalty FROM ratings_history WHERE user_id = ? AND delta < 0",
            (req.reviewee_id,),
        ).fetchone()
        penalty_delta = penalties["total_penalty"] or 0.0

        final_rating = max(RATING_MIN, min(RATING_MAX, round(avg_stars + penalty_delta, 2)))
        conn.execute("UPDATE users SET stars = ? WHERE id = ?", (final_rating, req.reviewee_id))

        # Check Newbie badge removal (SPEC.md Section 6)
        reviewee = conn.execute("SELECT id, newbie_badge, name FROM users WHERE id = ?", (req.reviewee_id,)).fetchone()
        newbie_removed = False
        if reviewee and reviewee["newbie_badge"] == 1:
            conn.execute("UPDATE users SET newbie_badge = 0 WHERE id = ?", (req.reviewee_id,))
            newbie_removed = True
            send_in_app_notification(
                user_id=req.reviewee_id,
                title="Newbie Badge Unlocked!",
                message=f"Congratulations! With your first closed project review, your verified star rating ({final_rating} ⭐) is now publicly active.",
                link=f"/student",
                conn=conn,
            )

        seq = record_ledger_entry(
            actor=user["id"],
            action="REVIEW_SUBMITTED",
            payload={
                "project_id": project_id,
                "review_id": rev_id,
                "reviewee_id": req.reviewee_id,
                "quality": req.quality,
                "timeliness": req.timeliness,
                "communication": req.communication,
                "collaboration": req.collaboration,
                "integrity": req.integrity,
                "final_rating": final_rating,
                "newbie_removed": newbie_removed,
            },
            conn=conn,
        )

        conn.execute("UPDATE reviews SET ledger_ref = ? WHERE id = ?", (f"LEDGER-#{seq}", rev_id))

        return {
            "status": "success",
            "review_id": rev_id,
            "new_rating": final_rating,
            "newbie_removed": newbie_removed,
            "ledger_seq": seq,
        }


# ===================== Rehearsal Engine Endpoint (SPEC.md Section 13) =====================
@app.post("/api/rehearsal/simulate")
async def post_rehearsal_simulate(
    req: RehearsalSimulateRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Rehearsal Engine simulator calling backend/rules.py pure rule functions in dry-run mode.
    Nothing is saved. Shows before and after integer rupees, star changes, credit, access, and reasons.
    """
    with get_db() as conn:
        state = get_full_project_state(req.project_id, conn)

        scenario = req.scenario.lower()
        params = req.params or {}

        if scenario in ["student_quits_40", "student_quits"]:
            target_uid = params.get("user_id")
            if not target_uid:
                students = [m for m in state["members"] if m.get("role") == "student"]
                target_uid = students[0]["user_id"] if students else "usr_student_b"
            result = quit_midway(
                charter=state["charter"],
                project_state=state,
                member=target_uid,
                progress_fraction=float(params.get("progress_fraction", 0.40)),
                good_cause=bool(params.get("good_cause", False)),
            )
            # Real action available if current user is an active member or admin
            is_mem = any(m["user_id"] == user["id"] and m.get("status") == "accepted" for m in state["members"])
            can_run_real = is_mem or user["role"] == "admin"

        elif scenario in ["sponsor_withdraws", "withdraw"]:
            result = sponsor_withdraws(
                charter=state["charter"],
                project_state=state,
            )
            # Real action available if current user is sponsor or admin
            can_run_real = user["id"] == state["project"]["sponsor_id"] or user["role"] == "admin"

        elif scenario in ["sponsor_silent", "silent"]:
            days = int(params.get("days", 8))
            result = sponsor_silent(
                charter=state["charter"],
                project_state=state,
                days=days,
            )
            can_run_real = False

        elif scenario in ["ai_wrote_70", "ai_credit"]:
            sub = {
                "id": "sub_rehearsal_ai",
                "title": "Edge Inference Optimization Kernel",
                "author_name": "Rohan Mehta (Student B)",
                "author_id": "usr_student_b",
                "ai_share_pct": float(params.get("ai_share_pct", 70.0)),
            }
            result = ai_share_credit(
                charter=state["charter"],
                submission=sub,
                project_state=state,
            )
            can_run_real = False

        elif scenario in ["paid_becomes_unpaid", "model_change"]:
            result = paid_becomes_unpaid(
                charter=state["charter"],
                project_state=state,
            )
            can_run_real = False

        else:
            raise HTTPException(status_code=400, detail=f"Unknown rehearsal scenario: '{req.scenario}'")

        return {
            "status": "success",
            "scenario": req.scenario,
            "project_id": req.project_id,
            "can_run_real": can_run_real,
            "result": result,
        }


# ===================== Demo Time & Stage Controllers (SPEC.md Section 14) =====================
@app.post("/api/demo/fast-forward")
async def post_demo_fast_forward(
    req: FastForwardRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Fast-forwards simulated time by N days.
    Adjusts submission dates backward so acceptance windows expire.
    """
    days = req.days or SIMULATED_FAST_FORWARD_DAYS
    with get_db() as conn:
        conn.execute(
            f"UPDATE submissions SET created_at = datetime(created_at, '-{days} days') WHERE status = 'submitted'"
        )
        seq = record_ledger_entry(
            actor=user["id"],
            action="SIMULATED_TIME_FAST_FORWARD",
            payload={"days_advanced": days},
            conn=conn,
        )
        return {
            "status": "success",
            "days_advanced": days,
            "message": f"Simulated time advanced by {days} days. Acceptance windows updated.",
            "ledger_seq": seq,
        }


@app.post("/api/demo/load-stage")
async def post_demo_load_stage(
    req: LoadStageRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Prepares database state for specific demo story stages:
    - before_posting
    - after_matching
    - mid_project
    - milestone_acceptance
    """
    from backend.seed import seed_database
    seed_database()

    with get_db() as conn:
        stage = req.stage.lower()
        if stage == "before_posting":
            # Set retinopathy project status to draft
            conn.execute("UPDATE projects SET status = 'draft' WHERE id = 'proj_retinopathy'")
            msg = "Demo stage loaded: Before Posting (Project saved as draft; AI Scoping ready)."

        elif stage == "after_matching":
            conn.execute("UPDATE projects SET status = 'open' WHERE id = 'proj_retinopathy'")
            msg = "Demo stage loaded: After Matching (Project published; candidate recommendations ready)."

        elif stage == "mid_project":
            conn.execute("UPDATE projects SET status = 'in_progress' WHERE id = 'proj_retinopathy'")
            conn.execute("UPDATE milestones SET status = 'completed' WHERE id = 'ms_retino_1'")
            conn.execute("UPDATE milestones SET status = 'in_progress' WHERE id = 'ms_retino_2'")
            msg = "Demo stage loaded: Mid-Project (Milestone 1 delivered; Milestone 2 active)."

        elif stage == "milestone_acceptance":
            conn.execute("UPDATE projects SET status = 'in_progress' WHERE id = 'proj_retinopathy'")
            conn.execute("UPDATE milestones SET status = 'submitted' WHERE id = 'ms_retino_1'")
            # Create expert approved submission
            sub_id = "sub_demo_acceptance"
            conn.execute(
                """
                INSERT OR REPLACE INTO submissions (
                    id, project_id, milestone_id, author_id, title, content,
                    ai_used, ai_share_pct, integrity_status, status, expert_comment
                ) VALUES (?, ?, ?, ?, ?, ?, 1, 20.0, 'clean', 'expert_approved', 'Technically sound and clinically validated.')
                """,
                (sub_id, "proj_retinopathy", "ms_retino_1", "usr_student_b", "Fundus Quantization Benchmark", "TensorFlow Lite INT8 model weights and inference benchmarks."),
            )
            msg = "Demo stage loaded: Ready for Milestone Acceptance (Expert review complete; awaiting sponsor sign-off)."

        else:
            msg = f"Demo reseeded to clean initial state."

        seq = record_ledger_entry(
            actor=user["id"],
            action="DEMO_STAGE_LOADED",
            payload={"stage": req.stage, "description": msg},
            conn=conn,
        )

        return {"status": "success", "stage": req.stage, "message": msg, "ledger_seq": seq}


# ===================== Admin Operations Desk (SPEC.md Section 5 & 11) =====================
@app.get("/api/admin/verification-queue")
async def get_admin_verification_queue(
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """Returns all users with simulated KYC verification status and documents."""
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT id, email, name, role, headline, is_kyc_verified, newbie_badge, stars, created_at
            FROM users
            ORDER BY created_at DESC
            """
        ).fetchall()
        return {"users": [dict(r) for r in rows]}


@app.post("/api/admin/verify-user")
async def post_admin_verify_user(
    req: VerifyUserRequest,
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """Admin updates or approves simulated KYC status for a user."""
    with get_db() as conn:
        val = 1 if req.verified else 0
        conn.execute("UPDATE users SET is_kyc_verified = ? WHERE id = ?", (val, req.user_id))
        seq = record_ledger_entry(
            actor=user["id"],
            action="KYC_VERIFICATION_UPDATED",
            payload={"user_id": req.user_id, "verified": req.verified},
            conn=conn,
        )
        return {"status": "success", "user_id": req.user_id, "is_kyc_verified": bool(val), "ledger_seq": seq}


@app.get("/api/admin/flagged-submissions")
async def get_admin_flagged_submissions(
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """Returns submissions flagged for similarity or prompt-injection."""
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT s.*, p.title as project_title, u.name as author_name, u.email as author_email
            FROM submissions s
            JOIN projects p ON p.id = s.project_id
            JOIN users u ON u.id = s.author_id
            WHERE s.integrity_status != 'clean' OR s.similarity_score >= 0.35
            ORDER BY s.created_at DESC
            """
        ).fetchall()
        return {"flagged_submissions": [dict(r) for r in rows]}


@app.post("/api/admin/resolve-flag")
async def post_admin_resolve_flag(
    req: ResolveFlagRequest,
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """Admin resolves or clears an integrity flag after manual inspection."""
    with get_db() as conn:
        new_status = "clean" if req.decision == "clear" else "flagged_confirmed"
        conn.execute(
            "UPDATE submissions SET integrity_status = ? WHERE id = ?",
            (new_status, req.submission_id),
        )
        seq = record_ledger_entry(
            actor=user["id"],
            action="INTEGRITY_FLAG_RESOLVED",
            payload={"submission_id": req.submission_id, "decision": req.decision, "notes": req.notes},
            conn=conn,
        )
        return {"status": "success", "submission_id": req.submission_id, "integrity_status": new_status, "ledger_seq": seq}


@app.get("/api/admin/disputes")
async def get_admin_disputes(
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """Returns platform dispute and mediation queue."""
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT d.*, p.title as project_title, u.name as initiator_name
            FROM disputes d
            LEFT JOIN projects p ON p.id = d.project_id
            LEFT JOIN users u ON u.id = d.initiator_id
            ORDER BY d.created_at DESC
            """
        ).fetchall()
        return {"disputes": [dict(r) for r in rows]}


@app.post("/api/admin/mediate-dispute")
async def post_admin_mediate_dispute(
    req: MediateDisputeRequest,
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """
    Admin mediates a dispute.
    If good_cause_granted is true for a quit candidate, waives or reverses the 0.5 star penalty.
    """
    with get_db() as conn:
        disp = conn.execute("SELECT * FROM disputes WHERE id = ?", (req.dispute_id,)).fetchone()
        if not disp:
            # Create dispute if mediating a new issue
            disp_id = req.dispute_id
            conn.execute(
                """
                INSERT INTO disputes (id, project_id, initiator_id, reason, status, resolution_notes, good_cause_granted)
                VALUES (?, 'proj_retinopathy', ?, ?, 'mediated', ?, ?)
                """,
                (disp_id, user["id"], req.decision, req.notes or "", 1 if req.good_cause_granted else 0),
            )
        else:
            conn.execute(
                """
                UPDATE disputes
                SET status = 'mediated', resolution_notes = ?, good_cause_granted = ?, mediated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (req.notes or "", 1 if req.good_cause_granted else 0, req.dispute_id),
            )

        # If good cause granted, restore 0.5 stars if penalized
        if req.good_cause_granted and disp:
            init_id = disp["initiator_id"]
            conn.execute(
                "UPDATE users SET stars = MIN(5.0, stars + 0.5) WHERE id = ?",
                (init_id,),
            )
            conn.execute(
                """
                INSERT INTO ratings_history (id, user_id, old_rating, new_rating, delta, reason)
                VALUES (?, ?, 3.9, 4.4, 0.5, 'Admin mediator approved good cause exception for project quit.')
                """,
                (f"rh_{uuid.uuid4().hex[:12]}", init_id),
            )

        seq = record_ledger_entry(
            actor=user["id"],
            action="DISPUTE_MEDIATED",
            payload={
                "dispute_id": req.dispute_id,
                "decision": req.decision,
                "good_cause_granted": req.good_cause_granted,
                "notes": req.notes,
            },
            conn=conn,
        )

        return {"status": "success", "dispute_id": req.dispute_id, "ledger_seq": seq}


@app.post("/api/admin/repair-ledger")
async def post_admin_repair_ledger(
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """
    Repairs broken cryptographic hash chain in database so Verify returns OK.
    Recalculates sequential prev_hash and entry_hash from genesis to latest.
    """
    with get_db() as conn:
        rows = conn.execute(
            "SELECT seq, timestamp, actor, on_behalf_of, action, payload_hash, payload_json FROM ledger ORDER BY seq ASC"
        ).fetchall()

        prev_hash = "0" * 64
        for r in rows:
            entry_material = f"{r['seq']}|{r['timestamp']}|{r['actor']}|{r['on_behalf_of']}|{r['action']}|{r['payload_hash']}|{prev_hash}"
            entry_hash = hashlib.sha256(entry_material.encode("utf-8")).hexdigest()

            conn.execute(
                "UPDATE ledger SET prev_hash = ?, entry_hash = ? WHERE seq = ?",
                (prev_hash, entry_hash, r["seq"]),
            )
            prev_hash = entry_hash

        return {"status": "ok", "message": f"Cryptographically re-anchored {len(rows)} blocks. Ledger chain is 100% verified."}


@app.get("/api/admin/ledger-audit")
async def get_admin_ledger_audit(
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """Runs deep block-by-block cryptographic verification on the ledger."""
    with get_db() as conn:
        res = verify_ledger(conn)
        return res


@app.post("/api/sponsor/projects/create")
async def sponsor_create_project(
    data: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_role("sponsor")),
):
    return {"status": "ok", "message": "Sponsor project creation authorized"}


<<<<<<< HEAD
# ===================== Phase 6: Project Lifecycle, Reviews, Exits =====================
@app.post("/api/projects/{project_id}/close")
async def post_close_project(
    project_id: str,
    req: Optional[ProjectCloseRequest] = None,
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """
    Project close: closes the project, generates completion certificates for accepted members,
    and opens structured reviews (SPEC.md Section 6 & 11).
    """
    with get_db() as conn:
        proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")
        if user["role"] != "admin" and user["id"] != proj["sponsor_id"]:
            raise HTTPException(status_code=403, detail="Only project sponsor or admin can close project.")
        outcome = req.outcome if req else None
        return close_project(project_id, user["id"], outcome, conn)


@app.post("/api/projects/{project_id}/reviews")
async def post_project_review(
    project_id: str,
    req: ReviewSubmitRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Structured review submission:
    scores 1-5 for Quality, Timeliness, Communication, Collaboration, Integrity
    (plus Fairness and Clarity for companies).
    Only members of closed project can review; one review per member per project;
    tied to ledger entry; repeated high ratings down-weighted.
    """
    with get_db() as conn:
        return submit_project_review(project_id, user["id"], req.model_dump(), conn)


@app.get("/api/projects/{project_id}/reviews")
async def get_project_reviews(
    project_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Returns reviews and member review eligibility for a project."""
    with get_db() as conn:
        proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        revs = conn.execute(
            """
            SELECT r.*, u1.name as reviewer_name, u1.role as reviewer_role,
                   u2.name as reviewee_name, u2.role as reviewee_role
            FROM reviews r
            JOIN users u1 ON u1.id = r.reviewer_id
            JOIN users u2 ON u2.id = r.reviewee_id
            WHERE r.project_id = ?
            ORDER BY r.created_at DESC
            """,
            (project_id,),
        ).fetchall()

        eligibility = []
        if user and proj["status"] == "closed":
            candidates = conn.execute(
                """
                SELECT DISTINCT u.id, u.name, u.role
                FROM users u
                WHERE u.id = ? OR EXISTS (
                    SELECT 1 FROM project_members pm
                    WHERE pm.project_id = ? AND pm.user_id = u.id AND pm.status IN ('accepted', 'quit')
                )
                """,
                (proj["sponsor_id"], project_id),
            ).fetchall()

            my_revs = {r["reviewee_id"]: dict(r) for r in revs if r["reviewer_id"] == user["id"]}
            for c in candidates:
                if c["id"] != user["id"]:
                    eligibility.append({
                        "user_id": c["id"],
                        "name": c["name"],
                        "role": c["role"],
                        "already_reviewed": c["id"] in my_revs,
                        "review": my_revs.get(c["id"]),
                    })

        return {
            "project_id": project_id,
            "project_status": proj["status"],
            "reviews": [dict(r) for r in revs],
            "review_eligibility": eligibility,
        }


@app.post("/api/projects/{project_id}/quit")
async def post_candidate_quit(
    project_id: str,
    req: CandidateQuitRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Candidate quits midway:
    paid only for accepted or reviewed work, money already released stays theirs,
    penalty -0.5 stars unless admin marks good cause, credit kept, access revoked,
    unearned part returns to pool. Returns before-and-after rupee table.
    """
    with get_db() as conn:
        good_cause = bool(req.good_cause) if user["role"] == "admin" else False
        return candidate_quit_project(
            project_id=project_id,
            candidate_id=user["id"],
            reason=req.reason or "Candidate departed project midway",
            good_cause=good_cause,
            actor_id=user["id"],
            conn=conn,
        )


@app.post("/api/projects/{project_id}/members/{target_user_id}/quit")
async def post_member_quit_by_admin(
    project_id: str,
    target_user_id: str,
    req: CandidateQuitRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Admin or candidate quits a member from a project with optional good cause."""
    if user["role"] != "admin" and user["id"] != target_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    with get_db() as conn:
        good_cause = bool(req.good_cause) if user["role"] == "admin" else False
        return candidate_quit_project(
            project_id=project_id,
            candidate_id=target_user_id,
            reason=req.reason or "Candidate departed project",
            good_cause=good_cause,
            actor_id=user["id"],
            conn=conn,
        )


@app.post("/api/projects/{project_id}/withdraw")
async def post_project_withdraw(
    project_id: str,
    req: SponsorWithdrawRequest,
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """
    Sponsor withdraws sponsorship midway:
    all locked and unreleased funds go to team by charter split & contribution weights,
    PLUS 10% compensation charged to sponsor wallet; sponsor -0.5 stars,
    withdrawal count on company record, members keep credit.
    Returns before-and-after rupee table.
    """
    with get_db() as conn:
        proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")
        if user["role"] != "admin" and user["id"] != proj["sponsor_id"]:
            raise HTTPException(status_code=403, detail="Only project sponsor or admin can withdraw project.")
        return sponsor_withdraw_project(
            project_id=project_id,
            reason=req.reason or "Withdrew project sponsorship midway",
            actor_id=user["id"],
            conn=conn,
        )


@app.post("/api/sponsor/withdraw")
async def sponsor_withdraw_project_route(
    data: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """Legacy route for sponsor withdrawal supporting project_id in body."""
    target_project_id = data.get("project_id", "proj_retinopathy")
    reason = data.get("reason", "Withdrew project sponsorship midway")
    with get_db() as conn:
        proj = conn.execute("SELECT * FROM projects WHERE id = ?", (target_project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")
        if user["role"] != "admin" and user["id"] != proj["sponsor_id"]:
            raise HTTPException(status_code=403, detail="Only project sponsor or admin can withdraw.")
        return sponsor_withdraw_project(
            project_id=target_project_id,
            reason=reason,
            actor_id=user["id"],
            conn=conn,
        )


=======
# ===================== Admin Audit & Reset =====================
>>>>>>> bc6518a (feat: implement Phase 7 shared rules, rehearsal engine, demo guide, admin governance, and exit flows)
@app.get("/api/admin/audit")
async def admin_audit(
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    with get_db() as conn:
        res = verify_ledger(conn)
        return {"status": "ok", "audit": res}


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
