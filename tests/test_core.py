"""
Core Automated Test Suite for Phase 1 (SPEC.md)
Validates:
1. Payout integer math (Rs 25,500 / 25,783 / 18,643 / 15,074) and exact sum conservation.
2. Ledger hash-chain verification and failure detection upon simulation of tamper.
3. Server-side RBAC: students are forbidden from calling sponsor and admin routes.
4. Server-side brief gating: student cannot fetch brief before accepting the current charter version,
   and editing charter blocks access again until re-acceptance.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.seed import seed_database
from backend.payout import calculate_milestone_payout
from backend.ledger import simulate_tamper, verify_ledger


@pytest.fixture(autouse=True)
def setup_clean_db():
    seed_database()


@pytest.fixture
def client():
    return TestClient(app)


def test_payout_math_exact_integers():
    """
    SPEC.md Section 8:
    Default on Rs 1,00,000:
    - 10% platform fee: 10,000
    - 5% AI compute reserve: 5,000
    - Expert: 30% of remaining 85,000 -> Rs 25,500
    - Student pool: 59,500 with 40% equal and 60% by weights [0.5, 0.3, 0.2]
    - Expected: Rs 25,500 expert; 25,783, 18,643, 15,074 students.
    - Sum payouts + fee + reserve = 100,000.
    """
    res = calculate_milestone_payout(
        amount=100000,
        student_weights=[0.5, 0.3, 0.2],
        expert_present=True,
    )

    assert res["platform_fee"] == 10000
    assert res["ai_reserve"] == 5000
    assert res["expert_payout"] == 25500
    assert res["student_payouts"] == [25783, 18643, 15074]

    # Exact conservation of funds
    total_distributed = (
        res["platform_fee"]
        + res["ai_reserve"]
        + res["expert_payout"]
        + sum(res["student_payouts"])
    )
    assert total_distributed == 100000
    assert res["total_distributed"] == 100000


def test_payout_api_endpoint(client):
    """Verifies that the /api/payout/calculate endpoint returns exact values."""
    res = client.post(
        "/api/payout/calculate",
        json={"amount": 100000, "student_weights": [0.5, 0.3, 0.2], "expert_present": True},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["expert_payout"] == 25500
    assert data["student_payouts"] == [25783, 18643, 15074]
    assert data["total_distributed"] == 100000


def test_ledger_verify_and_tamper(client):
    """
    SPEC.md Section 11:
    Ledger verify returns OK initially.
    Simulate tamper edits an entry in DB.
    Verify immediately fails showing the broken sequence.
    """
    # 1. Initial seeded ledger must be valid
    verify_res = client.get("/api/ledger/verify")
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["status"] == "ok"
    assert data["count"] > 0

    # 2. Tamper entry seq 2
    tamper_info = simulate_tamper(target_seq=2)
    assert tamper_info["status"] == "tampered"

    # 3. Verification must now catch the broken link at seq 2
    verify_res2 = client.get("/api/ledger/verify")
    assert verify_res2.status_code == 200
    data2 = verify_res2.json()
    assert data2["status"] == "tampered"
    assert data2["broken_seq"] == 2


def test_rbac_student_forbidden_from_sponsor_and_admin_routes(client):
    """
    SPEC.md Section 2:
    Server-side RBAC: students are forbidden from calling sponsor or admin routes.
    """
    # Log in as Student A
    login_res = client.post(
        "/api/auth/login",
        json={"email": "student.a@vouch.local", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["role"] == "student"

    # Student attempts sponsor routes
    res1 = client.post("/api/sponsor/projects/create", json={"title": "Hacked"})
    assert res1.status_code == 403
    assert "Access denied" in res1.json()["detail"]

    res2 = client.post("/api/sponsor/withdraw", json={"project_id": "proj_retinopathy"})
    assert res2.status_code == 403

    # Student attempts admin routes
    res3 = client.get("/api/admin/audit")
    assert res3.status_code == 403

    res4 = client.post("/api/admin/reset")
    assert res4.status_code == 403

    res5 = client.post("/api/ledger/simulate-tamper", json={"seq": 1})
    assert res5.status_code == 403


def test_server_side_brief_gating_and_charter_versioning(client):
    """
    SPEC.md Section 8:
    Confidential brief and datasets enforced server-side: never returned
    to anyone who has not accepted the current charter version.
    Editing creates a new version and blocks members until they re-accept.
    """
    project_id = "proj_retinopathy"

    # 1. Log in as Student C (has not accepted charter yet)
    client.post(
        "/api/auth/login",
        json={"email": "student.c@vouch.local", "password": "Password123!"},
    )

    # Student tries to read confidential brief -> Must be refused (403)
    brief_res1 = client.get(f"/api/projects/{project_id}/brief")
    assert brief_res1.status_code == 403
    assert "Confidential brief locked" in brief_res1.json()["detail"]

    # 2. Student accepts current charter version (v1) and engagement model
    accept_res = client.post(
        f"/api/projects/{project_id}/charter/accept",
        json={"version": 1, "accept_engagement_model": True},
    )
    assert accept_res.status_code == 200

    # Now student CAN read confidential brief
    brief_res2 = client.get(f"/api/projects/{project_id}/brief")
    assert brief_res2.status_code == 200
    data = brief_res2.json()
    assert "CONFIDENTIAL CLINICAL BRIEF" in data["confidential_brief"]
    assert "rural_fundus_macular_v2.tar.gz" in data["datasets"]

    # 3. Sponsor logs in and publishes charter v2 (editing terms)
    client.post(
        "/api/auth/login",
        json={"email": "sponsor@vouch.local", "password": "Password123!"},
    )
    new_charter_res = client.post(
        f"/api/projects/{project_id}/charter",
        json={
            "scope": "Updated scope including validation on edge neural accelerators.",
            "ip_clause": "Sponsor retains commercial licensing rights.",
            "confidentiality_clause": "Strict NDA on raw dataset.",
            "exit_terms": "Pro-rata payment per accepted milestones.",
            "commercialisation_clause": "Co-authorship on peer-reviewed paper.",
            "engagement_model": "funded",
        },
    )
    assert new_charter_res.status_code == 200
    assert new_charter_res.json()["version"] == 2

    # 4. Switch back to Student A: must now be BLOCKED from brief again until accepting v2
    client.post(
        "/api/auth/login",
        json={"email": "student.a@vouch.local", "password": "Password123!"},
    )
    brief_res3 = client.get(f"/api/projects/{project_id}/brief")
    assert brief_res3.status_code == 403
    assert "You have not accepted the current charter version (v2)" in brief_res3.json()["detail"]

    # 5. Student A accepts v2
    accept_v2_res = client.post(
        f"/api/projects/{project_id}/charter/accept",
        json={"version": 2, "accept_engagement_model": True},
    )
    assert accept_v2_res.status_code == 200

    # Access is unlocked once again
    brief_res4 = client.get(f"/api/projects/{project_id}/brief")
    assert brief_res4.status_code == 200
