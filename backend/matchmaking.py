"""
Matchmaking Engine for VOUCH.
Implements the 5-factor weighted scoring formula:
Score = 0.50 * skill_fit + 0.25 * verified_similar_projects + 0.15 * stars + 0.10 * availability + newbie_boost
Includes conflict-of-interest exclusion logged to ledger, plain-language reasons,
and integration with the Pros and Cons engine.
"""

import json
import sqlite3
from typing import Dict, Any, List, Optional
from backend.config import (
    MATCH_WEIGHT_SKILL,
    MATCH_WEIGHT_SIMILAR_PROJECTS,
    MATCH_WEIGHT_STARS,
    MATCH_WEIGHT_AVAILABILITY,
    NEWBIE_EXPLORATION_BOOST,
)
from backend.pros_cons import compute_user_pros_and_cons
from backend.ledger import record_ledger_entry


def get_project_required_skills(project_id: str, conn: sqlite3.Connection) -> List[str]:
    """Extracts all required skills across a project's milestones."""
    cur = conn.cursor()
    cur.execute("SELECT skills_json FROM milestones WHERE project_id = ?", (project_id,))
    milestone_rows = cur.fetchall()
    required_skills = set()
    for row in milestone_rows:
        try:
            skills = json.loads(row["skills_json"] or "[]")
            for s in skills:
                required_skills.add(s.strip().lower())
        except Exception:
            pass
    
    # If milestones have no explicit skills yet, extract from title & summary
    if not required_skills:
        cur.execute("SELECT title, public_summary FROM projects WHERE id = ?", (project_id,))
        proj = cur.fetchone()
        if proj:
            text = f"{proj['title']} {proj['public_summary']}".lower()
            standard_skills = [
                "pytorch", "tensorflow", "tensorflow lite", "embedded systems",
                "computer vision", "edge ai", "medical imaging", "model quantization",
                "python", "opencv", "fastapi", "model compression", "deep learning",
                "clinical validation", "nlp", "linear algebra"
            ]
            for sk in standard_skills:
                if sk in text:
                    required_skills.add(sk)

    return list(required_skills)


def calculate_candidate_match(
    candidate: Dict[str, Any],
    project: Dict[str, Any],
    required_skills: List[str],
    conn: sqlite3.Connection
) -> Dict[str, Any]:
    """Calculates match breakdown and score for a single candidate."""
    cand_id = candidate["id"]
    cand_skills = [s.strip().lower() for s in json.loads(candidate.get("skills_json") or "[]")]
    
    # 1. Skill Fit (0.0 to 1.0)
    if required_skills:
        matched_skills = [s for s in cand_skills if s in required_skills]
        # Partial substring match if exact match not found
        for s in cand_skills:
            if s not in matched_skills:
                for req in required_skills:
                    if req in s or s in req:
                        matched_skills.append(s)
                        break
        skill_fit = min(1.0, len(set(matched_skills)) / max(1, len(set(required_skills))))
    else:
        skill_fit = 0.8  # neutral baseline if unstated

    # 2. Verified Similar Projects
    cur = conn.cursor()
    cur.execute(
        """
        SELECT COUNT(DISTINCT p.id) as closed_count
        FROM projects p
        JOIN reviews r ON r.project_id = p.id
        WHERE r.reviewee_id = ? AND p.status = 'closed'
        """,
        (cand_id,)
    )
    closed_row = cur.fetchone()
    closed_count = closed_row["closed_count"] if closed_row else 0
    # Normalize: 2+ verified projects gives full score 1.0
    similar_projects = min(1.0, closed_count / 2.0)

    # 3. Stars rating
    stars_val = candidate.get("stars")
    is_newbie = bool(candidate.get("newbie_badge", 0))
    if stars_val is not None:
        stars_score = min(1.0, float(stars_val) / 5.0)
    else:
        # Default baseline for unrated candidates
        stars_score = 0.70

    # 4. Availability (hours/40)
    hours = candidate.get("weekly_hours") or 20
    availability = min(1.0, hours / 40.0)

    # 5. Newbie boost
    newbie_boost = NEWBIE_EXPLORATION_BOOST if is_newbie else 0.0

    # Total Score Formula
    total_score = (
        (MATCH_WEIGHT_SKILL * skill_fit) +
        (MATCH_WEIGHT_SIMILAR_PROJECTS * similar_projects) +
        (MATCH_WEIGHT_STARS * stars_score) +
        (MATCH_WEIGHT_AVAILABILITY * availability) +
        newbie_boost
    )
    total_score = round(min(1.0, total_score), 3)

    # Generate plain-language reason
    reasons = []
    if skill_fit >= 0.75:
        reasons.append(f"Strong skill alignment ({int(skill_fit * 100)}% match)")
    elif skill_fit >= 0.40:
        reasons.append(f"Moderate skill overlap ({int(skill_fit * 100)}% match)")
    else:
        reasons.append("Adjacent engineering background")

    if closed_count >= 2:
        reasons.append(f"{closed_count} verified closed projects on ledger")
    elif closed_count == 1:
        reasons.append("1 verified completed project")

    if stars_val:
        reasons.append(f"{stars_val}⭐ track record")

    if is_newbie:
        reasons.append(f"+{int(NEWBIE_EXPLORATION_BOOST * 100)}% Newbie exploration allocation boost applied")

    reasons.append(f"{hours}h/wk available")

    # Pros and Cons
    pros_cons = compute_user_pros_and_cons(cand_id, candidate["role"], conn)

    return {
        "candidate_id": cand_id,
        "name": candidate["name"],
        "email": candidate["email"],
        "role": candidate["role"],
        "headline": candidate["headline"],
        "skills": json.loads(candidate.get("skills_json") or "[]"),
        "stars": stars_val,
        "is_newbie": is_newbie,
        "total_score": total_score,
        "score_pct": int(round(total_score * 100)),
        "sub_scores": {
            "skill_fit": round(skill_fit, 2),
            "similar_projects": round(similar_projects, 2),
            "stars": round(stars_score, 2),
            "availability": round(availability, 2),
            "newbie_boost": newbie_boost,
        },
        "reason_summary": " • ".join(reasons),
        "pros_cons": pros_cons,
    }


def get_project_candidate_matches(
    project_id: str,
    conn: sqlite3.Connection,
    log_exclusions: bool = True
) -> Dict[str, Any]:
    """
    Ranks candidates for a project. Excludes conflicting experts and logs to ledger.
    Returns:
    {
      "project_id": str,
      "ranked_students": [...],
      "ranked_experts": [...],
      "conflicted_candidates": [...]
    }
    """
    cur = conn.cursor()
    # 1. Fetch project info
    cur.execute("SELECT id, title, public_summary, sponsor_id, budget, engagement_model FROM projects WHERE id = ?", (project_id,))
    project = cur.fetchone()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    sponsor_id = project["sponsor_id"]
    required_skills = get_project_required_skills(project_id, conn)

    # 2. Check conflicts of interest with this sponsor
    cur.execute(
        "SELECT id, expert_id, reason FROM conflicts_of_interest WHERE sponsor_id = ?",
        (sponsor_id,)
    )
    conflicts = {c["expert_id"]: c["reason"] for c in cur.fetchall()}

    # 3. Fetch all active students and experts
    cur.execute(
        "SELECT id, email, role, name, headline, skills_json, weekly_hours, stars, newbie_badge FROM users WHERE role IN ('student', 'expert')"
    )
    all_candidates = cur.fetchall()

    ranked_students = []
    ranked_experts = []
    conflicted_candidates = []

    for cand in all_candidates:
        cand_id = cand["id"]
        # Conflict check
        if cand_id in conflicts:
            conflict_reason = conflicts[cand_id]
            conflicted_info = {
                "candidate_id": cand_id,
                "name": cand["name"],
                "role": cand["role"],
                "headline": cand["headline"],
                "excluded_conflict": True,
                "conflict_reason": conflict_reason,
            }
            conflicted_candidates.append(conflicted_info)

            # Log to ledger if requested
            if log_exclusions:
                cur.execute(
                    "SELECT 1 FROM ledger WHERE action = 'CANDIDATE_CONFLICT_EXCLUDED' AND payload_json LIKE ?",
                    (f'%"{cand_id}"%',)
                )
                already_logged = cur.fetchone()
                if not already_logged:
                    record_ledger_entry(
                        actor=sponsor_id,
                        action="CANDIDATE_CONFLICT_EXCLUDED",
                        payload={
                            "project_id": project_id,
                            "candidate_id": cand_id,
                            "candidate_name": cand["name"],
                            "reason": conflict_reason
                        },
                        conn=conn
                    )
            continue

        match_data = calculate_candidate_match(cand, project, required_skills, conn)
        if cand["role"] == "student":
            ranked_students.append(match_data)
        elif cand["role"] == "expert":
            ranked_experts.append(match_data)

    # Sort descending by match score
    ranked_students.sort(key=lambda x: x["total_score"], reverse=True)
    ranked_experts.sort(key=lambda x: x["total_score"], reverse=True)

    return {
        "project_id": project_id,
        "project_title": project["title"],
        "required_skills": required_skills,
        "ranked_students": ranked_students,
        "ranked_experts": ranked_experts,
        "conflicted_candidates": conflicted_candidates,
    }
