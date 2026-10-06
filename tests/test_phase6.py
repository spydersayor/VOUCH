"""
Tests for Phase 6 of SPEC.md:
1. Project close and structured reviews (1-5 scores, ledger linked, repeated high rating down-weighting).
2. Star engine (average of closed-project reviews + penalty adjustments, floor 1.0, Newbie removal).
3. Candidate quits midway (pro-rata share, already released kept, penalty unless good cause, rupee table).
4. Sponsor withdraws sponsorship (locked funds + 10% compensation charged to sponsor, split by charter, company record withdrawal count, rupee table).
5. Pros and cons from real review data, company record updates, certificates and credit records on profiles.
6. Cryptographic ledger integrity across all lifecycle events.
"""

import pytest
import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db
from backend.seed import seed_database
from backend.ledger import verify_ledger
from backend.stars import calculate_user_stars, calculate_and_update_stars, record_star_penalty
from backend.project_lifecycle import close_project, submit_project_review, candidate_quit_project, sponsor_withdraw_project
from backend.pros_cons import compute_user_pros_and_cons, compute_company_pros_and_cons, compute_company_record


@pytest.fixture(autouse=True)
def reset_db_before_tests():
    seed_database()


def get_auth_client(email: str, password: str = "Password123!") -> TestClient:
    c = TestClient(app)
    res = c.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return c


# ===================== 1. Review Eligibility & Structured Reviews =====================
def test_review_eligibility_and_structured_reviews():
    client_student_b = get_auth_client("student.b@vouch.local")
    client_sponsor = get_auth_client("sponsor@vouch.local")
    client_stranger = get_auth_client("student.c@vouch.local")

    # Attempting to review on an OPEN project must fail
    res = client_student_b.post(
        "/api/projects/proj_retinopathy/reviews",
        json={
            "reviewee_id": "usr_sponsor",
            "quality": 5.0,
            "timeliness": 5.0,
            "communication": 5.0,
            "collaboration": 5.0,
            "integrity": 5.0,
            "fairness": 5.0,
            "clarity": 5.0,
        },
    )
    assert res.status_code == 400
    assert "Only members of a closed project can review" in res.json()["detail"]

    # Close project proj_retinopathy by sponsor
    res_close = client_sponsor.post(
        "/api/projects/proj_retinopathy/close",
        json={"outcome": "Diabetic retinopathy edge model verified on hardware"},
    )
    assert res_close.status_code == 200
    assert res_close.json()["status"] == "closed"

    # Stranger (non-member) attempting to review closed project gets 403 Forbidden
    res_stranger = client_stranger.post(
        "/api/projects/proj_retinopathy/reviews",
        json={
            "reviewee_id": "usr_sponsor",
            "quality": 5.0,
            "timeliness": 5.0,
            "communication": 5.0,
            "collaboration": 5.0,
            "integrity": 5.0,
        },
    )
    assert res_stranger.status_code == 403

    # Now review submission on closed project succeeds for accepted member
    res_review = client_student_b.post(
        "/api/projects/proj_retinopathy/reviews",
        json={
            "reviewee_id": "usr_sponsor",
            "quality": 4.8,
            "timeliness": 5.0,
            "communication": 4.9,
            "collaboration": 4.7,
            "integrity": 5.0,
            "fairness": 4.9,
            "clarity": 4.8,
            "comment": "Outstanding clarity and on-time escrow release.",
            "tags": ["Fast Escrow", "Clear Brief"],
        },
    )
    assert res_review.status_code == 200
    rev_data = res_review.json()
    assert rev_data["status"] == "success"
    assert rev_data["ledger_ref"].startswith("ledger_seq_")

    # Duplicate review between the same pair on the same project MUST fail
    res_dup = client_student_b.post(
        "/api/projects/proj_retinopathy/reviews",
        json={
            "reviewee_id": "usr_sponsor",
            "quality": 5.0,
            "timeliness": 5.0,
            "communication": 5.0,
            "collaboration": 5.0,
            "integrity": 5.0,
        },
    )
    assert res_dup.status_code == 400
    assert "already submitted a review" in res_dup.json()["detail"]

    # Self-review must fail
    res_self = client_student_b.post(
        "/api/projects/proj_retinopathy/reviews",
        json={
            "reviewee_id": "usr_student_b",
            "quality": 5.0,
            "timeliness": 5.0,
            "communication": 5.0,
            "collaboration": 5.0,
            "integrity": 5.0,
        },
    )
    assert res_self.status_code == 400
    assert "cannot review themselves" in res_self.json()["detail"]


# ===================== 2. Star Engine & Pairwise Down-weighting =====================
def test_star_engine_and_downweighting_and_floor():
    with get_db() as conn:
        # User student A initially has 4.6 stars
        calc_a = calculate_user_stars("usr_student_a", conn)
        assert calc_a["effective_stars"] is not None
        assert calc_a["effective_stars"] >= 4.0

        # Down-weighting test:
        # Create a test candidate and simulate multiple 5.0 reviews from the same reviewer
        conn.execute("INSERT OR REPLACE INTO users (id, email, password_hash, salt, role, name, stars, newbie_badge) VALUES ('usr_test_pair', 'testpair@vouch.local', 'h', 's', 'student', 'Test Pair', NULL, 0)")
        
        # 1st review from sponsor: 5.0 -> weight = 1.0
        conn.execute(
            """
            INSERT INTO reviews (id, project_id, reviewer_id, reviewee_id, quality, timeliness, communication, collaboration, integrity, comment)
            VALUES ('r_t1', 'proj_past_1', 'usr_sponsor', 'usr_test_pair', 5.0, 5.0, 5.0, 5.0, 5.0, 'Superb')
            """
        )
        calc1 = calculate_user_stars("usr_test_pair", conn)
        assert calc1["reviews_count"] == 1
        assert calc1["effective_stars"] == 5.0
        assert calc1["downweighted_count"] == 0

        # 2nd review from the SAME reviewer usr_sponsor on another closed project with high rating (5.0) -> should be down-weighted
        conn.execute(
            """
            INSERT INTO reviews (id, project_id, reviewer_id, reviewee_id, quality, timeliness, communication, collaboration, integrity, comment)
            VALUES ('r_t2', 'proj_past_2', 'usr_sponsor', 'usr_test_pair', 5.0, 5.0, 5.0, 5.0, 5.0, 'Superb again')
            """
        )
        calc2 = calculate_user_stars("usr_test_pair", conn)
        assert calc2["reviews_count"] == 2
        assert calc2["downweighted_count"] == 1  # 2nd repeated high rating was down-weighted

        # Add a 3.0 review from an independent reviewer (usr_expert_a)
        conn.execute(
            """
            INSERT INTO reviews (id, project_id, reviewer_id, reviewee_id, quality, timeliness, communication, collaboration, integrity, comment)
            VALUES ('r_t3', 'proj_past_3', 'usr_expert_a', 'usr_test_pair', 3.0, 3.0, 3.0, 3.0, 3.0, 'Moderate')
            """
        )
        calc3 = calculate_user_stars("usr_test_pair", conn)
        # Because the repeated 5.0 review was down-weighted, the 3.0 review pulls the score down more than unweighted
        assert calc3["effective_stars"] < 5.0

        # Rating floor test: apply severe penalty (-10.0 stars)
        conn.execute(
            "INSERT INTO star_penalties (id, user_id, penalty_type, penalty_value, reason, good_cause) VALUES ('pen_big', 'usr_test_pair', 'admin_adjustment', -10.0, 'Severe infraction', 0)"
        )
        calc_floor = calculate_user_stars("usr_test_pair", conn)
        assert calc_floor["effective_stars"] == 1.0, f"Expected floor 1.0, got {calc_floor['effective_stars']}"


# ===================== 3. Newbie Removal After First Closed Review =====================
def test_newbie_badge_removal_on_first_closed_project_review():
    client_sponsor = get_auth_client("sponsor@vouch.local")

    with get_db() as conn:
        u_init = conn.execute("SELECT newbie_badge, stars FROM users WHERE id = 'usr_student_c'").fetchone()
        assert u_init["newbie_badge"] == 1
        assert u_init["stars"] is None

        # Add Student C to retinopathy project as accepted member
        conn.execute(
            "INSERT OR REPLACE INTO project_members (id, project_id, user_id, role, status, weight) VALUES ('pm_c_ret', 'proj_retinopathy', 'usr_student_c', 'student', 'accepted', 0.2)"
        )

    # Sponsor closes project
    client_sponsor.post("/api/projects/proj_retinopathy/close", json={"outcome": "Delivered model benchmarks"})

    # Sponsor submits a review for Newbie student C
    res_rev = client_sponsor.post(
        "/api/projects/proj_retinopathy/reviews",
        json={
            "reviewee_id": "usr_student_c",
            "quality": 4.5,
            "timeliness": 4.5,
            "communication": 4.5,
            "collaboration": 4.5,
            "integrity": 5.0,
            "comment": "Impressive first engagement, strong foundations.",
        },
    )
    assert res_rev.status_code == 200

    with get_db() as conn:
        u_after = conn.execute("SELECT newbie_badge, stars FROM users WHERE id = 'usr_student_c'").fetchone()
        assert u_after["newbie_badge"] == 0, "Newbie badge must be removed after first closed project review!"
        assert u_after["stars"] is not None
        assert u_after["stars"] >= 4.0

        # Check ratings history has reason
        rh = conn.execute("SELECT * FROM ratings_history WHERE user_id = 'usr_student_c' ORDER BY created_at DESC").fetchone()
        assert rh is not None
        assert rh["new_rating"] == u_after["stars"]
        assert rh["ledger_seq"] is not None


# ===================== 4. Candidate Quits Midway (Exit Money Math & Conservation) =====================
def test_candidate_quits_midway_money_math_and_rupee_table():
    client_student_b = get_auth_client("student.b@vouch.local")
    client_admin = get_auth_client("admin@vouch.local")

    with get_db() as conn:
        # Retinopathy project: status open, student B is accepted member
        # Give candidate initial wallet balance
        conn.execute("UPDATE wallets SET balance = 10000 WHERE user_id = 'usr_student_b'")
        wallet_before = 10000
        stars_before = calculate_user_stars("usr_student_b", conn)["effective_stars"]

    # Student B quits without good cause
    res_quit = client_student_b.post(
        "/api/projects/proj_retinopathy/quit",
        json={"reason": "Personal conflict with schedule"},
    )
    assert res_quit.status_code == 200
    data = res_quit.json()
    assert data["status"] == "quit"

    rupee_table = data["rupee_table"]
    # Check integer conservation: candidate_wallet_after = candidate_wallet_before + in_progress_earned_payout
    assert rupee_table["candidate_wallet_after"] == rupee_table["candidate_wallet_before"] + rupee_table["in_progress_earned_payout"]
    assert isinstance(rupee_table["candidate_wallet_after"], int)
    assert isinstance(rupee_table["in_progress_earned_payout"], int)

    # Check star penalty: -0.5 stars applied
    with get_db() as conn:
        u_b = conn.execute("SELECT stars FROM users WHERE id = 'usr_student_b'").fetchone()
        assert round(u_b["stars"], 2) == round(stars_before - 0.5, 2)

        # Check membership status changed to 'quit' (access revoked)
        mem = conn.execute("SELECT status FROM project_members WHERE project_id = 'proj_retinopathy' AND user_id = 'usr_student_b'").fetchone()
        assert mem["status"] == "quit"

    # Workspace access must now be FORBIDDEN (403)
    res_ws = client_student_b.get("/api/projects/proj_retinopathy/workspace")
    assert res_ws.status_code == 403

    # Admin quit with "good cause" exempts penalty
    with get_db() as conn:
        # Reset Student A
        conn.execute("INSERT OR REPLACE INTO project_members (id, project_id, user_id, role, status, weight) VALUES ('pm_sa_ret', 'proj_retinopathy', 'usr_student_a', 'student', 'accepted', 0.5)")
        stars_a_before = calculate_user_stars("usr_student_a", conn)["effective_stars"]

    res_good_cause = client_admin.post(
        "/api/projects/proj_retinopathy/members/usr_student_a/quit",
        json={"reason": "Documented medical emergency", "good_cause": True},
    )
    assert res_good_cause.status_code == 200
    with get_db() as conn:
        stars_a_after = calculate_user_stars("usr_student_a", conn)["effective_stars"]
        assert stars_a_after == stars_a_before, "Good cause quit must not incur any star penalty!"


# ===================== 5. Sponsor Withdraws Midway (Money Math, 10% Compensation, Rupee Table) =====================
def test_sponsor_withdraws_midway_money_math_and_rupee_table():
    client_sponsor = get_auth_client("sponsor@vouch.local")

    with get_db() as conn:
        # Set sponsor initial wallet
        conn.execute("UPDATE wallets SET balance = 50000 WHERE user_id = 'usr_sponsor'")
        sponsor_w_before = 50000
        sponsor_stars_before = calculate_user_stars("usr_sponsor", conn)["effective_stars"]

    res_withdraw = client_sponsor.post(
        "/api/projects/proj_retinopathy/withdraw",
        json={"reason": "Strategic realignment of internal AI clinical priorities"},
    )
    assert res_withdraw.status_code == 200
    w_data = res_withdraw.json()
    assert w_data["status"] == "withdrawn"

    rt = w_data["rupee_table"]
    # 1. 10% compensation charged to sponsor wallet
    expected_compensation = int(rt["remaining_locked_funds"] * 0.10)
    assert rt["compensation_charged"] == expected_compensation
    assert rt["sponsor_wallet_before"] - rt["sponsor_wallet_after"] == expected_compensation

    # 2. Total team distributed = remaining locked funds + compensation
    assert rt["total_team_distributed"] == rt["remaining_locked_funds"] + expected_compensation

    # 3. Exact conservation: sum of expert + students + fee + reserve == total_team_distributed
    total_split = rt["expert_payout"] + sum(rt["student_payouts"]) + rt["platform_fee"] + rt["ai_reserve"]
    assert total_split == rt["total_team_distributed"], f"Conservation leak: {total_split} != {rt['total_team_distributed']}"

    # 4. Sponsor penalized -0.5 stars
    with get_db() as conn:
        sponsor_after = conn.execute("SELECT stars FROM users WHERE id = 'usr_sponsor'").fetchone()
        assert round(sponsor_after["stars"], 2) == round(sponsor_stars_before - 0.5, 2)

        # 5. Company record withdrawal count incremented
        comp_rec = compute_company_record("usr_sponsor", conn)
        assert comp_rec["withdrawals"] >= 1


# ===================== 6. Pros and Cons Real Data & Profiles Credentials =====================
def test_pros_and_cons_real_data_and_profile_credentials():
    client_student = get_auth_client("student.a@vouch.local")

    # Fetch public profile for Student A
    res = client_student.get("/api/users/usr_student_a/public")
    assert res.status_code == 200
    p = res.json()

    # Certificates present on profile
    assert len(p["certificates"]) >= 2
    assert any(c["certificate_type"] == "completion_certificate" for c in p["certificates"])
    assert any(c["certificate_type"] == "verified_credit" for c in p["certificates"])

    # Pros and Cons based on real review metrics
    assert len(p["pros"]) > 0
    assert "pros_cons_data" in p
    assert p["pros_cons_data"]["limited_data"] is False  # 2 past projects

    # Check Newbie profile has no cons and limited data note
    res_newbie = client_student.get("/api/users/usr_student_c/public")
    assert res_newbie.status_code == 200
    p_newbie = res_newbie.json()
    assert p_newbie["newbie_badge"] is True
    assert p_newbie["pros_cons_data"]["is_newbie"] is True
    assert len(p_newbie["cons"]) == 0
    assert "No project history yet" in p_newbie["pros_cons_data"]["newbie_message"]


# ===================== 7. Cryptographic Ledger Chain Integrity =====================
def test_cryptographic_ledger_intact_across_all_lifecycle_steps():
    v = verify_ledger()
    assert v["status"] == "ok", f"Ledger broken at seq {v.get('seq')}: {v.get('message')}"
    assert v["count"] > 10
