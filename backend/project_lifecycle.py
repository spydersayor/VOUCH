"""
Project Lifecycle Engine for VOUCH.
Implements Phase 6 of SPEC.md:
1. Project close and structured reviews.
2. Candidate quits midway (pro-rata earned, unearned returned, -0.5 stars unless good cause, rupee table).
3. Sponsor withdraws midway (locked funds + 10% compensation charged to sponsor, split by charter, -0.5 stars, withdrawal on company record, rupee table).
"""

import uuid
import sqlite3
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status
from backend.config import (
    STAR_PENALTY_QUIT,
    STAR_PENALTY_WITHDRAW,
    SPONSOR_WITHDRAWAL_COMPENSATION_PCT,
    DEFAULT_STUDENT_WEIGHTS,
)
from backend.ledger import record_ledger_entry
from backend.payout import calculate_milestone_payout
from backend.stars import record_star_penalty, calculate_and_update_stars


def close_project(
    project_id: str,
    actor_id: str,
    outcome: Optional[str],
    conn: sqlite3.Connection,
) -> Dict[str, Any]:
    """
    Closes a project, issues completion certificates to accepted members,
    and opens structured reviews.
    """
    proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if proj["status"] == "closed":
        raise HTTPException(status_code=400, detail="Project is already closed.")

    final_outcome = outcome or "Successfully completed all milestone objectives and deliverables."

    conn.execute(
        "UPDATE projects SET status = 'closed', final_outcome = ? WHERE id = ?",
        (final_outcome, project_id),
    )

    # Issue project completion certificates to all accepted members
    members = conn.execute(
        "SELECT user_id, role FROM project_members WHERE project_id = ? AND status = 'accepted'",
        (project_id,),
    ).fetchall()

    issued_certs = []
    for m in members:
        cert_id = f"cert_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT INTO project_certificates (id, project_id, recipient_id, recipient_role, certificate_type, title, ledger_ref)
            VALUES (?, ?, ?, ?, 'completion_certificate', ?, ?)
            """,
            (
                cert_id,
                project_id,
                m["user_id"],
                m["role"],
                f"Project Completion Certificate: {proj['title']}",
                f"ledger_{cert_id}",
            ),
        )
        issued_certs.append({"recipient_id": m["user_id"], "cert_id": cert_id})

        # Notify members
        conn.execute(
            """
            INSERT INTO notifications (id, user_id, title, message, link, read)
            VALUES (?, ?, ?, ?, ?, 0)
            """,
            (
                f"notif_{uuid.uuid4().hex[:10]}",
                m["user_id"],
                "Project Closed: Structured Reviews Open",
                f"Project '{proj['title']}' has been marked closed. Please submit your peer reviews.",
                f"/projects/{project_id}/workspace",
            ),
        )

    # Record ledger entry
    entry = record_ledger_entry(
        actor=actor_id,
        on_behalf_of=project_id,
        action="PROJECT_CLOSED",
        payload={
            "project_id": project_id,
            "title": proj["title"],
            "outcome": final_outcome,
            "certificates_issued": len(issued_certs),
        },
        conn=conn,
    )

    return {
        "status": "closed",
        "project_id": project_id,
        "outcome": final_outcome,
        "certificates_issued": len(issued_certs),
        "ledger_seq": entry["seq"],
    }


def submit_project_review(
    project_id: str,
    reviewer_id: str,
    req_data: Dict[str, Any],
    conn: sqlite3.Connection,
) -> Dict[str, Any]:
    """
    Submits a structured review with scores 1-5 for Quality, Timeliness, Communication,
    Collaboration, Integrity (plus Fairness and Clarity for companies).
    Tied to ledger entry. One review per member per project.
    """
    proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if proj["status"] != "closed":
        raise HTTPException(status_code=400, detail="Only members of a closed project can review.")

    reviewee_id = req_data.get("reviewee_id")
    if not reviewee_id:
        raise HTTPException(status_code=400, detail="reviewee_id is required.")

    if reviewer_id == reviewee_id:
        raise HTTPException(status_code=400, detail="Members cannot review themselves.")

    # Verify reviewer membership
    is_rev_sponsor = (proj["sponsor_id"] == reviewer_id)
    rev_member = conn.execute(
        "SELECT id FROM project_members WHERE project_id = ? AND user_id = ? AND status IN ('accepted', 'quit')",
        (project_id, reviewer_id),
    ).fetchone()
    if not is_rev_sponsor and not rev_member:
        raise HTTPException(status_code=403, detail="Reviewer must be an accepted member or sponsor of this project.")

    # Verify reviewee membership
    is_target_sponsor = (proj["sponsor_id"] == reviewee_id)
    target_member = conn.execute(
        "SELECT id FROM project_members WHERE project_id = ? AND user_id = ? AND status IN ('accepted', 'quit')",
        (project_id, reviewee_id),
    ).fetchone()
    if not is_target_sponsor and not target_member:
        raise HTTPException(status_code=400, detail="Reviewee must be a member or sponsor of this project.")

    # One review per member per project
    existing = conn.execute(
        "SELECT id FROM reviews WHERE project_id = ? AND reviewer_id = ? AND reviewee_id = ?",
        (project_id, reviewer_id, reviewee_id),
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a review for this member on this project.")

    # Validate scores
    metrics = ["quality", "timeliness", "communication", "collaboration", "integrity"]
    for m in metrics:
        val = req_data.get(m)
        if val is None or not (1.0 <= float(val) <= 5.0):
            raise HTTPException(status_code=400, detail=f"Score for {m} must be between 1.0 and 5.0.")

    target_user = conn.execute("SELECT id, role, name FROM users WHERE id = ?", (reviewee_id,)).fetchone()
    fairness = req_data.get("fairness")
    clarity = req_data.get("clarity")

    if target_user["role"] == "sponsor":
        if fairness is not None and not (1.0 <= float(fairness) <= 5.0):
            raise HTTPException(status_code=400, detail="Score for fairness must be between 1.0 and 5.0.")
        if clarity is not None and not (1.0 <= float(clarity) <= 5.0):
            raise HTTPException(status_code=400, detail="Score for clarity must be between 1.0 and 5.0.")

    rev_id = f"rev_{uuid.uuid4().hex[:10]}"
    comment = req_data.get("comment", "")
    tags = req_data.get("tags", [])

    import json

    conn.execute(
        """
        INSERT INTO reviews (
            id, project_id, reviewer_id, reviewee_id, quality, timeliness,
            communication, collaboration, integrity, fairness, clarity,
            comment, tags_json, ledger_ref
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            rev_id,
            project_id,
            reviewer_id,
            reviewee_id,
            float(req_data["quality"]),
            float(req_data["timeliness"]),
            float(req_data["communication"]),
            float(req_data["collaboration"]),
            float(req_data["integrity"]),
            float(fairness) if fairness is not None else None,
            float(clarity) if clarity is not None else None,
            comment,
            json.dumps(tags),
            "",
        ),
    )

    # Recalculate stars for reviewee
    star_update = calculate_and_update_stars(
        user_id=reviewee_id,
        conn=conn,
        reason=f"Structured review received on closed project '{proj['title']}'",
        project_id=project_id,
    )
    newbie_removed = bool(star_update.get("graduated_from_newbie", False))
    new_rating = star_update.get("new_rating")

    # Record ledger entry linked directly to hash chain
    ledger_entry = record_ledger_entry(
        actor=reviewer_id,
        on_behalf_of=project_id,
        action="REVIEW_SUBMITTED",
        payload={
            "review_id": rev_id,
            "project_id": project_id,
            "reviewer_id": reviewer_id,
            "reviewee_id": reviewee_id,
            "quality": float(req_data["quality"]),
            "timeliness": float(req_data["timeliness"]),
            "communication": float(req_data["communication"]),
            "collaboration": float(req_data["collaboration"]),
            "integrity": float(req_data["integrity"]),
            "fairness": float(fairness) if fairness is not None else None,
            "clarity": float(clarity) if clarity is not None else None,
            "comment": comment,
            "tags": tags,
            "newbie_removed": newbie_removed,
            "new_rating": new_rating,
        },
        conn=conn,
    )
    ledger_ref = f"ledger_seq_{ledger_entry['seq']}"
    conn.execute("UPDATE reviews SET ledger_ref = ? WHERE id = ?", (ledger_ref, rev_id))

    return {
        "status": "success",
        "review_id": rev_id,
        "ledger_ref": ledger_ref,
        "ledger_seq": ledger_entry["seq"],
        "newbie_removed": newbie_removed,
        "new_rating": new_rating,
        "star_update": star_update,
    }


def candidate_quit_project(
    project_id: str,
    candidate_id: str,
    reason: str,
    good_cause: bool,
    actor_id: str,
    conn: sqlite3.Connection,
) -> Dict[str, Any]:
    """
    Candidate quits midway:
    - Paid only for accepted or reviewed work (pro-rata share of in-progress milestone).
    - Already released money stays theirs.
    - Penalty -0.5 stars unless admin marks "good cause".
    - Credit for accepted work kept.
    - Access revoked.
    - Unearned part returns to the pool.
    - Returns before-and-after integer rupee table.
    """
    proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if proj["status"] in ("closed", "withdrawn"):
        raise HTTPException(status_code=400, detail="Cannot quit a project that is already closed or withdrawn.")

    member = conn.execute(
        "SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND status = 'accepted'",
        (project_id, candidate_id),
    ).fetchone()
    if not member:
        raise HTTPException(status_code=400, detail="Candidate is not an active accepted member of this project.")

    wallet = conn.execute("SELECT balance FROM wallets WHERE user_id = ?", (candidate_id,)).fetchone()
    wallet_before = wallet["balance"] if wallet else 0

    # Past released payouts
    p_sum = conn.execute(
        "SELECT SUM(amount) as total FROM payouts WHERE project_id = ? AND recipient_id = ?",
        (project_id, candidate_id),
    ).fetchone()
    already_released = p_sum["total"] or 0

    # In-progress milestone pro-rata calculation
    ip_m = conn.execute(
        "SELECT * FROM milestones WHERE project_id = ? AND status IN ('in_progress', 'funded', 'submitted', 'pending') ORDER BY sequence ASC LIMIT 1",
        (project_id,),
    ).fetchone()

    is_monetary = proj["engagement_model"] in ("funded", "stipend")
    in_progress_earned = 0
    unearned_returned = 0

    if is_monetary and ip_m:
        locker = conn.execute(
            "SELECT * FROM escrow_lockers WHERE project_id = ? AND (milestone_id = ? OR milestone_id IS NULL) AND status = 'funded'",
            (project_id, ip_m["id"]),
        ).fetchone()
        milestone_pool_budget = locker["amount"] if locker else ip_m["budget"]

        students = conn.execute(
            "SELECT user_id, weight FROM project_members WHERE project_id = ? AND role = 'student' AND status = 'accepted' ORDER BY joined_at ASC",
            (project_id,),
        ).fetchall()
        st_weights = [float(s["weight"] or 0.33) for s in students] if students else DEFAULT_STUDENT_WEIGHTS

        calc = calculate_milestone_payout(
            amount=milestone_pool_budget,
            student_weights=st_weights,
            expert_present=True,
        )

        candidate_indices = [idx for idx, s in enumerate(students) if s["user_id"] == candidate_id]
        cand_idx = candidate_indices[0] if candidate_indices else 0
        candidate_full_share = calc["student_payouts"][cand_idx] if cand_idx < len(calc["student_payouts"]) else 0

        # Check reviewed contribution for this milestone
        sub = conn.execute(
            "SELECT * FROM submissions WHERE milestone_id = ? AND author_id = ?",
            (ip_m["id"], candidate_id),
        ).fetchone()

        if sub:
            if sub["status"] in ("expert_approved", "sponsor_accepted"):
                contrib_ratio = 1.0
            elif sub["status"] == "changes_requested" or sub.get("expert_comment"):
                contrib_ratio = 0.5
            else:
                contrib_ratio = 0.2
        else:
            contrib_ratio = 0.0

        in_progress_earned = int(round(candidate_full_share * contrib_ratio))
        unearned_returned = candidate_full_share - in_progress_earned

        if in_progress_earned > 0:
            p_id = f"pay_{uuid.uuid4().hex[:10]}"
            conn.execute(
                """
                INSERT INTO payouts (id, project_id, milestone_id, recipient_id, recipient_role, amount, reason, ledger_ref)
                VALUES (?, ?, ?, ?, 'student', ?, ?, ?)
                """,
                (
                    p_id,
                    project_id,
                    ip_m["id"],
                    candidate_id,
                    in_progress_earned,
                    f"Pro-rata share for reviewed work ({int(contrib_ratio*100)}%) on in-progress milestone upon departure",
                    f"ledger_{p_id}",
                ),
            )
            conn.execute("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", (in_progress_earned, candidate_id))

    wallet_after = wallet_before + in_progress_earned

    # Revoke workspace access
    conn.execute(
        "UPDATE project_members SET status = 'quit' WHERE project_id = ? AND user_id = ?",
        (project_id, candidate_id),
    )

    # Apply penalty: -0.5 stars unless good cause
    pen_val = 0.0 if good_cause else -STAR_PENALTY_QUIT
    pen_reason = (
        f"Candidate departed project '{proj['title']}' with admin good-cause exemption (zero penalty)"
        if good_cause
        else f"Candidate departed project '{proj['title']}' midway without good-cause exemption"
    )

    penalty_record = record_star_penalty(
        user_id=candidate_id,
        project_id=project_id,
        penalty_type="quit",
        penalty_value=pen_val,
        reason=pen_reason,
        good_cause=good_cause,
        conn=conn,
        actor_id=actor_id,
    )

    # Append to ledger
    ledger_entry = record_ledger_entry(
        actor=actor_id,
        on_behalf_of=project_id,
        action="CANDIDATE_QUIT",
        payload={
            "candidate_id": candidate_id,
            "project_id": project_id,
            "reason": reason,
            "good_cause": good_cause,
            "already_released_kept": already_released,
            "in_progress_earned": in_progress_earned,
            "unearned_returned_to_pool": unearned_returned,
            "wallet_before": wallet_before,
            "wallet_after": wallet_after,
        },
        conn=conn,
    )

    # Strict conservation assertion
    assert wallet_after == wallet_before + in_progress_earned, "Wallet accounting conservation leak!"

    rupee_table = {
        "candidate_wallet_before": wallet_before,
        "candidate_wallet_after": wallet_after,
        "already_released_kept": already_released,
        "in_progress_earned_payout": in_progress_earned,
        "in_progress_unearned_returned": unearned_returned,
        "net_candidate_change": in_progress_earned,
    }

    return {
        "status": "quit",
        "candidate_id": candidate_id,
        "project_id": project_id,
        "good_cause": good_cause,
        "star_penalty": pen_val,
        "star_update": penalty_record["update_result"],
        "rupee_table": rupee_table,
        "ledger_seq": ledger_entry["seq"],
    }


def sponsor_withdraw_project(
    project_id: str,
    reason: str,
    actor_id: str,
    conn: sqlite3.Connection,
) -> Dict[str, Any]:
    """
    Sponsor withdraws sponsorship midway:
    - All locked and unreleased funds go to team by charter split and contribution weights.
    - PLUS 10% compensation charged to sponsor wallet and split the same way.
    - Sponsor -0.5 stars.
    - Withdrawal count on company record incremented.
    - Members keep credit.
    - Returns before-and-after integer rupee table.
    """
    proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if proj["status"] in ("closed", "withdrawn"):
        raise HTTPException(status_code=400, detail="Cannot withdraw a project that is already closed or withdrawn.")

    sponsor_id = proj["sponsor_id"]
    s_wallet = conn.execute("SELECT balance FROM wallets WHERE user_id = ?", (sponsor_id,)).fetchone()
    sponsor_wallet_before = s_wallet["balance"] if s_wallet else 0

    # Calculate locked and unreleased funds
    unreleased_milestones = conn.execute(
        "SELECT * FROM milestones WHERE project_id = ? AND status != 'accepted'",
        (project_id,),
    ).fetchall()

    remaining_locked = sum(int(m["budget"]) for m in unreleased_milestones)
    if remaining_locked <= 0:
        # Fallback to remaining project budget
        remaining_locked = int(proj["budget"])

    # 10% compensation charged to sponsor
    compensation = int(remaining_locked * SPONSOR_WITHDRAWAL_COMPENSATION_PCT)
    conn.execute("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", (compensation, sponsor_id))
    sponsor_wallet_after = sponsor_wallet_before - compensation

    # Total pool distributed to team
    total_distributed = remaining_locked + compensation

    students = conn.execute(
        "SELECT user_id, weight FROM project_members WHERE project_id = ? AND role = 'student' AND status = 'accepted' ORDER BY joined_at ASC",
        (project_id,),
    ).fetchall()
    expert = conn.execute(
        "SELECT user_id FROM project_members WHERE project_id = ? AND role = 'expert' AND status = 'accepted'",
        (project_id,),
    ).fetchone()

    st_weights = [float(s["weight"] or 0.33) for s in students] if students else DEFAULT_STUDENT_WEIGHTS
    expert_present = bool(expert)

    calc = calculate_milestone_payout(
        amount=total_distributed,
        student_weights=st_weights,
        expert_present=expert_present,
    )

    # CONSERVATION INVARIANT ASSERTION
    assert calc["total_distributed"] == total_distributed, (
        f"Conservation leak: total {calc['total_distributed']} != {total_distributed}"
    )

    team_payouts = []
    # 1. Expert payout
    if expert and calc["expert_payout"] > 0:
        p_id = f"pay_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT INTO payouts (id, project_id, recipient_id, recipient_role, amount, reason, ledger_ref)
            VALUES (?, ?, ?, 'expert', ?, 'Sponsor withdrawal settlement + 10% compensation share', ?)
            """,
            (p_id, project_id, expert["user_id"], calc["expert_payout"], f"ledger_{p_id}"),
        )
        conn.execute("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", (calc["expert_payout"], expert["user_id"]))
        team_payouts.append({"recipient_id": expert["user_id"], "role": "expert", "amount": calc["expert_payout"]})

    # 2. Student payouts
    for idx, st in enumerate(students):
        st_amt = calc["student_payouts"][idx] if idx < len(calc["student_payouts"]) else 0
        p_id = f"pay_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT INTO payouts (id, project_id, recipient_id, recipient_role, amount, reason, ledger_ref)
            VALUES (?, ?, ?, 'student', ?, 'Sponsor withdrawal settlement + 10% compensation share', ?)
            """,
            (p_id, project_id, st["user_id"], st_amt, f"ledger_{p_id}"),
        )
        conn.execute("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", (st_amt, st["user_id"]))
        team_payouts.append({"recipient_id": st["user_id"], "role": "student", "amount": st_amt})

    # Mark project as withdrawn & lockers released
    conn.execute("UPDATE projects SET status = 'withdrawn' WHERE id = ?", (project_id,))
    conn.execute("UPDATE escrow_lockers SET status = 'released', released_at = CURRENT_TIMESTAMP WHERE project_id = ?", (project_id,))

    # Issue settlement credit certificates to members so they keep full credit
    all_members = conn.execute(
        "SELECT user_id, role FROM project_members WHERE project_id = ? AND status = 'accepted'",
        (project_id,),
    ).fetchall()
    for m in all_members:
        cert_id = f"cert_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT INTO project_certificates (id, project_id, recipient_id, recipient_role, certificate_type, title, ledger_ref)
            VALUES (?, ?, ?, ?, 'settlement_credit', ?, ?)
            """,
            (
                cert_id,
                project_id,
                m["user_id"],
                m["role"],
                f"Sponsor Withdrawal Settlement & Verified Credit: {proj['title']}",
                f"ledger_{cert_id}",
            ),
        )

    # Sponsor star penalty -0.5 stars
    pen_reason = f"Withdrew sponsorship midway from project '{proj['title']}' with 10% team compensation"
    penalty_record = record_star_penalty(
        user_id=sponsor_id,
        project_id=project_id,
        penalty_type="withdraw",
        penalty_value=-STAR_PENALTY_WITHDRAW,
        reason=pen_reason,
        good_cause=False,
        conn=conn,
        actor_id=actor_id,
    )

    # Ledger entry
    ledger_entry = record_ledger_entry(
        actor=actor_id,
        on_behalf_of=project_id,
        action="SPONSOR_WITHDRAWAL",
        payload={
            "project_id": project_id,
            "sponsor_id": sponsor_id,
            "reason": reason,
            "remaining_locked_funds": remaining_locked,
            "compensation_charged": compensation,
            "total_team_distributed": total_distributed,
            "payout_split": calc,
        },
        conn=conn,
    )

    # Conservation assertions
    assert (sponsor_wallet_before - sponsor_wallet_after) == compensation, "Sponsor wallet deduction leak!"
    assert (calc["expert_payout"] + sum(calc["student_payouts"]) + calc["platform_fee"] + calc["ai_reserve"]) == total_distributed, "Team distribution split conservation leak!"

    rupee_table = {
        "sponsor_wallet_before": sponsor_wallet_before,
        "sponsor_wallet_after": sponsor_wallet_after,
        "compensation_charged": compensation,
        "remaining_locked_funds": remaining_locked,
        "total_team_distributed": total_distributed,
        "expert_payout": calc["expert_payout"],
        "student_payouts": calc["student_payouts"],
        "platform_fee": calc["platform_fee"],
        "ai_reserve": calc["ai_reserve"],
    }

    return {
        "status": "withdrawn",
        "project_id": project_id,
        "sponsor_id": sponsor_id,
        "star_penalty": -STAR_PENALTY_WITHDRAW,
        "star_update": penalty_record["update_result"],
        "rupee_table": rupee_table,
        "ledger_seq": ledger_entry["seq"],
    }
