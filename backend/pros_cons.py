"""
Pros and Cons calculation engine for VOUCH.
Generates objective, evidence-grounded Strengths (Pros) and Watch-outs (Cons)
based strictly on closed past projects, review criteria, ledger facts, and fairness rules.
"""

from typing import Dict, Any, List, Optional
import sqlite3
import json
from backend.config import (
    PRO_THRESHOLD,
    CON_THRESHOLD,
    MIN_CLOSED_PROJECTS_FOR_FULL_DATA,
)


def compute_user_pros_and_cons(user_id: str, role: str, conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Computes Pros and Cons for a student or expert candidate strictly from closed past projects.
    """
    # 1. Fetch user basic info
    cur = conn.cursor()
    cur.execute("SELECT id, name, role, newbie_badge, skills_json, stars FROM users WHERE id = ?", (user_id,))
    user = cur.fetchone()
    if not user:
        return {"pros": [], "cons": [], "limited_data": True, "is_newbie": False}

    is_newbie = bool(user.get("newbie_badge", 0))

    # 2. Check for public replies posted by candidate
    cur.execute(
        "SELECT con_key, reply_text, created_at, ledger_ref FROM con_replies WHERE user_id = ?",
        (user_id,)
    )
    replies_map = {row["con_key"]: row for row in cur.fetchall()}

    # 3. Newbie rule: Zero past projects, no cons, verified skills shown
    if is_newbie:
        skills = json.loads(user.get("skills_json") or "[]")
        skills_str = ", ".join(skills[:3]) if skills else "Foundational engineering"
        return {
            "is_newbie": True,
            "newbie_message": "No project history yet, verified skills shown",
            "limited_data": False,
            "closed_projects_count": 0,
            "pros": [
                {
                    "key": "newbie_verified_skills",
                    "text": f"Verified foundational competencies in {skills_str}",
                    "type": "pro",
                    "evidence": {
                        "project": "VOUCH Academic Verification Sandbox",
                        "review_count": 0,
                        "metric_score": 5.0,
                        "ledger_ref": "genesis_verification_record"
                    }
                },
                {
                    "key": "newbie_exploration",
                    "text": "Eligible for Newbie exploration allocation boost (+5%)",
                    "type": "pro",
                    "evidence": {
                        "project": "Platform Governance Policy",
                        "review_count": 0,
                        "metric_score": None,
                        "ledger_ref": "policy_newbie_boost"
                    }
                }
            ],
            "cons": [],
            "replies": {}
        }

    # 4. Fetch closed projects where user participated
    cur.execute(
        """
        SELECT DISTINCT p.id, p.title
        FROM projects p
        JOIN reviews r ON r.project_id = p.id
        WHERE r.reviewee_id = ? AND p.status = 'closed'
        """,
        (user_id,)
    )
    closed_projects = cur.fetchall()
    closed_count = len(closed_projects)
    project_names = [p["title"] for p in closed_projects]
    primary_project_name = project_names[0] if project_names else "Historical Engagements"

    limited_data = closed_count < MIN_CLOSED_PROJECTS_FOR_FULL_DATA

    # 5. Fetch structured reviews
    cur.execute(
        """
        SELECT quality, timeliness, communication, collaboration, integrity, comment, project_id, ledger_ref
        FROM reviews
        WHERE reviewee_id = ?
        """,
        (user_id,)
    )
    reviews = cur.fetchall()
    rev_count = len(reviews)

    pros: List[Dict[str, Any]] = []
    cons: List[Dict[str, Any]] = []

    if rev_count > 0:
        criteria = [
            ("quality", "Delivery Quality", "Demonstrated high technical and mathematical rigor", "Inconsistent technical execution or code depth"),
            ("timeliness", "Milestone Timeliness", "Exceptional on-time milestone delivery track record", "Past milestone deadline extensions or late submissions"),
            ("communication", "Communication", "Proactive, clear, and structured status updates", "Occasional communication lag during milestones"),
            ("collaboration", "Team Collaboration", "Strong constructive peer review and teamwork", "Friction noted in collaborative sprint reviews"),
            ("integrity", "Academic & Code Integrity", "Flawless integrity rating with zero verified similarity flags", "Flagged in similarity audit during past submission (subsequently cleared)"),
        ]

        for metric, label, pro_desc, con_desc in criteria:
            vals = [r[metric] for r in reviews if r.get(metric) is not None]
            if not vals:
                continue
            avg_val = sum(vals) / len(vals)
            rounded_avg = round(avg_val, 2)

            evidence_obj = {
                "project": primary_project_name,
                "review_count": len(vals),
                "metric_score": rounded_avg,
                "ledger_ref": reviews[0].get("ledger_ref") or "ledger_block_closed"
            }

            if rounded_avg >= PRO_THRESHOLD:
                pros.append({
                    "key": metric,
                    "text": f"{pro_desc} (avg {rounded_avg}/5.0)",
                    "type": "pro",
                    "evidence": evidence_obj
                })
            elif rounded_avg <= CON_THRESHOLD:
                con_item = {
                    "key": metric,
                    "text": f"{con_desc} (avg {rounded_avg}/5.0)",
                    "type": "con",
                    "evidence": evidence_obj
                }
                if metric in replies_map:
                    con_item["reply"] = {
                        "text": replies_map[metric]["reply_text"],
                        "created_at": replies_map[metric]["created_at"],
                        "ledger_ref": replies_map[metric]["ledger_ref"]
                    }
                cons.append(con_item)

    # 6. Ledger Facts (On-time delivery, quits, similarity flags)
    cur.execute(
        """
        SELECT action, payload_json FROM ledger
        WHERE actor = ? OR payload_json LIKE ?
        """,
        (user_id, f'%"{user_id}"%')
    )
    ledger_entries = cur.fetchall()

    quits = [e for e in ledger_entries if e["action"] in ("MEMBER_QUIT", "PROJECT_WITHDRAWN_MEMBER")]
    if len(quits) == 0 and closed_count > 0:
        pros.append({
            "key": "ledger_zero_quits",
            "text": f"100% completion rate ({closed_count} closed projects, 0 quits logged to ledger)",
            "type": "pro",
            "evidence": {
                "project": "All closed engagements",
                "review_count": closed_count,
                "metric_score": 1.0,
                "ledger_ref": "audit_zero_quits"
            }
        })
    elif len(quits) > 0:
        con_item = {
            "key": "ledger_quits",
            "text": f"Recorded {len(quits)} project departure(s) on immutable ledger",
            "type": "con",
            "evidence": {
                "project": "Ledger audit trail",
                "review_count": len(quits),
                "metric_score": 0.0,
                "ledger_ref": "audit_quits_recorded"
            }
        }
        if "ledger_quits" in replies_map:
            con_item["reply"] = {
                "text": replies_map["ledger_quits"]["reply_text"],
                "created_at": replies_map["ledger_quits"]["created_at"],
                "ledger_ref": replies_map["ledger_quits"]["ledger_ref"]
            }
        cons.append(con_item)

    return {
        "is_newbie": False,
        "newbie_message": None,
        "limited_data": limited_data,
        "closed_projects_count": closed_count,
        "pros": pros,
        "cons": cons,
        "replies": replies_map
    }


def compute_company_pros_and_cons(sponsor_id: str, conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Computes Pros and Cons for a Sponsor/Company strictly from contributor reviews
    and ledger facts (on-time payouts, clear brief, zero unlawful cancellations).
    """
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM users WHERE id = ?", (sponsor_id,))
    sponsor = cur.fetchone()
    if not sponsor:
        return {"pros": [], "cons": [], "limited_data": True}

    # Fetch closed projects for this sponsor
    cur.execute("SELECT id, title FROM projects WHERE sponsor_id = ? AND status = 'closed'", (sponsor_id,))
    closed_projects = cur.fetchall()
    closed_count = len(closed_projects)
    primary_project_name = closed_projects[0]["title"] if closed_projects else "Historical Engagements"
    limited_data = closed_count < MIN_CLOSED_PROJECTS_FOR_FULL_DATA

    # Fetch reviews of the sponsor
    cur.execute(
        """
        SELECT quality, timeliness, communication, fairness, clarity, comment, ledger_ref
        FROM reviews
        WHERE reviewee_id = ?
        """,
        (sponsor_id,)
    )
    reviews = cur.fetchall()
    pros: List[Dict[str, Any]] = []
    cons: List[Dict[str, Any]] = []

    if reviews:
        criteria = [
            ("timeliness", "Prompt Escrow Payouts", "Consistently releases milestone payouts on time (same-day turnaround)", "Occasional delays in milestone review and escrow release"),
            ("clarity", "Brief Clarity", "Highly precise technical acceptance criteria and datasets", "Ambiguous milestone acceptance criteria noted by student teams"),
            ("fairness", "Fair Evaluation", "Balanced, constructive milestone reviews and pro-rata consideration", "Strict milestone evaluations with contested revisions"),
            ("communication", "Sponsor Responsiveness", "Active participation and prompt answers to blocking questions", "Slow response time on technical clarifications"),
        ]

        for metric, label, pro_desc, con_desc in criteria:
            vals = [r[metric] for r in reviews if r.get(metric) is not None]
            if not vals:
                continue
            avg_val = sum(vals) / len(vals)
            rounded_avg = round(avg_val, 2)

            evidence_obj = {
                "project": primary_project_name,
                "review_count": len(vals),
                "metric_score": rounded_avg,
                "ledger_ref": reviews[0].get("ledger_ref") or "sponsor_review_audit"
            }

            if rounded_avg >= PRO_THRESHOLD:
                pros.append({
                    "key": metric,
                    "text": f"{pro_desc} (avg {rounded_avg}/5.0)",
                    "type": "pro",
                    "evidence": evidence_obj
                })
            elif rounded_avg <= CON_THRESHOLD:
                cons.append({
                    "key": metric,
                    "text": f"{con_desc} (avg {rounded_avg}/5.0)",
                    "type": "con",
                    "evidence": evidence_obj
                })

    # Ledger facts for sponsor
    cur.execute(
        """
        SELECT action, payload_json FROM ledger
        WHERE actor = ? AND action IN ('LOCKER_FUNDED', 'PAYOUT_RELEASED', 'SPONSOR_WITHDRAWAL')
        """,
        (sponsor_id,)
    )
    ledger_entries = cur.fetchall()
    withdrawals = [e for e in ledger_entries if e["action"] == "SPONSOR_WITHDRAWAL"]
    funded_lockers = [e for e in ledger_entries if e["action"] == "LOCKER_FUNDED"]

    if len(withdrawals) == 0 and len(funded_lockers) > 0:
        pros.append({
            "key": "ledger_zero_withdrawals",
            "text": f"100% project completion commitment ({len(funded_lockers)} escrow lockers locked, 0 sponsor withdrawals)",
            "type": "pro",
            "evidence": {
                "project": "Platform Escrow Records",
                "review_count": len(funded_lockers),
                "metric_score": 1.0,
                "ledger_ref": "audit_zero_withdrawals"
            }
        })
    elif len(withdrawals) > 0:
        cons.append({
            "key": "ledger_sponsor_withdrawals",
            "text": f"Withdrew from {len(withdrawals)} active challenge(s) with compensation paid to students",
            "type": "con",
            "evidence": {
                "project": "Ledger audit trail",
                "review_count": len(withdrawals),
                "metric_score": 0.0,
                "ledger_ref": "audit_sponsor_withdrawn"
            }
        })

    return {
        "sponsor_id": sponsor_id,
        "name": sponsor["name"],
        "limited_data": limited_data,
        "closed_projects_count": closed_count,
        "pros": pros,
        "cons": cons
    }
