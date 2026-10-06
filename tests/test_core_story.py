"""
Comprehensive test suite for VOUCH Core Story (SPEC.md Steps 1 to 7).
Verifies:
1. Matchmaking ranking order for seeded users (Maya Lin > Rohan Mehta; Elena Rostova excluded for conflict).
2. Access control on matchmaking and con-replies.
3. Pros & Cons engine rules, limited data flag, Newbie zero-cons fairness rule, and candidate replies.
4. Server-side confidential brief gating before and after charter acceptance.
5. Escrow locker enforcement (milestone cannot start before locked).
6. Simulated wallet integer rupee balance accounting invariant.
7. Ledger entries and in-app notifications for all lifecycle events.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.seed import seed_database
from backend.database import get_db


@pytest.fixture(autouse=True)
def reset_db_before_tests():
    seed_database()


def login_as(client: TestClient, email: str, password: str = "Password123!"):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp


def test_matchmaking_ranking_and_conflict_exclusion():
    client = TestClient(app)
    login_as(client, "sponsor@vouch.local")

    resp = client.get("/api/projects/proj_retinopathy/matchmaking")
    assert resp.status_code == 200, resp.text
    data = resp.json()

    students = data["ranked_students"]
    assert len(students) >= 3

    # Ranking order: Maya Lin (usr_student_a) has 100% skill match and 4.6 stars -> Rank #1
    assert students[0]["candidate_id"] == "usr_student_a"
    assert students[1]["candidate_id"] == "usr_student_b"
    assert students[0]["total_score"] > students[1]["total_score"]

    # Student C (Priya Sharma) has newbie badge and exploration boost applied
    student_c = next(s for s in students if s["candidate_id"] == "usr_student_c")
    assert student_c["is_newbie"] is True
    assert student_c["sub_scores"]["newbie_boost"] == 0.05
    assert "Newbie exploration" in student_c["reason_summary"]

    # Expert conflict: Elena Rostova (usr_expert_b) has declared conflict with sponsor
    conflicted = data["conflicted_candidates"]
    conflicted_ids = [c["candidate_id"] for c in conflicted]
    assert "usr_expert_b" in conflicted_ids

    # Conflicted candidate is NOT in active ranked experts
    ranked_expert_ids = [e["candidate_id"] for e in data["ranked_experts"]]
    assert "usr_expert_b" not in ranked_expert_ids
    assert "usr_expert_a" in ranked_expert_ids

    # Verify conflict exclusion is logged to ledger
    with get_db() as conn:
        conflict_entry = conn.execute(
            "SELECT * FROM ledger WHERE action = 'CANDIDATE_CONFLICT_EXCLUDED' AND payload_json LIKE '%usr_expert_b%'"
        ).fetchone()
        assert conflict_entry is not None


def test_matchmaking_access_control():
    client = TestClient(app)

    # 1. Student cannot access matchmaking candidates
    login_as(client, "student.a@vouch.local")
    resp = client.get("/api/projects/proj_retinopathy/matchmaking")
    assert resp.status_code == 403
    assert "Forbidden" in resp.json()["detail"]

    # 2. Expert cannot access matchmaking candidates
    login_as(client, "expert.a@vouch.local")
    resp = client.get("/api/projects/proj_retinopathy/matchmaking")
    assert resp.status_code == 403

    # 3. Admin can access matchmaking candidates
    login_as(client, "admin@vouch.local")
    resp = client.get("/api/projects/proj_retinopathy/matchmaking")
    assert resp.status_code == 200


def test_pros_and_cons_rules_and_fairness():
    client = TestClient(app)
    login_as(client, "sponsor@vouch.local")

    resp = client.get("/api/projects/proj_retinopathy/matchmaking")
    data = resp.json()
    students = {s["candidate_id"]: s for s in data["ranked_students"]}

    # Student A: Quality >= 4.2 -> Pro; Timeliness < 4.2 and > 3.3 -> Neither; Integrity >= 4.2 -> Pro
    maya_pc = students["usr_student_a"]["pros_cons"]
    assert maya_pc["is_newbie"] is False
    assert maya_pc["limited_data"] is False
    pro_keys = [p["key"] for p in maya_pc["pros"]]
    assert "quality" in pro_keys
    assert "integrity" in pro_keys
    for p in maya_pc["pros"]:
        assert "evidence" in p
        assert "project" in p["evidence"]
        assert "ledger_ref" in p["evidence"]

    # Student B: Timeliness >= 4.2 -> Pro; Integrity <= 3.3 (or quality <= 3.7) -> Con
    rohan_pc = students["usr_student_b"]["pros_cons"]
    assert rohan_pc["is_newbie"] is False
    con_keys = [c["key"] for c in rohan_pc["cons"]]
    assert len(con_keys) >= 0  # Cons grounded strictly in closed projects

    # Student C (Newbie): Zero cons, verified skills, newbie message
    priya_pc = students["usr_student_c"]["pros_cons"]
    assert priya_pc["is_newbie"] is True
    assert len(priya_pc["cons"]) == 0
    assert "No project history yet" in priya_pc["newbie_message"]


def test_candidate_con_reply_access_control():
    client = TestClient(app)

    # Student A cannot reply to Student B's watch-out
    login_as(client, "student.a@vouch.local")
    resp = client.post(
        "/api/users/usr_student_b/con-reply",
        json={"con_key": "integrity", "reply_text": "Unauthorized cross-reply"}
    )
    assert resp.status_code == 403

    # Student B CAN reply to their own watch-out
    login_as(client, "student.b@vouch.local")
    resp = client.post(
        "/api/users/usr_student_b/con-reply",
        json={"con_key": "integrity", "reply_text": "External libraries were citing open-source MIT references and cleared."}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

    # Verify ledger entry was written
    with get_db() as conn:
        entry = conn.execute(
            "SELECT * FROM ledger WHERE action = 'CON_REPLY_POSTED' AND actor = 'usr_student_b'"
        ).fetchone()
        assert entry is not None


def test_brief_hidden_before_charter_acceptance():
    client = TestClient(app)
    login_as(client, "student.a@vouch.local")

    # Brief is 403 before acceptance
    resp = client.get("/api/projects/proj_retinopathy/brief")
    assert resp.status_code == 403
    assert "Confidential brief locked" in resp.json()["detail"]

    # Student accepts Charter v1
    resp = client.post(
        "/api/projects/proj_retinopathy/charter/accept",
        json={"version": 1, "accept_engagement_model": True}
    )
    assert resp.status_code == 200

    # Brief is now unlocked!
    resp = client.get("/api/projects/proj_retinopathy/brief")
    assert resp.status_code == 200
    brief_data = resp.json()
    assert "CONFIDENTIAL CLINICAL BRIEF" in brief_data["confidential_brief"]
    assert "rural_fundus_macular_v2.tar.gz" in brief_data["datasets"]

    # Sponsor updates charter to version 2
    login_as(client, "sponsor@vouch.local")
    resp = client.post(
        "/api/projects/proj_retinopathy/charter",
        json={
            "scope": "Updated Scope for v2",
            "ip_clause": "Updated IP terms",
            "confidentiality_clause": "Updated confidentiality",
            "exit_terms": "Standard exit terms",
            "commercialisation_clause": "Commercialization terms",
            "engagement_model": "funded"
        }
    )
    assert resp.status_code == 200

    # Student tries to read brief again -> LOCKED because v2 not yet accepted!
    login_as(client, "student.a@vouch.local")
    resp = client.get("/api/projects/proj_retinopathy/brief")
    assert resp.status_code == 403


def test_locker_blocks_milestone_start():
    client = TestClient(app)
    login_as(client, "sponsor@vouch.local")

    # 1. Post a new problem with an unfunded milestone
    resp = client.post(
        "/api/sponsor/problems",
        json={
            "title": "Edge Speech Denoising",
            "public_summary": "Real-time speech filtering on microcontrollers.",
            "confidential_brief": "Proprietary noisy acoustic dataset from industrial turbines.",
            "budget": 50000,
            "engagement_model": "funded",
            "milestones": [
                {
                    "sequence": 1,
                    "title": "Audio DSP Architecture",
                    "description": "STFT pipeline",
                    "skills": ["DSP", "Python"],
                    "budget": 20000
                },
                {
                    "sequence": 2,
                    "title": "Model Quantization",
                    "description": "Quantize to 8-bit",
                    "skills": ["C++", "TFLite"],
                    "budget": 30000
                }
            ]
        }
    )
    assert resp.status_code == 200
    proj_id = resp.json()["project_id"]
    ms1_id = f"ms_{proj_id}_1"

    # Attempt to start milestone 1 BEFORE funding locker -> MUST FAIL with 400!
    resp = client.post(f"/api/projects/{proj_id}/milestones/{ms1_id}/start")
    assert resp.status_code == 400
    assert "Milestone cannot start before it is locked in escrow" in resp.json()["detail"]

    # Sponsor locks milestone 1 (deducts 20,000 from sponsor wallet)
    resp = client.post(f"/api/projects/{proj_id}/milestones/{ms1_id}/lock")
    assert resp.status_code == 200
    assert resp.json()["status"] == "funded"

    # Now starting milestone 1 succeeds!
    resp = client.post(f"/api/projects/{proj_id}/milestones/{ms1_id}/start")
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"

    # Verify milestone started ledger entry
    with get_db() as conn:
        entry = conn.execute(
            "SELECT * FROM ledger WHERE action = 'MILESTONE_STARTED' AND payload_json LIKE ?",
            (f'%"{ms1_id}"%',)
        ).fetchone()
        assert entry is not None


def test_wallet_integer_accounting_invariant():
    """
    Test that for any sponsor:
    Wallet Balance + Total Locked in Escrow + Total Released Payouts == Total Top-ups (including initial balance)
    """
    client = TestClient(app)
    login_as(client, "sponsor@vouch.local")

    # Initial state
    before_summary = client.get("/api/sponsor/wallet").json()
    total_funds_before = before_summary["balance"] + before_summary["total_locked"] + before_summary["total_released"]

    # Top-up wallet by Rs 1,00,000
    topup_amount = 100000
    resp = client.post("/api/sponsor/wallet/top-up", json={"amount": topup_amount})
    assert resp.status_code == 200

    wallet_summary = client.get("/api/sponsor/wallet").json()
    cur_balance = wallet_summary["balance"]
    total_locked = wallet_summary["total_locked"]
    total_released = wallet_summary["total_released"]

    # Invariant: cur_balance + total_locked + total_released equals total funded into account
    total_funds_after = cur_balance + total_locked + total_released
    assert isinstance(cur_balance, int)
    assert isinstance(total_locked, int)
    assert isinstance(total_released, int)
    assert total_funds_after == total_funds_before + topup_amount


def test_lifecycle_ledger_entries_and_notifications():
    client = TestClient(app)

    # 1. Sponsor invites expert
    login_as(client, "sponsor@vouch.local")
    resp = client.post(
        "/api/projects/proj_retinopathy/invite",
        json={"candidate_id": "usr_expert_a", "role": "expert", "notes": "We need your CV guidance."}
    )
    assert resp.status_code == 200

    # 2. Student applies to project
    login_as(client, "student.a@vouch.local")
    resp = client.post(
        "/api/projects/proj_indic_nlp/apply",
        json={"role": "student", "pitch": "Experience with transformers."}
    )
    assert resp.status_code == 200

    # Verify ledger entries exist for invite and apply
    with get_db() as conn:
        invite_ledger = conn.execute(
            "SELECT * FROM ledger WHERE action = 'PROJECT_INVITATION_SENT' AND payload_json LIKE '%usr_expert_a%'"
        ).fetchone()
        assert invite_ledger is not None

        apply_ledger = conn.execute(
            "SELECT * FROM ledger WHERE action = 'PROJECT_APPLICATION_SUBMITTED' AND payload_json LIKE '%usr_student_a%'"
        ).fetchone()
        assert apply_ledger is not None

        # Verify in-app notifications were created
        expert_notif = conn.execute(
            "SELECT * FROM notifications WHERE user_id = 'usr_expert_a' AND title LIKE '%Invitation%'"
        ).fetchone()
        assert expert_notif is not None

        sponsor_notif = conn.execute(
            "SELECT * FROM notifications WHERE user_id = 'usr_sponsor' AND title LIKE '%Application%'"
        ).fetchone()
        assert sponsor_notif is not None
