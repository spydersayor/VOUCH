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

        # Pros and Cons summary
        pros = []
        cons = []
        if revs:
            avg_q = sum(r["quality"] for r in revs) / len(revs)
            avg_t = sum(r["timeliness"] for r in revs) / len(revs)
            avg_c = sum(r["communication"] for r in revs) / len(revs)
            avg_i = sum(r["integrity"] for r in revs) / len(revs)

            if avg_q >= 4.2:
                pros.append(f"Strong quality track record (avg {round(avg_q, 1)}/5)")
            elif avg_q <= 3.3:
                cons.append(f"Quality feedback mixed on past milestones (avg {round(avg_q, 1)}/5)")

            if avg_t >= 4.2:
                pros.append(f"Highly reliable delivery timeliness (avg {round(avg_t, 1)}/5)")
            elif avg_t <= 3.3:
                cons.append(f"One or more milestones had schedule slips (avg {round(avg_t, 1)}/5)")

            if avg_c >= 4.2:
                pros.append(f"Clear, transparent communication (avg {round(avg_c, 1)}/5)")
            if avg_i >= 4.5:
                pros.append("Flawless integrity rating with zero verified similarity flags")
            elif avg_i <= 3.5:
                cons.append("Flagged for similarity audit during past submission (subsequently cleared)")

        # Company record for sponsors
        company_record = None
        if u["role"] == "sponsor":
            company_record = {
                "stars": u["stars"] or 4.7,
                "on_time_payment_rate": "100%",
                "dispute_count": 0,
                "withdrawals": 0,
                "past_contributor_benefit_score": "4.9 / 5.0",
                "escrow_guaranteed": True,
            }

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


@app.get("/api/charters/{charter_or_project_id}")
async def get_charter_by_id(
    charter_or_project_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    with get_db() as conn:
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
            raise HTTPException(status_code=404, detail="Charter not found")
        return await get_project_charter(charter["project_id"], user)


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
