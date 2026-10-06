"""
Workspace, Submissions, Integrity Checking, Expert Review,
Locker Payouts, AI Agent Actions, and Ledger Timeline Router.
Implements Phase 5 core of SPEC.md.
"""

import json
import hashlib
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.database import get_db
from backend.auth import get_current_user, get_optional_user
from backend.rbac import require_role
from backend.ledger import record_ledger_entry, verify_ledger
from backend.payout import calculate_milestone_payout
from backend.integrity import check_submission_integrity
from backend.config import DEFAULT_STUDENT_WEIGHTS

router = APIRouter(tags=["workspace"])


# ===================== Schemas =====================
class FileUploadRequest(BaseModel):
    filename: str
    content: str  # text or base64
    watermark_text: Optional[str] = ""


class ChatMessageRequest(BaseModel):
    content: str


class SubmissionCreateRequest(BaseModel):
    milestone_id: str
    title: str
    content: str
    ai_used: bool = False
    ai_share_pct: float = Field(0.0, ge=0.0, le=100.0)
    ai_declaration: Optional[str] = ""
    file_hash: Optional[str] = None


class ExpertReviewRequest(BaseModel):
    decision: str  # approved, changes_requested, rejected
    comment: str


class SponsorDecisionRequest(BaseModel):
    decision: str  # accepted, rejected
    reason: str


class AgentQueryRequest(BaseModel):
    prompt: str


def check_workspace_access(project_id: str, user: Dict[str, Any], conn) -> Dict[str, Any]:
    """
    Server-side RBAC:
    Only accepted project members, the project sponsor and admin can open a project's workspace;
    others get 403 Forbidden.
    """
    proj = conn.execute(
        "SELECT id, title, public_summary, confidential_brief, budget, engagement_model, status, sensitivity_label, sponsor_id, final_outcome FROM projects WHERE id = ?",
        (project_id,),
    ).fetchone()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if proj["status"] == "closed":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: This project is closed and archived. The workspace is no longer active. Please view the closed charter and timeline.",
        )

    if user["role"] == "admin":
        return dict(proj)

    if user["id"] == proj["sponsor_id"]:
        return dict(proj)

    # Check project membership
    member = conn.execute(
        "SELECT id, role, status FROM project_members WHERE project_id = ? AND user_id = ? AND status = 'accepted'",
        (project_id, user["id"]),
    ).fetchone()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You must be an accepted project member, the sponsor, or an admin to access this workspace.",
        )

    # Check charter acceptance
    curr_charter = conn.execute("SELECT version FROM charters WHERE project_id = ? AND is_current = 1", (project_id,)).fetchone()
    if curr_charter:
        acc = conn.execute(
            "SELECT 1 FROM charter_acceptances WHERE project_id = ? AND user_id = ? AND version = ?",
            (project_id, user["id"], curr_charter["version"]),
        ).fetchone()
        if not acc:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You must accept the current charter version before entering the workspace.",
            )

    return dict(proj)


# ===================== Workspace Core =====================
@router.get("/api/projects/{project_id}/workspace")
async def get_project_workspace(
    project_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns full workspace data for accepted members, sponsor, and admin.
    Refuses non-members with HTTP 403.
    """
    with get_db() as conn:
        proj = check_workspace_access(project_id, user, conn)

        # Members
        members_raw = conn.execute(
            """
            SELECT pm.id, pm.user_id, pm.role, pm.weight, pm.joined_at,
                   u.name, u.email, u.avatar_initials, u.stars, u.newbie_badge
            FROM project_members pm
            JOIN users u ON u.id = pm.user_id
            WHERE pm.project_id = ? AND pm.status = 'accepted'
            """,
            (project_id,),
        ).fetchall()

        # Milestones
        milestones = conn.execute(
            "SELECT * FROM milestones WHERE project_id = ? ORDER BY sequence ASC",
            (project_id,),
        ).fetchall()

        # Lockers
        lockers = conn.execute(
            "SELECT * FROM escrow_lockers WHERE project_id = ?",
            (project_id,),
        ).fetchall()

        # Files
        files = conn.execute(
            """
            SELECT pf.*, u.name as uploader_name, u.role as uploader_role
            FROM project_files pf
            JOIN users u ON u.id = pf.uploader_id
            WHERE pf.project_id = ?
            ORDER BY pf.created_at DESC
            """,
            (project_id,),
        ).fetchall()

        # Messages (Chat)
        messages = conn.execute(
            """
            SELECT * FROM project_messages
            WHERE project_id = ?
            ORDER BY created_at ASC
            LIMIT 100
            """,
            (project_id,),
        ).fetchall()

        # Submissions
        submissions = conn.execute(
            """
            SELECT s.*, u.name as author_name, u.role as author_role, m.sequence as milestone_sequence, m.title as milestone_title
            FROM submissions s
            JOIN users u ON u.id = s.author_id
            JOIN milestones m ON m.id = s.milestone_id
            WHERE s.project_id = ?
            ORDER BY s.created_at DESC
            """,
            (project_id,),
        ).fetchall()

        # AI Agent Actions
        agent_actions = conn.execute(
            """
            SELECT a.*, u.name as owner_name
            FROM ai_agent_actions a
            JOIN users u ON u.id = a.owner_id
            WHERE a.project_id = ?
            ORDER BY a.created_at DESC
            """,
            (project_id,),
        ).fetchall()

        # Payouts
        payouts = conn.execute(
            """
            SELECT p.*, u.name as recipient_name
            FROM payouts p
            JOIN users u ON u.id = p.recipient_id
            WHERE p.project_id = ?
            ORDER BY p.created_at DESC
            """,
            (project_id,),
        ).fetchall()

        # Certificates (Non-monetary)
        certificates = conn.execute(
            """
            SELECT c.*, u.name as recipient_name
            FROM project_certificates c
            JOIN users u ON u.id = c.recipient_id
            WHERE c.project_id = ?
            ORDER BY c.issued_at DESC
            """,
            (project_id,),
        ).fetchall()

        # Reviews
        reviews = conn.execute(
            """
            SELECT pr.*, u_from.name as reviewer_name, u_to.name as reviewee_name
            FROM reviews pr
            JOIN users u_from ON u_from.id = pr.reviewer_id
            JOIN users u_to ON u_to.id = pr.reviewee_id
            WHERE pr.project_id = ?
            ORDER BY pr.created_at DESC
            """,
            (project_id,),
        ).fetchall()

        return {
            "project": proj,
            "current_user_role": user["role"],
            "is_sponsor": user["id"] == proj["sponsor_id"] or user["role"] == "admin",
            "members": [dict(m) for m in members_raw],
            "milestones": [dict(m) for m in milestones],
            "lockers": [dict(l) for l in lockers],
            "files": [dict(f) for f in files],
            "messages": [dict(m) for m in messages],
            "submissions": [dict(s) for s in submissions],
            "agent_actions": [dict(a) for a in agent_actions],
            "payouts": [dict(p) for p in payouts],
            "certificates": [dict(c) for c in certificates],
            "reviews": [dict(r) for r in reviews],
        }


# ===================== File Uploads =====================
@router.post("/api/projects/{project_id}/files")
async def upload_project_file(
    project_id: str,
    req: FileUploadRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Files uploaded are SHA-256 hashed and logged to the immutable ledger.
    """
    with get_db() as conn:
        check_workspace_access(project_id, user, conn)

        content_bytes = req.content.encode("utf-8")
        sha256 = hashlib.sha256(content_bytes).hexdigest()
        file_id = f"file_{uuid.uuid4().hex[:10]}"
        file_size = len(content_bytes)

        conn.execute(
            """
            INSERT INTO project_files (id, project_id, uploader_id, filename, file_size, sha256_hash, watermark_text)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (file_id, project_id, user["id"], req.filename, file_size, sha256, req.watermark_text or ""),
        )

        record_ledger_entry(
            actor=user["id"],
            on_behalf_of=project_id,
            action="FILE_UPLOADED",
            payload={
                "project_id": project_id,
                "file_id": file_id,
                "filename": req.filename,
                "file_size": file_size,
                "sha256_hash": sha256,
            },
            conn=conn,
        )

        return {
            "status": "success",
            "file_id": file_id,
            "filename": req.filename,
            "sha256_hash": sha256,
            "file_size": file_size,
        }


# ===================== Project Chat =====================
@router.post("/api/projects/{project_id}/messages")
async def post_project_message(
    project_id: str,
    req: ChatMessageRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Simple project team chat appended to DB and hash-chained ledger."""
    with get_db() as conn:
        check_workspace_access(project_id, user, conn)

        msg_id = f"msg_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT INTO project_messages (id, project_id, sender_id, sender_name, sender_role, content)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (msg_id, project_id, user["id"], user["name"], user["role"], req.content),
        )

        record_ledger_entry(
            actor=user["id"],
            on_behalf_of=project_id,
            action="PROJECT_CHAT_MESSAGE",
            payload={
                "project_id": project_id,
                "message_id": msg_id,
                "sender_id": user["id"],
                "content_preview": req.content[:80],
            },
            conn=conn,
        )

        return {
            "id": msg_id,
            "project_id": project_id,
            "sender_id": user["id"],
            "sender_name": user["name"],
            "sender_role": user["role"],
            "content": req.content,
        }


# ===================== Submissions & Integrity Check =====================
@router.post("/api/projects/{project_id}/submissions")
async def create_milestone_submission(
    project_id: str,
    req: SubmissionCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Submits milestone deliverable.
    Mandatory AI-use declaration (checkbox plus AI-share %).
    Runs 3-word shingle Jaccard integrity check & prompt injection defense.
    """
    with get_db() as conn:
        proj = check_workspace_access(project_id, user, conn)

        # Milestone verification
        m = conn.execute(
            "SELECT * FROM milestones WHERE id = ? AND project_id = ?",
            (req.milestone_id, project_id),
        ).fetchone()
        if not m:
            raise HTTPException(status_code=404, detail="Milestone not found")

        # Fetch past submissions for project history similarity
        past_subs = conn.execute(
            "SELECT content FROM submissions WHERE project_id = ?",
            (project_id,),
        ).fetchall()
        history_texts = [s["content"] for s in past_subs if s["content"]]

        # Run integrity check
        check_result = check_submission_integrity(
            submission_text=req.content,
            project_id=project_id,
            history_texts=history_texts,
        )

        sub_id = f"sub_{uuid.uuid4().hex[:10]}"
        content_hash = hashlib.sha256(req.content.encode("utf-8")).hexdigest()

        conn.execute(
            """
            INSERT INTO submissions (
                id, project_id, milestone_id, author_id, title, content, file_hash,
                ai_used, ai_share_pct, ai_declaration, integrity_status,
                similarity_score, similarity_match_source, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
            """,
            (
                sub_id,
                project_id,
                req.milestone_id,
                user["id"],
                req.title,
                req.content,
                req.file_hash or content_hash,
                1 if req.ai_used else 0,
                req.ai_share_pct,
                req.ai_declaration or "",
                check_result["integrity_status"],
                check_result["similarity_score"],
                check_result["matched_source"],
            ),
        )

        # Update milestone status to submitted
        conn.execute("UPDATE milestones SET status = 'submitted' WHERE id = ?", (req.milestone_id,))

        # Record to ledger
        action_name = "MILESTONE_SUBMISSION_CREATED"
        if check_result["integrity_status"] == "flagged_injection":
            action_name = "SUBMISSION_PROMPT_INJECTION_FLAGGED"
        elif check_result["integrity_status"] == "flagged_similarity":
            action_name = "SUBMISSION_SIMILARITY_FLAGGED"

        record_ledger_entry(
            actor=user["id"],
            on_behalf_of=project_id,
            action=action_name,
            payload={
                "project_id": project_id,
                "milestone_id": req.milestone_id,
                "submission_id": sub_id,
                "title": req.title,
                "content_hash": content_hash,
                "ai_used": req.ai_used,
                "ai_share_pct": req.ai_share_pct,
                "integrity_status": check_result["integrity_status"],
                "similarity_score": check_result["similarity_score"],
                "flag_reason": check_result.get("flag_reason"),
            },
            conn=conn,
        )

        # Notify project expert and sponsor
        expert_member = conn.execute(
            "SELECT user_id FROM project_members WHERE project_id = ? AND role = 'expert' AND status = 'accepted'",
            (project_id,),
        ).fetchone()

        if expert_member:
            notif_title = "New Deliverable Submitted"
            if check_result["is_flagged"]:
                notif_title = "⚠️ Deliverable Flagged for Review"
            conn.execute(
                """
                INSERT INTO notifications (id, user_id, title, message, link, read)
                VALUES (?, ?, ?, ?, ?, 0)
                """,
                (
                    f"notif_{uuid.uuid4().hex[:10]}",
                    expert_member["user_id"],
                    notif_title,
                    f"Milestone deliverable '{req.title}' submitted by {user['name']}. {check_result.get('flag_reason', '')}",
                    f"/projects/{project_id}/workspace",
                ),
            )

        return {
            "status": "submitted",
            "submission_id": sub_id,
            "integrity_status": check_result["integrity_status"],
            "similarity_score": check_result["similarity_score"],
            "is_flagged": check_result["is_flagged"],
            "flag_reason": check_result.get("flag_reason"),
        }


# ===================== Expert Review =====================
@router.post("/api/submissions/{submission_id}/expert-review")
async def post_expert_review(
    submission_id: str,
    req: ExpertReviewRequest,
    user: Dict[str, Any] = Depends(require_role("expert", "admin")),
):
    """
    Expert review desk:
    Comment, request changes, approve or reject for sponsor review.
    RULE: An expert cannot be credited for student work (authorship remains with student).
    """
    valid_decisions = ["approved", "changes_requested", "rejected"]
    if req.decision not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"Invalid decision. Choose from: {valid_decisions}")

    with get_db() as conn:
        sub = conn.execute("SELECT * FROM submissions WHERE id = ?", (submission_id,)).fetchone()
        if not sub:
            raise HTTPException(status_code=404, detail="Submission not found")

        # Map decision to submission status
        new_status = {
            "approved": "expert_approved",
            "changes_requested": "changes_requested",
            "rejected": "expert_rejected",
        }[req.decision]

        conn.execute(
            """
            UPDATE submissions
            SET status = ?, expert_comment = ?, expert_reviewed_by = ?, expert_reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (new_status, req.comment, user["id"], submission_id),
        )

        # If changes requested or rejected, milestone status reflects that
        if req.decision == "changes_requested":
            conn.execute("UPDATE milestones SET status = 'in_progress' WHERE id = ?", (sub["milestone_id"],))
        elif req.decision == "rejected":
            conn.execute("UPDATE milestones SET status = 'pending' WHERE id = ?", (sub["milestone_id"],))

        record_ledger_entry(
            actor=user["id"],
            on_behalf_of=sub["project_id"],
            action=f"EXPERT_REVIEW_{req.decision.upper()}",
            payload={
                "submission_id": submission_id,
                "project_id": sub["project_id"],
                "milestone_id": sub["milestone_id"],
                "author_id": sub["author_id"],
                "decision": req.decision,
                "comment": req.comment,
            },
            conn=conn,
        )

        # Notify author
        conn.execute(
            """
            INSERT INTO notifications (id, user_id, title, message, link, read)
            VALUES (?, ?, ?, ?, ?, 0)
            """,
            (
                f"notif_{uuid.uuid4().hex[:10]}",
                sub["author_id"],
                f"Expert Review: {req.decision.replace('_', ' ').title()}",
                f"Expert {user['name']} reviewed your deliverable: '{req.comment[:100]}'.",
                f"/projects/{sub['project_id']}/workspace",
            ),
        )

        # If approved, notify sponsor that deliverable is ready for payout decision
        if req.decision == "approved":
            proj = conn.execute("SELECT sponsor_id FROM projects WHERE id = ?", (sub["project_id"],)).fetchone()
            if proj:
                conn.execute(
                    """
                    INSERT INTO notifications (id, user_id, title, message, link, read)
                    VALUES (?, ?, ?, ?, ?, 0)
                    """,
                    (
                        f"notif_{uuid.uuid4().hex[:10]}",
                        proj["sponsor_id"],
                        "Milestone Ready for Sponsor Decision",
                        f"Deliverable '{sub['title']}' approved by Expert {user['name']}. Review and release funds.",
                        f"/projects/{sub['project_id']}/workspace",
                    ),
                )

        return {
            "status": "success",
            "submission_id": submission_id,
            "decision": req.decision,
            "new_status": new_status,
        }


# ===================== Sponsor Decision & Locker Release =====================
@router.post("/api/projects/{project_id}/milestones/{milestone_id}/sponsor-decision")
async def post_sponsor_decision(
    project_id: str,
    milestone_id: str,
    req: SponsorDecisionRequest,
    user: Dict[str, Any] = Depends(require_role("sponsor", "admin")),
):
    """
    Sponsor accepts or rejects each milestone with a written reason.
    On accept: releases that milestone's locker funds by the charter split:
    - 10% platform fee
    - 5% AI compute reserve
    - expert 30% of net pool
    - student pool 70% with 40% equal and 60% by weights.
    - Assert sum == amount!
    - The locker cannot be released twice!
    - Non-monetary project: issue certificate, credit record, and co-authorship.
    """
    if req.decision not in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="Decision must be 'accepted' or 'rejected'.")

    if not req.reason or not req.reason.strip():
        raise HTTPException(status_code=400, detail="A written justification is required for the milestone decision.")

    with get_db() as conn:
        proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        if user["role"] != "admin" and user["id"] != proj["sponsor_id"]:
            raise HTTPException(status_code=403, detail="Only the project sponsor or admin can record milestone decisions.")

        m = conn.execute(
            "SELECT * FROM milestones WHERE id = ? AND project_id = ?",
            (milestone_id, project_id),
        ).fetchone()
        if not m:
            raise HTTPException(status_code=404, detail="Milestone not found")

        # Handle Rejection
        if req.decision == "rejected":
            conn.execute("UPDATE milestones SET status = 'rejected' WHERE id = ?", (milestone_id,))
            conn.execute(
                "UPDATE submissions SET status = 'sponsor_rejected', sponsor_decision_reason = ?, sponsor_decided_at = CURRENT_TIMESTAMP WHERE milestone_id = ?",
                (req.reason, milestone_id),
            )
            record_ledger_entry(
                actor=user["id"],
                on_behalf_of=project_id,
                action="MILESTONE_REJECTED_BY_SPONSOR",
                payload={"project_id": project_id, "milestone_id": milestone_id, "reason": req.reason},
                conn=conn,
            )
            return {"status": "rejected", "milestone_id": milestone_id, "reason": req.reason}

        # Handle Acceptance
        is_monetary = proj["engagement_model"] == "funded"
        payout_results = []

        if is_monetary:
            # Check locker
            locker = conn.execute(
                "SELECT * FROM escrow_lockers WHERE project_id = ? AND (milestone_id = ? OR milestone_id IS NULL)",
                (project_id, milestone_id),
            ).fetchone()

            if not locker:
                # If no explicit locker row, use milestone budget
                locker_amt = m["budget"]
                locker_id = f"locker_{project_id}_{milestone_id}"
                conn.execute(
                    "INSERT INTO escrow_lockers (id, project_id, milestone_id, amount, status) VALUES (?, ?, ?, ?, 'funded')",
                    (locker_id, project_id, milestone_id, locker_amt),
                )
                locker = {"id": locker_id, "amount": locker_amt, "status": "funded"}

            # ASSERT: The locker cannot be released twice!
            if locker["status"] == "released":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Locker has already been released for this milestone. Double release prohibited.",
                )

            release_amount = locker["amount"]
            if release_amount <= 0:
                raise HTTPException(status_code=400, detail="Cannot release zero funds.")

            # Fetch active members to disburse
            students = conn.execute(
                "SELECT user_id, weight FROM project_members WHERE project_id = ? AND role = 'student' AND status = 'accepted' ORDER BY joined_at ASC",
                (project_id,),
            ).fetchall()
            expert = conn.execute(
                "SELECT user_id FROM project_members WHERE project_id = ? AND role = 'expert' AND status = 'accepted'",
                (project_id,),
            ).fetchone()

            student_weights = [float(s["weight"] or 0.33) for s in students] if students else DEFAULT_STUDENT_WEIGHTS
            expert_present = bool(expert)

            # Integer rupee payout engine
            calc = calculate_milestone_payout(
                amount=release_amount,
                student_weights=student_weights,
                expert_present=expert_present,
            )

            # STRICT INVARIANT ASSERTION
            assert calc["total_distributed"] == release_amount, (
                f"Conservation leak: total {calc['total_distributed']} != {release_amount}"
            )

            # Record payouts and credit wallets
            # 1. Expert
            if expert and calc["expert_payout"] > 0:
                p_id = f"pay_{uuid.uuid4().hex[:10]}"
                conn.execute(
                    """
                    INSERT INTO payouts (id, project_id, milestone_id, recipient_id, recipient_role, amount, reason, ledger_ref)
                    VALUES (?, ?, ?, ?, 'expert', ?, ?, ?)
                    """,
                    (p_id, project_id, milestone_id, expert["user_id"], calc["expert_payout"], "Expert 30% advisory share of net pool", f"ledger_{p_id}"),
                )
                conn.execute("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", (calc["expert_payout"], expert["user_id"]))
                payout_results.append({
                    "recipient_id": expert["user_id"],
                    "role": "expert",
                    "amount": calc["expert_payout"],
                    "reason": "Expert 30% advisory share of net pool",
                })

            # 2. Students
            for idx, st_mem in enumerate(students):
                st_amt = calc["student_payouts"][idx] if idx < len(calc["student_payouts"]) else 0
                if st_amt > 0:
                    p_id = f"pay_{uuid.uuid4().hex[:10]}"
                    conn.execute(
                        """
                        INSERT INTO payouts (id, project_id, milestone_id, recipient_id, recipient_role, amount, reason, ledger_ref)
                        VALUES (?, ?, ?, ?, 'student', ?, ?, ?)
                        """,
                        (p_id, project_id, milestone_id, st_mem["user_id"], st_amt, f"Student Squad Member #{idx + 1} milestone payout", f"ledger_{p_id}"),
                    )
                    conn.execute("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", (st_amt, st_mem["user_id"]))
                    payout_results.append({
                        "recipient_id": st_mem["user_id"],
                        "role": "student",
                        "amount": st_amt,
                        "reason": f"Student Squad Member #{idx + 1} milestone payout",
                    })

            # Mark locker as released
            conn.execute(
                "UPDATE escrow_lockers SET status = 'released', released_at = CURRENT_TIMESTAMP WHERE id = ?",
                (locker["id"],),
            )

        else:
            # Non-monetary project: on acceptance issue certificate, credit record and co-authorship
            members = conn.execute(
                "SELECT user_id, role FROM project_members WHERE project_id = ? AND status = 'accepted'",
                (project_id,),
            ).fetchall()

            for mem in members:
                # Co-authorship
                conn.execute(
                    """
                    INSERT INTO project_certificates (id, project_id, recipient_id, recipient_role, certificate_type, title, ledger_ref)
                    VALUES (?, ?, ?, ?, 'co_authorship', ?, ?)
                    """,
                    (f"cert_{uuid.uuid4().hex[:10]}", project_id, mem["user_id"], mem["role"], f"Co-Authorship Verification: {m['title']}", f"ledger_cert_{m['id']}"),
                )
                # Verified credit record
                conn.execute(
                    """
                    INSERT INTO project_certificates (id, project_id, recipient_id, recipient_role, certificate_type, title, ledger_ref)
                    VALUES (?, ?, ?, ?, 'verified_credit', ?, ?)
                    """,
                    (f"cert_{uuid.uuid4().hex[:10]}", project_id, mem["user_id"], mem["role"], f"Verified Milestone Credit: {m['title']}", f"ledger_credit_{m['id']}"),
                )

        # Mark milestone and submissions accepted
        conn.execute("UPDATE milestones SET status = 'accepted' WHERE id = ?", (milestone_id,))
        conn.execute(
            """
            UPDATE submissions
            SET status = 'sponsor_accepted', sponsor_decision_reason = ?, sponsor_decided_at = CURRENT_TIMESTAMP
            WHERE milestone_id = ?
            """,
            (req.reason, milestone_id),
        )

        # Ledger record
        record_ledger_entry(
            actor=user["id"],
            on_behalf_of=project_id,
            action="MILESTONE_ACCEPTED_AND_FUNDS_RELEASED" if is_monetary else "MILESTONE_ACCEPTED_CREDENTIALS_ISSUED",
            payload={
                "project_id": project_id,
                "milestone_id": milestone_id,
                "milestone_title": m["title"],
                "reason": req.reason,
                "engagement_model": proj["engagement_model"],
                "payouts": payout_results if is_monetary else "Non-monetary credentials and certificates issued",
            },
            conn=conn,
        )

        return {
            "status": "accepted",
            "milestone_id": milestone_id,
            "engagement_model": proj["engagement_model"],
            "payouts": payout_results,
            "reason": req.reason,
        }


# ===================== AI Agent Assistant =====================
@router.post("/api/projects/{project_id}/agent/query")
async def query_ai_agent(
    project_id: str,
    req: AgentQueryRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    AI agent assistant with a named human owner.
    Side-effect actions need the owner's Approve click (deterministic fallback without an LLM key).
    """
    with get_db() as conn:
        check_workspace_access(project_id, user, conn)

        prompt_lower = req.prompt.lower()
        agent_name = "VouchScout-Agent"

        # Deterministic canned responses and action proposals
        if "summary" in prompt_lower or "milestone" in prompt_lower or "deliverable" in prompt_lower:
            reply = (
                "I have compiled the draft verification summary for this milestone based on the repository files "
                "and chat history. Would you like me to share this compilation artifact with the team?"
            )
            action_type = "share_file"
            payload = {
                "filename": "milestone_verification_pack.json",
                "summary": "Automated cross-check of quantized model weights and test evaluation logs.",
            }
        elif "audit" in prompt_lower or "integrity" in prompt_lower:
            reply = (
                "Integrity scan complete: all deliverables checked against 3-word shingle reference corpus. "
                "No unauthorized duplication or adversarial prompt strings found."
            )
            action_type = "log_audit"
            payload = {"check": "shingle_jaccard", "status": "clean"}
        else:
            reply = (
                f"Assistant ready. I can help summarize milestone deliverables, format verification artifacts, "
                f"or inspect code hashes. Side-effect actions require explicit approval from you ({user['name']})."
            )
            action_type = "propose_task"
            payload = {"task": "Review edge deployment benchmarks"}

        action_id = f"act_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT INTO ai_agent_actions (id, project_id, agent_name, owner_id, action_type, action_payload_json, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending_approval')
            """,
            (action_id, project_id, agent_name, user["id"], action_type, json.dumps(payload)),
        )

        return {
            "agent_name": agent_name,
            "owner_id": user["id"],
            "owner_name": user["name"],
            "response": reply,
            "proposed_action": {
                "id": action_id,
                "action_type": action_type,
                "payload": payload,
                "status": "pending_approval",
                "requires_owner_approval": True,
            },
        }


@router.post("/api/projects/{project_id}/agent/actions/{action_id}/approve")
async def approve_agent_action(
    project_id: str,
    action_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Executes a side-effect action only when approved by its named human owner or admin.
    """
    with get_db() as conn:
        action = conn.execute("SELECT * FROM ai_agent_actions WHERE id = ?", (action_id,)).fetchone()
        if not action:
            raise HTTPException(status_code=404, detail="Action not found")

        if user["role"] != "admin" and user["id"] != action["owner_id"]:
            raise HTTPException(status_code=403, detail="Only the named human owner can approve this agent action.")

        conn.execute(
            """
            UPDATE ai_agent_actions
            SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (user["id"], action_id),
        )

        record_ledger_entry(
            actor=user["id"],
            on_behalf_of=action["agent_name"],
            action="AI_AGENT_ACTION_APPROVED",
            payload={
                "action_id": action_id,
                "project_id": project_id,
                "action_type": action["action_type"],
                "owner_id": action["owner_id"],
            },
            conn=conn,
        )

        return {"status": "approved", "action_id": action_id}


# ===================== Timeline & Ledger =====================
@router.get("/api/projects/{project_id}/timeline")
async def get_project_timeline(
    project_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """
    Readable ledger timeline for the project with actor, on_behalf_of, and Verify status.
    """
    with get_db() as conn:
        proj = conn.execute("SELECT id, title, engagement_model FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        rows = conn.execute(
            """
            SELECT seq, timestamp, actor, on_behalf_of, action, payload_hash, prev_hash, entry_hash, payload_json
            FROM ledger
            WHERE payload_json LIKE ? OR on_behalf_of = ?
            ORDER BY seq ASC
            """,
            (f'%"{project_id}"%', project_id),
        ).fetchall()

        events = []
        for r in rows:
            p = json.loads(r["payload_json"] or "{}")
            # Resolve actor name if possible
            u = conn.execute("SELECT name, role FROM users WHERE id = ?", (r["actor"],)).fetchone()
            actor_name = u["name"] if u else r["actor"]
            actor_role = u["role"] if u else "system"

            events.append({
                "seq": r["seq"],
                "timestamp": r["timestamp"],
                "actor_id": r["actor"],
                "actor_name": actor_name,
                "actor_role": actor_role,
                "on_behalf_of": r["on_behalf_of"],
                "action": r["action"],
                "payload_hash": r["payload_hash"],
                "entry_hash": r["entry_hash"],
                "payload": p,
            })

        verify_result = verify_ledger()

        return {
            "project_id": project_id,
            "project_title": proj["title"],
            "engagement_model": proj["engagement_model"],
            "events_count": len(events),
            "events": events,
            "ledger_verification": verify_result,
        }


# ===================== Admin & Expert Queues =====================
@router.get("/api/admin/flagged-submissions")
async def get_admin_flagged_submissions(
    user: Dict[str, Any] = Depends(require_role("admin")),
):
    """Admin queue of flagged submissions (similarity or injection)."""
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT s.*, u.name as author_name, p.title as project_title
            FROM submissions s
            JOIN users u ON u.id = s.author_id
            JOIN projects p ON p.id = s.project_id
            WHERE s.integrity_status != 'clean'
            ORDER BY s.created_at DESC
            """,
        ).fetchall()
        return {"flagged_submissions": [dict(r) for r in rows]}


@router.get("/api/expert/review-queue")
async def get_expert_review_queue(
    user: Dict[str, Any] = Depends(require_role("expert", "admin")),
):
    """Expert queue of submissions needing review or integrity attention."""
    with get_db() as conn:
        if user["role"] == "admin":
            rows = conn.execute(
                """
                SELECT s.*, u.name as author_name, p.title as project_title, m.sequence as milestone_seq
                FROM submissions s
                JOIN users u ON u.id = s.author_id
                JOIN projects p ON p.id = s.project_id
                JOIN milestones m ON m.id = s.milestone_id
                WHERE s.status IN ('submitted', 'changes_requested') OR s.integrity_status != 'clean'
                ORDER BY s.created_at DESC
                """,
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT s.*, u.name as author_name, p.title as project_title, m.sequence as milestone_seq
                FROM submissions s
                JOIN users u ON u.id = s.author_id
                JOIN projects p ON p.id = s.project_id
                JOIN milestones m ON m.id = s.milestone_id
                JOIN project_members pm ON pm.project_id = s.project_id AND pm.user_id = ? AND pm.status = 'accepted'
                WHERE s.status IN ('submitted', 'changes_requested') OR s.integrity_status != 'clean'
                ORDER BY s.created_at DESC
                """,
                (user["id"],),
            ).fetchall()

        return {"review_queue": [dict(r) for r in rows]}
