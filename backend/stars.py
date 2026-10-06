"""
Star Engine for VOUCH.
Implements Section 6 of SPEC.md:
- Rating = average of reviews from members of CLOSED projects only.
- Repeated high ratings between the same pair are down-weighted.
- Penalty adjustments recorded (e.g. -0.5 for midway quit or sponsor withdrawal).
- Rating floor 1.0 (RATING_MIN).
- Newbie badge removed after first completed project with closed review.
- Every star change stores reason, delta, and ledger seq, appearing in "Why did my rating change?".
"""

import uuid
import sqlite3
from typing import Dict, Any, Optional, List
from backend.config import (
    RATING_MIN,
    RATING_MAX,
    STAR_PENALTY_QUIT,
    STAR_PENALTY_WITHDRAW,
    REPEAT_HIGH_RATING_THRESHOLD,
    REPEAT_PAIR_DECAY,
)
from backend.ledger import record_ledger_entry


def calculate_user_stars(user_id: str, conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Computes user stars based strictly on closed-project reviews,
    applying pairwise repeat down-weighting and recorded active penalties.
    """
    user = conn.execute(
        "SELECT id, role, name, stars, newbie_badge FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    if not user:
        return {
            "user_id": user_id,
            "base_stars": None,
            "total_penalties": 0.0,
            "effective_stars": None,
            "graduated_from_newbie": False,
            "reviews_count": 0,
            "total_weight": 0.0,
            "downweighted_count": 0,
        }

    # Fetch reviews strictly on closed projects
    reviews = conn.execute(
        """
        SELECT r.*, p.status as project_status, p.title as project_title
        FROM reviews r
        JOIN projects p ON p.id = r.project_id
        WHERE r.reviewee_id = ? AND p.status = 'closed'
        ORDER BY r.created_at ASC, r.id ASC
        """,
        (user_id,),
    ).fetchall()

    reviewer_high_counts: Dict[str, int] = {}
    total_weighted_score = 0.0
    total_weight = 0.0
    reviews_processed = []

    for r in reviews:
        reviewer_id = r["reviewer_id"]
        metrics = [
            r.get("quality"),
            r.get("timeliness"),
            r.get("communication"),
            r.get("collaboration"),
            r.get("integrity"),
        ]
        if user["role"] == "sponsor":
            if r.get("fairness") is not None:
                metrics.append(r["fairness"])
            if r.get("clarity") is not None:
                metrics.append(r["clarity"])

        valid_metrics = [float(m) for m in metrics if m is not None]
        if not valid_metrics:
            continue

        mean_score = sum(valid_metrics) / len(valid_metrics)

        # Down-weight repeated high ratings between the same pair
        if mean_score >= REPEAT_HIGH_RATING_THRESHOLD:
            prior_count = reviewer_high_counts.get(reviewer_id, 0)
            weight = REPEAT_PAIR_DECAY ** prior_count
            reviewer_high_counts[reviewer_id] = prior_count + 1
        else:
            weight = 1.0

        total_weighted_score += mean_score * weight
        total_weight += weight
        reviews_processed.append({
            "id": r["id"],
            "reviewer_id": reviewer_id,
            "mean_score": mean_score,
            "weight": weight,
        })

    base_stars = (total_weighted_score / total_weight) if total_weight > 0 else None

    # Active recorded penalties (good_cause = 0)
    penalties = conn.execute(
        "SELECT penalty_value FROM star_penalties WHERE user_id = ? AND good_cause = 0",
        (user_id,),
    ).fetchall()
    total_penalties = sum(float(p["penalty_value"]) for p in penalties)

    graduated_from_newbie = False
    effective_stars: Optional[float] = None

    if base_stars is not None:
        raw_stars = base_stars + total_penalties
        effective_stars = max(RATING_MIN, min(RATING_MAX, round(raw_stars, 2)))
        graduated_from_newbie = bool(user["newbie_badge"])
    else:
        # No closed reviews yet
        if user["newbie_badge"] == 1:
            if total_penalties < 0:
                # Quits without good cause incur penalty even for newbie
                raw_stars = 5.0 + total_penalties
                effective_stars = max(RATING_MIN, min(RATING_MAX, round(raw_stars, 2)))
            else:
                effective_stars = None  # Stays Newbie with verified skills shown
        else:
            init_stars = float(user["stars"]) if user["stars"] is not None else 5.0
            raw_stars = init_stars + total_penalties
            effective_stars = max(RATING_MIN, min(RATING_MAX, round(raw_stars, 2)))

    return {
        "user_id": user_id,
        "role": user["role"],
        "old_stars": user["stars"],
        "base_stars": round(base_stars, 2) if base_stars is not None else None,
        "total_penalties": round(total_penalties, 2),
        "effective_stars": effective_stars,
        "graduated_from_newbie": graduated_from_newbie,
        "reviews_count": len(reviews_processed),
        "total_weight": round(total_weight, 3),
        "downweighted_count": sum(1 for r in reviews_processed if r["weight"] < 1.0),
    }


def calculate_and_update_stars(
    user_id: str,
    conn: sqlite3.Connection,
    reason: str,
    project_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Recalculates stars for a user, updates database, records a ledger entry,
    creates a ratings_history record with reason and ledger seq, and notifies the user.
    """
    user = conn.execute(
        "SELECT id, role, name, stars, newbie_badge FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    if not user:
        return {}

    calc = calculate_user_stars(user_id, conn)
    old_rating = user["stars"]
    new_rating = calc["effective_stars"]
    old_newbie = user["newbie_badge"]
    new_newbie = 0 if calc["graduated_from_newbie"] else old_newbie

    # Only record update if rating changed, newbie graduated, or explicit update requested
    should_update = (new_rating is not None and (old_rating != new_rating or old_newbie != new_newbie))

    if should_update:
        delta = round((new_rating - old_rating) if (old_rating is not None and new_rating is not None) else 0.0, 2)
        if old_rating is None and new_rating is not None:
            # Graduated from newbie
            delta = round(new_rating, 2)

        # Update users table
        conn.execute(
            "UPDATE users SET stars = ?, newbie_badge = ? WHERE id = ?",
            (new_rating, new_newbie, user_id),
        )

        # Cryptographic ledger entry
        ledger_entry = record_ledger_entry(
            actor=user_id,
            on_behalf_of=user_id,
            action="STAR_RATING_UPDATED",
            payload={
                "user_id": user_id,
                "old_rating": old_rating,
                "new_rating": new_rating,
                "delta": delta,
                "reason": reason,
                "project_id": project_id,
                "graduated_from_newbie": calc["graduated_from_newbie"],
                "total_penalties": calc["total_penalties"],
                "base_stars": calc["base_stars"],
            },
            conn=conn,
        )

        # Store in ratings_history
        rh_id = f"rh_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT INTO ratings_history (id, user_id, old_rating, new_rating, delta, reason, ledger_seq)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (rh_id, user_id, old_rating, new_rating, delta, reason, ledger_entry["seq"]),
        )

        # Send notification
        conn.execute(
            """
            INSERT INTO notifications (id, user_id, title, message, link, read)
            VALUES (?, ?, ?, ?, ?, 0)
            """,
            (
                f"notif_{uuid.uuid4().hex[:10]}",
                user_id,
                "Rating Updated",
                f"Your star rating changed to {new_rating} ⭐. Reason: {reason}",
                "/profile",
            ),
        )

        return {
            "user_id": user_id,
            "old_rating": old_rating,
            "new_rating": new_rating,
            "delta": delta,
            "newbie_badge": new_newbie,
            "graduated_from_newbie": calc["graduated_from_newbie"],
            "reason": reason,
            "ledger_seq": ledger_entry["seq"],
        }

    return {
        "user_id": user_id,
        "old_rating": old_rating,
        "new_rating": old_rating,
        "delta": 0.0,
        "newbie_badge": old_newbie,
        "graduated_from_newbie": False,
        "reason": "Rating unchanged",
    }


def record_star_penalty(
    user_id: str,
    project_id: Optional[str],
    penalty_type: str,
    penalty_value: float,
    reason: str,
    good_cause: bool,
    conn: sqlite3.Connection,
    actor_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Records a penalty in star_penalties table, logs ledger event,
    and recalculates user stars.
    """
    pen_id = f"pen_{uuid.uuid4().hex[:10]}"
    effective_val = 0.0 if good_cause else penalty_value

    conn.execute(
        """
        INSERT INTO star_penalties (id, user_id, project_id, penalty_type, penalty_value, reason, good_cause)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (pen_id, user_id, project_id, penalty_type, effective_val, reason, 1 if good_cause else 0),
    )

    record_ledger_entry(
        actor=actor_id or user_id,
        on_behalf_of=project_id or user_id,
        action="STAR_PENALTY_RECORDED",
        payload={
            "penalty_id": pen_id,
            "user_id": user_id,
            "project_id": project_id,
            "penalty_type": penalty_type,
            "penalty_value": effective_val,
            "good_cause": good_cause,
            "reason": reason,
        },
        conn=conn,
    )

    update_res = calculate_and_update_stars(
        user_id=user_id,
        conn=conn,
        reason=reason,
        project_id=project_id,
    )

    return {
        "penalty_id": pen_id,
        "effective_penalty": effective_val,
        "good_cause": good_cause,
        "update_result": update_res,
    }
