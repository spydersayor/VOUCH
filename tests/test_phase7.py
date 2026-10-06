"""
Phase 7 Comprehensive Test Suite
Validates:
1. quit_midway rupee conservation, star floor (1.0), and good cause waiver.
2. sponsor_withdraws rupee conservation (escrow + 10% compensation = sum distributed to team + fee/reserve, sponsor debited, team credited, sponsor stars -0.5).
3. Rehearsal engine output equals the real action's output for the same state.
4. sponsor_silent and paid_becomes_unpaid cases.
5. Minimal closing: all milestones accepted -> sponsor closes project -> member review submitted -> Newbie removal after closed review.
6. Ledger entry recorded for every step.
7. Server-side RBAC on /rehearsal and demo admin tools.
"""

import pytest
import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.seed import seed_database
from backend.database import get_db
from backend.config import RATING_MIN, STAR_PENALTY_QUIT, STAR_PENALTY_WITHDRAW, SPONSOR_WITHDRAWAL_COMPENSATION_PCT
from backend.rules import quit_midway, sponsor_withdraws, sponsor_silent, ai_share_credit, paid_becomes_unpaid


@pytest.fixture(autouse=True)
def setup_test_db():
    seed_database()


def login_client(client: TestClient, email: str, password: str = "Password123!"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["token"]
    client.cookies.set("vouch_session", token)
    return res.json()["user"]


# 1. Rupee conservation and star floor on quit_midway
def test_quit_midway_money_math_and_star_floor():
    charter = {"version": 1, "engagement_model": "funded"}
    project_state = {
        "project_id": "proj_test_quit",
        "budget": 100000,
        "lockers": [{"amount": 100000, "status": "funded"}],
        "milestones": [{"id": "m1", "budget": 40000, "status": "in_progress", "sequence": 1}],
        "members": [
            {"user_id": "u_student_low", "name": "Student Low Stars", "role": "student", "wallet_balance": 5000, "stars": 1.2, "weight": 0.5},
            {"user_id": "u_student_b", "name": "Student Other", "role": "student", "wallet_balance": 8000, "stars": 4.0, "weight": 0.5},
            {"user_id": "u_expert", "name": "Expert A", "role": "expert", "wallet_balance": 12000, "stars": 4.8},
        ],
        "sponsor": {"user_id": "u_sponsor", "name": "Sponsor Corp", "wallet_balance": 500000, "stars": 4.5},
    }

    # Test quit midway without good cause -> star penalty hits floor 1.0 (1.2 - 0.5 = 1.0 floor)
    res = quit_midway(charter, project_state, "u_student_low", progress_fraction=0.40, good_cause=False)
    assert res["conserved"] is True
    assert res["total_rupees_before"] == res["total_rupees_after"]

    quitting_line = next(l for l in res["table_lines"] if l["user_id"] == "u_student_low")
    assert quitting_line["rupees_delta"] > 0  # Earned 40% pro-rata share
    assert quitting_line["star_change"] == -0.2  # Floor 1.0 reached from 1.2!
    assert quitting_line["access_change"] == "Revoked (quit)"
    assert quitting_line["credit_change"] == "Kept (accepted past milestones)"

    # Test quit with good cause -> star penalty is waived (0.0)
    res_gc = quit_midway(charter, project_state, "u_student_low", progress_fraction=0.40, good_cause=True)
    quitting_gc = next(l for l in res_gc["table_lines"] if l["user_id"] == "u_student_low")
    assert quitting_gc["star_change"] == 0.0
    assert "good cause" in quitting_gc["reason"].lower()


# 2. Rupee conservation on sponsor_withdraws
def test_sponsor_withdraws_rupee_conservation_and_compensation():
    charter = {"version": 1, "engagement_model": "funded"}
    project_state = {
        "project_id": "proj_test_withdraw",
        "budget": 100000,
        "lockers": [{"amount": 100000, "status": "funded"}],
        "members": [
            {"user_id": "usr_student_b", "name": "Student B", "role": "student", "wallet_balance": 10000, "stars": 3.9, "weight": 0.5},
            {"user_id": "usr_student_a", "name": "Student A", "role": "student", "wallet_balance": 10000, "stars": 4.6, "weight": 0.5},
            {"user_id": "usr_expert_a", "name": "Expert A", "role": "expert", "wallet_balance": 15000, "stars": 4.9},
        ],
        "sponsor": {"user_id": "usr_sponsor", "name": "Apex Health", "role": "sponsor", "wallet_balance": 500000, "stars": 4.7},
    }

    res = sponsor_withdraws(charter, project_state)
    assert res["conserved"] is True
    assert res["total_rupees_before"] == res["total_rupees_after"]

    # 10% compensation charged on 100,000 unreleased escrow = 10,000
    assert res["compensation_charged"] == 10000
    assert res["total_liquidated_payout"] == 110000

    sponsor_line = next(l for l in res["table_lines"] if l["role"] == "sponsor")
    assert sponsor_line["rupees_delta"] == -10000
    assert sponsor_line["star_change"] == -0.5
    assert "Withdrawal count +1" in sponsor_line["credit_change"]

    # Check team members received their compensation shares
    expert_line = next(l for l in res["table_lines"] if l["role"] == "expert")
    assert expert_line["rupees_delta"] > 0
    assert "verified advisory credit" in expert_line["credit_change"]


# 3. Rehearsal output equals real action output for identical state
def test_rehearsal_output_matches_real_action():
    client = TestClient(app)
    login_client(client, "student.b@vouch.local")

    # 1. Run rehearsal simulation
    sim_res = client.post(
        "/api/rehearsal/simulate",
        json={"project_id": "proj_retinopathy", "scenario": "student_quits_40"},
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()["result"]

    # 2. Call rules directly for same state
    with get_db() as conn:
        from backend.main import get_full_project_state
        state = get_full_project_state("proj_retinopathy", conn)

    real_calc = quit_midway(
        charter=state["charter"],
        project_state=state,
        member="usr_student_b",
        progress_fraction=0.40,
    )

    # Assert exact match between rehearsal simulation and real calculation
    assert sim_data["earned_share"] == real_calc["earned_share"]
    assert sim_data["unearned_returned_to_pool"] == real_calc["unearned_returned_to_pool"]
    assert sim_data["total_rupees_before"] == real_calc["total_rupees_before"]
    assert sim_data["total_rupees_after"] == real_calc["total_rupees_after"]
    assert len(sim_data["table_lines"]) == len(real_calc["table_lines"])


# 4. sponsor_silent and paid_becomes_unpaid test cases
def test_sponsor_silent_and_paid_becomes_unpaid():
    charter = {"version": 1, "engagement_model": "funded", "exit_terms": "Standard auto-accept after 7 days"}
    project_state = {
        "project_id": "proj_test_silent",
        "budget": 100000,
        "lockers": [{"amount": 100000, "status": "funded"}],
        "milestones": [{"id": "m1", "budget": 30000, "status": "submitted"}],
        "members": [
            {"user_id": "u1", "name": "Student 1", "role": "student", "wallet_balance": 10000, "weight": 0.5},
            {"user_id": "u2", "name": "Student 2", "role": "student", "wallet_balance": 10000, "weight": 0.5},
            {"user_id": "ue", "name": "Expert", "role": "expert", "wallet_balance": 20000},
        ],
    }

    # Case A: 3 days silent (within 7-day window) -> no auto-accept yet
    res_within = sponsor_silent(charter, project_state, days=3)
    assert res_within["conserved"] is True
    assert res_within["action_taken"] == "in_window_or_mediated"
    assert all(l["rupees_delta"] == 0 for l in res_within["table_lines"])

    # Case B: 8 days silent (exceeded 7-day window) -> auto-accept triggered
    res_exceeded = sponsor_silent(charter, project_state, days=8)
    assert res_exceeded["conserved"] is True
    assert res_exceeded["action_taken"] == "auto_accepted"
    locker_line = next(l for l in res_exceeded["table_lines"] if l["role"] == "escrow")
    assert locker_line["rupees_delta"] == -30000

    # Case C: paid becomes unpaid (conversion to knowledge-sharing)
    res_unpaid = paid_becomes_unpaid(charter, project_state)
    assert res_unpaid["conserved"] is True
    assert res_unpaid["charter_version_after"] == 2
    sponsor_line = next(l for l in res_unpaid["table_lines"] if l["role"] == "sponsor")
    assert sponsor_line["rupees_delta"] == 100000  # Escrow refunded to sponsor


# 5. Minimal closing: sponsor closes project, member submits review, Newbie badge removed
def test_project_close_and_newbie_badge_removal():
    client = TestClient(app)

    # 1. Sponsor closes retinopathy project
    login_client(client, "sponsor@vouch.local")
    close_res = client.post(
        "/api/projects/proj_retinopathy/close",
        json={"final_outcome": "Edge diabetic retinopathy model validated on clinical test cohort."},
    )
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "closed"

    # Verify project is closed in database
    with get_db() as conn:
        proj = conn.execute("SELECT status FROM projects WHERE id = 'proj_retinopathy'").fetchone()
        assert proj["status"] == "closed"

        # Check Priya Sharma (Student C) has newbie badge before review
        user_c = conn.execute("SELECT newbie_badge, stars FROM users WHERE id = 'usr_student_c'").fetchone()
        assert user_c["newbie_badge"] == 1

        # Add Student C to project so they can be reviewed
        conn.execute(
            "INSERT OR REPLACE INTO project_members (id, project_id, user_id, role, status) VALUES ('pm_c', 'proj_retinopathy', 'usr_student_c', 'student', 'accepted')"
        )

    # 2. Sponsor reviews Student C
    rev_res = client.post(
        "/api/projects/proj_retinopathy/reviews",
        json={
            "reviewee_id": "usr_student_c",
            "quality": 5.0,
            "timeliness": 5.0,
            "communication": 5.0,
            "collaboration": 5.0,
            "integrity": 5.0,
            "comment": "Exceptional mathematical rigour and clear data normalization pipeline.",
        },
    )
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert rev_data["newbie_removed"] is True
    assert rev_data["new_rating"] == 5.0

    # 3. Verify in DB that newbie badge is permanently removed
    with get_db() as conn:
        user_c_after = conn.execute("SELECT newbie_badge, stars FROM users WHERE id = 'usr_student_c'").fetchone()
        assert user_c_after["newbie_badge"] == 0
        assert user_c_after["stars"] == 5.0

        # Check ledger recorded the review and newbie removal
        ledger_entry = conn.execute(
            "SELECT action, payload_json FROM ledger WHERE action = 'REVIEW_SUBMITTED' ORDER BY seq DESC LIMIT 1"
        ).fetchone()
        assert ledger_entry is not None
        payload = json.loads(ledger_entry["payload_json"])
        assert payload["newbie_removed"] is True


# 6. Real actions: Leave project and Withdraw sponsorship write ledger entries
def test_real_leave_and_withdraw_write_ledger():
    client = TestClient(app)

    # Member leaves project
    login_client(client, "student.b@vouch.local")
    leave_res = client.post(
        "/api/projects/proj_retinopathy/leave",
        json={"good_cause": False, "progress_fraction": 0.40},
    )
    assert leave_res.status_code == 200
    assert leave_res.json()["status"] == "success"

    # Verify ledger has MEMBER_QUIT
    with get_db() as conn:
        entry = conn.execute("SELECT * FROM ledger WHERE action = 'MEMBER_QUIT' ORDER BY seq DESC LIMIT 1").fetchone()
        assert entry is not None
        assert entry["actor"] == "usr_student_b"

        # Check member status is quit in project_members
        mem = conn.execute("SELECT status FROM project_members WHERE project_id = 'proj_retinopathy' AND user_id = 'usr_student_b'").fetchone()
        assert mem["status"] == "quit"

    # Sponsor withdraws
    login_client(client, "sponsor@vouch.local")
    withdraw_res = client.post(
        "/api/projects/proj_retinopathy/withdraw",
        json={"reason": "Executive strategic reallocation"},
    )
    assert withdraw_res.status_code == 200
    assert withdraw_res.json()["status"] == "success"

    # Verify ledger has SPONSOR_WITHDRAWAL
    with get_db() as conn:
        entry = conn.execute("SELECT * FROM ledger WHERE action = 'SPONSOR_WITHDRAWAL' ORDER BY seq DESC LIMIT 1").fetchone()
        assert entry is not None
        assert entry["actor"] == "usr_sponsor"


# 7. Server-side RBAC on /rehearsal and admin demo tools
def test_rbac_on_rehearsal_and_admin_tools():
    client = TestClient(app)

    # Anonymous user blocked from rehearsal simulation
    res_anon = client.post(
        "/api/rehearsal/simulate",
        json={"project_id": "proj_retinopathy", "scenario": "sponsor_withdraws"},
    )
    assert res_anon.status_code == 401

    # Student cannot access admin verification queue or tamper repair
    login_client(client, "student.a@vouch.local")
    res_admin_queue = client.get("/api/admin/verification-queue")
    assert res_admin_queue.status_code == 403

    res_admin_repair = client.post("/api/admin/repair-ledger")
    assert res_admin_repair.status_code == 403

    # Admin CAN access admin verification queue and repair ledger
    login_client(client, "admin@vouch.local")
    res_queue_ok = client.get("/api/admin/verification-queue")
    assert res_queue_ok.status_code == 200

    res_repair_ok = client.post("/api/admin/repair-ledger")
    assert res_repair_ok.status_code == 200
