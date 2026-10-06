"""
Automated Test Suite for Phase 2 (SPEC.md)
Validates:
1. Public project filtering by skill, model, and budget.
2. Demo forgot-password and reset-password workflow.
3. User settings update, change-password, and simulated delete-account request.
4. Contact form submission persistence and ledger logging.
5. Notifications retrieval and read tracking.
6. Public profile data privacy: private fields (email, wallet balance) hidden from strangers, visible to owner.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.seed import seed_database
from backend.database import get_db


@pytest.fixture(autouse=True)
def setup_clean_db():
    seed_database()


@pytest.fixture
def client():
    return TestClient(app)


def test_public_projects_filtering(client):
    """SPEC.md Section 3: Open problems filters by skill, engagement model, budget."""
    # 1. Fetch all
    res = client.get("/api/projects")
    assert res.status_code == 200
    all_projs = res.json()["projects"]
    assert len(all_projs) >= 2

    # 2. Filter by engagement model 'funded'
    res_funded = client.get("/api/projects?engagement_model=funded")
    assert res_funded.status_code == 200
    funded = res_funded.json()["projects"]
    assert len(funded) >= 1
    assert all(p["engagement_model"] == "funded" for p in funded)

    # 3. Filter by skill 'retinopathy' or 'PyTorch'
    res_skill = client.get("/api/projects?skill=retinopathy")
    assert res_skill.status_code == 200
    skill_projs = res_skill.json()["projects"]
    assert len(skill_projs) >= 1
    assert any("retinopathy" in p["title"].lower() for p in skill_projs)

    # 4. Filter by budget min 50000
    res_budget = client.get("/api/projects?min_budget=50000")
    assert res_budget.status_code == 200
    budget_projs = res_budget.json()["projects"]
    assert all(p["budget"] >= 50000 for p in budget_projs)


def test_forgot_and_reset_password(client):
    """SPEC.md Section 4: Forgot password generates demo token shown on screen; reset works."""
    email = "student.c@vouch.local"

    # 1. Request forgot password
    forgot_res = client.post("/api/auth/forgot-password", json={"email": email})
    assert forgot_res.status_code == 200
    data = forgot_res.json()
    assert "demo_reset_token" in data
    token = data["demo_reset_token"]
    assert token.startswith("rst_")

    # 2. Reset password using token
    new_pwd = "BrandNewPassword2026!"
    reset_res = client.post("/api/auth/reset-password", json={"token": token, "new_password": new_pwd})
    assert reset_res.status_code == 200

    # 3. Old password should fail
    login_fail = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    assert login_fail.status_code == 401

    # 4. New password should succeed
    login_ok = client.post("/api/auth/login", json={"email": email, "password": new_pwd})
    assert login_ok.status_code == 200
    assert login_ok.json()["user"]["email"] == email


def test_user_settings_and_change_password(client):
    """SPEC.md Section 4: User settings, skills, headline, change password, delete request."""
    # Login as Student A
    client.post("/api/auth/login", json={"email": "student.a@vouch.local", "password": "Password123!"})

    # Fetch initial settings
    get_res = client.get("/api/user/settings")
    assert get_res.status_code == 200
    settings = get_res.json()
    assert "skills" in settings

    # Update settings
    put_res = client.put(
        "/api/user/settings",
        json={
            "name": "Maya Lin (Updated)",
            "headline": "Senior Edge ML Researcher",
            "skills": ["PyTorch", "ONNX", "TinyML"],
            "weekly_hours": 30,
            "notification_payouts": True,
        },
    )
    assert put_res.status_code == 200

    # Verify update
    get_res2 = client.get("/api/user/settings")
    assert get_res2.status_code == 200
    data2 = get_res2.json()
    assert data2["name"] == "Maya Lin (Updated)"
    assert data2["weekly_hours"] == 30
    assert "TinyML" in data2["skills"]

    # Change password
    cp_res = client.post(
        "/api/user/change-password",
        json={"old_password": "Password123!", "new_password": "MayaSecurePassword1!"},
    )
    assert cp_res.status_code == 200

    # Delete account request
    del_res = client.post("/api/user/delete-request")
    assert del_res.status_code == 200
    assert "deletion scheduled" in del_res.json()["message"]


def test_contact_form_persists_and_logs_ledger(client):
    """SPEC.md Section 3: Contact form stored in DB and logged on ledger."""
    res = client.post(
        "/api/contact",
        json={
            "name": "John Doe",
            "email": "john@test.com",
            "subject": "Platform inquiry",
            "message": "Interested in running an institutional cohort.",
        },
    )
    assert res.status_code == 200

    # Check database
    with get_db() as conn:
        msg = conn.execute("SELECT * FROM contact_messages WHERE email = 'john@test.com'").fetchone()
        assert msg is not None
        assert msg["subject"] == "Platform inquiry"

        # Check ledger
        ledger_entry = conn.execute(
            "SELECT * FROM ledger WHERE action = 'CONTACT_SUBMISSION' ORDER BY seq DESC LIMIT 1"
        ).fetchone()
        assert ledger_entry is not None


def test_notifications_and_read_status(client):
    """SPEC.md Section 4: Notifications and bell mark as read."""
    client.post("/api/auth/login", json={"email": "student.a@vouch.local", "password": "Password123!"})

    res = client.get("/api/notifications")
    assert res.status_code == 200
    notifs = res.json()["notifications"]
    assert len(notifs) >= 1
    first_id = notifs[0]["id"]

    # Mark single as read
    res_read = client.post(f"/api/notifications/{first_id}/read")
    assert res_read.status_code == 200

    # Mark all read
    res_all = client.post("/api/notifications/read-all")
    assert res_all.status_code == 200

    res_after = client.get("/api/notifications")
    assert res_after.json()["unread_count"] == 0


def test_public_profile_hides_private_data_from_strangers(client):
    """
    SPEC.md Section 4:
    Profile (public and private view):
    Private fields (email, earnings) visible ONLY to the owner.
    """
    # 1. Unauthenticated / Stranger fetches Student A's profile
    res_anon = client.get("/api/users/usr_student_a/public")
    assert res_anon.status_code == 200
    data_anon = res_anon.json()
    assert data_anon["name"] == "Maya Lin (Student A)"
    assert data_anon["stars"] == 4.6
    assert "pros" in data_anon
    assert data_anon["is_owner"] is False
    assert "email" not in data_anon  # Private field must NOT be exposed
    assert "wallet_balance" not in data_anon  # Private field must NOT be exposed

    # 2. Owner (Student A) logs in and fetches own profile
    client.post("/api/auth/login", json={"email": "student.a@vouch.local", "password": "Password123!"})
    res_owner = client.get("/api/users/usr_student_a/public")
    assert res_owner.status_code == 200
    data_owner = res_owner.json()
    assert data_owner["is_owner"] is True
    assert data_owner["email"] == "student.a@vouch.local"  # Visible to owner
    assert "wallet_balance" in data_owner  # Visible to owner
