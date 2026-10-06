"""
Database seeder for VOUCH demo.
Populates users, closed projects, structured reviews, conflicts of interest,
and the two active seed projects, while building an intact cryptographic ledger.
"""

import json
from datetime import datetime, timezone
from backend.database import get_db, init_db
from backend.auth import hash_password
from backend.ledger import record_ledger_entry
from backend.charter import publish_or_update_charter
from backend.config import DEFAULT_STUDENT_WEIGHTS


def seed_database():
    init_db()
    with get_db() as conn:
        # Clear existing data cleanly
        tables = [
            "project_certificates", "ai_agent_actions", "submissions", "project_messages", "project_files",
            "con_replies", "user_settings", "contact_messages", "password_resets",
            "star_penalties", "ratings_history", "notifications", "conflicts_of_interest",
            "ledger", "reviews", "payouts", "escrow_lockers", "milestones",
            "project_members", "charter_acceptances", "charters", "projects",
            "wallets", "users"
        ]
        for t in tables:
            conn.execute(f"DELETE FROM {t}")

        # 1. Seed Users (SPEC.md Section 14)
        def_pwd = "Password123!"
        h, s = hash_password(def_pwd)

        users = [
            {
                "id": "usr_sponsor",
                "email": "sponsor@vouch.local",
                "role": "sponsor",
                "name": "Apex Health AI (Sponsor)",
                "headline": "Pioneering AI-driven diagnostic healthcare systems",
                "skills": ["Clinical AI", "FDA Compliance", "Biomedical Engineering"],
                "stars": 4.7,
                "newbie": 0,
            },
            {
                "id": "usr_expert_a",
                "email": "expert.a@vouch.local",
                "role": "expert",
                "name": "Dr. Aris Thorne (Expert A)",
                "headline": "Associate Professor of Biomedical Imaging | 12+ yrs CV",
                "skills": ["Computer Vision", "Edge AI", "Medical Imaging", "Model Quantization"],
                "stars": 4.9,
                "newbie": 0,
            },
            {
                "id": "usr_expert_b",
                "email": "expert.b@vouch.local",
                "role": "expert",
                "name": "Prof. Elena Rostova (Expert B)",
                "headline": "Chief Scientist, RetinaVision Labs (Declared Conflict with Apex)",
                "skills": ["Retina Imaging", "Deep Learning", "Clinical Validation"],
                "stars": 4.8,
                "newbie": 0,
            },
            {
                "id": "usr_student_a",
                "email": "student.a@vouch.local",
                "role": "student",
                "name": "Maya Lin (Student A)",
                "headline": "Final-year MS CS student specializing in Edge ML",
                "skills": ["PyTorch", "TensorFlow Lite", "Embedded Systems", "Computer Vision"],
                "stars": 4.6,
                "newbie": 0,
            },
            {
                "id": "usr_student_b",
                "email": "student.b@vouch.local",
                "role": "student",
                "name": "Rohan Mehta (Student B)",
                "headline": "Fast-paced ML Engineer | Fast prototyper",
                "skills": ["Python", "OpenCV", "Model Compression", "FastAPI"],
                "stars": 3.9,
                "newbie": 0,
            },
            {
                "id": "usr_student_c",
                "email": "student.c@vouch.local",
                "role": "student",
                "name": "Priya Sharma (Student C)",
                "headline": "Top CS undergraduate with verified Python & Math distinction",
                "skills": ["Python", "PyTorch", "Linear Algebra", "Data Preprocessing"],
                "stars": None,
                "newbie": 1,
            },
            {
                "id": "usr_admin",
                "email": "admin@vouch.local",
                "role": "admin",
                "name": "System Admin",
                "headline": "Platform Operations & Ledger Integrity Auditor",
                "skills": ["Audit", "Governance", "Mediation"],
                "stars": 5.0,
                "newbie": 0,
            },
        ]

        for u in users:
            conn.execute(
                """
                INSERT INTO users (id, email, password_hash, salt, role, name, headline, skills_json, stars, newbie_badge)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    u["id"],
                    u["email"],
                    h,
                    s,
                    u["role"],
                    u["name"],
                    u["headline"],
                    json.dumps(u["skills"]),
                    u["stars"],
                    u["newbie"],
                ),
            )
            # Simulated wallet
            conn.execute(
                "INSERT INTO wallets (user_id, balance) VALUES (?, ?)",
                (u["id"], 500000 if u["role"] == "sponsor" else 25000),
            )
            # User Settings
            conn.execute(
                """
                INSERT INTO user_settings (user_id, notification_invites, notification_charter, notification_milestones, notification_payouts, notification_stars, notification_integrity)
                VALUES (?, 1, 1, 1, 1, 1, 1)
                """,
                (u["id"],),
            )

        # Sample initial notifications for all roles
        seed_notifs = [
            ("notif_1", "usr_student_a", "Charter v1 Ready for Review", "Apex Health AI published Charter v1 for Diabetic Retinopathy. Please review terms and accept.", "/charters/proj_retinopathy", 0),
            ("notif_2", "usr_student_a", "Milestone Payout Credited", "Milestone M1 on Past Project released. Rs 25,783 credited to wallet.", "/student/earnings", 1),
            ("notif_3", "usr_student_a", "Star Rating Updated", "Composite rating updated to 4.6 ⭐ based on peer review.", "/users/usr_student_a", 1),
            ("notif_4", "usr_student_b", "Charter v1 Ready for Review", "Review terms for Diabetic Retinopathy project.", "/charters/proj_retinopathy", 0),
            ("notif_5", "usr_student_b", "Integrity Review Cleared", "Similarity audit on Past Project 2 marked cleared by mentor.", "/student/projects", 1),
            ("notif_6", "usr_student_c", "Welcome to VOUCH Sandbox", "Newbie Badge assigned. You have an exploration matching boost for open challenges.", "/student", 0),
            ("notif_7", "usr_expert_a", "Co-Sign Charter Request", "Apex Health AI invites you as Lead Expert on Diabetic Retinopathy.", "/charters/proj_retinopathy", 0),
            ("notif_8", "usr_expert_a", "Code Review Pending", "Student A submitted Milestone 1 code artifacts for technical verification.", "/expert/reviews", 0),
            ("notif_9", "usr_expert_a", "Expert Honorarium Credited", "Rs 25,500 milestone payout share credited to wallet.", "/expert/earnings", 1),
            ("notif_10", "usr_expert_b", "Conflict of Interest Recorded", "Your declared affiliation with RetinaVision Labs is logged to the ledger.", "/expert/conflicts", 1),
            ("notif_11", "usr_sponsor", "Escrow Locker Funded", "Rs 1,00,000 locked for Diabetic Retinopathy project.", "/sponsor/wallet", 1),
            ("notif_12", "usr_sponsor", "Contributor Applied", "Student A submitted qualifications for Diabetic Retinopathy.", "/charters/proj_retinopathy", 0),
            ("notif_13", "usr_admin", "Ledger Integrity Verified", "Cryptographic hash chain validated intact across all blocks.", "/admin/ledger", 0),
            ("notif_14", "usr_admin", "Dispute Queue Clean", "Zero active disputes currently pending arbitration.", "/admin/disputes", 1),
        ]
        for n_id, u_id, title, msg, link, read_status in seed_notifs:
            conn.execute(
                "INSERT INTO notifications (id, user_id, title, message, link, read) VALUES (?, ?, ?, ?, ?, ?)",
                (n_id, u_id, title, msg, link, read_status),
            )

        # 2. Declare conflict of interest for Expert B with Apex Health AI
        conn.execute(
            """
            INSERT INTO conflicts_of_interest (id, expert_id, sponsor_id, reason)
            VALUES (?, ?, ?, ?)
            """,
            (
                "coi_1",
                "usr_expert_b",
                "usr_sponsor",
                "Advisor to rival ophthalmology imaging firm; active consultancy contract with direct IP overlap.",
            ),
        )

        # 3. Seed Past Closed Projects & Structured Reviews (for real Pros & Cons)
        past_projects = [
            {
                "id": "proj_past_1",
                "title": "On-Device Skin Lesion Classifier",
                "sponsor_id": "usr_sponsor",
                "summary": "MobileNet skin lesion classifier with 89% accuracy.",
                "outcome": "Completed & Verified: Edge model delivered with 89% sensitivity on target ARM devices. Payouts released in full, IP commercial rights transferred to sponsor, academic attribution verified on ledger.",
                "scope": "Design, train, and benchmark a quantized MobileNet edge classifier for dermatological skin lesion triage with >88% balanced multiclass accuracy.",
                "ip_clause": "Sponsor retains commercial licensing rights; student contributors retain open academic publication rights and named co-authorship.",
                "confidentiality": "De-identified dermoscopy training datasets restricted to approved project environments; no external redistribution.",
                "exit_terms": "Milestone-gated payouts with 100% escrow release upon acceptance. Disputed milestones reviewed by expert mentor.",
                "commercialisation": "Academic research publication permitted following 60-day patent review clearance.",
                "split": {
                    "platform_fee_pct": 0.10,
                    "ai_reserve_pct": 0.05,
                    "expert_pool_pct": 0.30,
                    "student_pool_pct": 0.70,
                    "student_weights": {"usr_student_a": 1.0},
                },
                "members": [
                    ("usr_sponsor", "sponsor"),
                    ("usr_student_a", "student"),
                    ("usr_expert_a", "expert"),
                ],
                "milestones": [
                    ("ms_past1_1", 1, "Dataset Preparation & Quantization Pipeline", "Preprocessing, normalization, and INT8 calibration benchmarks", 35000),
                    ("ms_past1_2", 2, "Edge Optimization & Clinical Validation", "ARM Cortex-A deployment, latency validation (<120ms), and final report", 40000),
                ],
            },
            {
                "id": "proj_past_2",
                "title": "Cardio Acoustic Pulse Analyzer",
                "sponsor_id": "usr_sponsor",
                "summary": "Audio DSP pipeline for digital stethoscopes.",
                "outcome": "Completed & Verified: Audio DSP pipeline integrated into digital stethoscope firmware. All milestone payouts released on-time, academic attribution verified on ledger.",
                "scope": "Develop low-latency digital signal processing filters and systolic murmur detection pipeline for digital stethoscope recordings.",
                "ip_clause": "Dual licensing: core firmware routines licensed under commercial terms to sponsor; generalized DSP algorithms available under academic research attribution.",
                "confidentiality": "Synthetic and clinical acoustic phonocardiogram signals strictly confidential.",
                "exit_terms": "Standard escrow release per completed milestone. Uncontested pro-rata release on verified milestones.",
                "commercialisation": "Sponsor commercial rights active upon final milestone payout release.",
                "split": {
                    "platform_fee_pct": 0.10,
                    "ai_reserve_pct": 0.05,
                    "expert_pool_pct": 0.30,
                    "student_pool_pct": 0.70,
                    "student_weights": {"usr_student_a": 0.50, "usr_student_b": 0.50},
                },
                "members": [
                    ("usr_sponsor", "sponsor"),
                    ("usr_student_a", "student"),
                    ("usr_student_b", "student"),
                    ("usr_expert_a", "expert"),
                ],
                "milestones": [
                    ("ms_past2_1", 1, "Acoustic DSP Filtering Engine", "Bandpass filtering and phonocardiogram signal segmentation", 35000),
                    ("ms_past2_2", 2, "Murmur Classification Architecture", "Feature extraction and lightweight edge classifier with low battery draw", 40000),
                ],
            },
            {
                "id": "proj_past_3",
                "title": "Pediatric X-Ray Pneumonia Triage",
                "sponsor_id": "usr_sponsor",
                "summary": "Automated triage network for rural clinics.",
                "outcome": "Completed & Verified: Pneumonia triage neural net validated against rural benchmark scans with zero critical regressions. Payouts released in full.",
                "scope": "Deploy convolutional network for automated pediatric pneumonia opacity triage on chest radiographs in remote clinics.",
                "ip_clause": "Open clinical benchmarking suite with proprietary deployment optimizations retained by sponsor.",
                "confidentiality": "Strict anonymization of patient records per national health data standards.",
                "exit_terms": "Independent expert sign-off required for milestone completion and escrow dispersal.",
                "commercialisation": "Non-exclusive commercial deployment rights with perpetual student credit.",
                "split": {
                    "platform_fee_pct": 0.10,
                    "ai_reserve_pct": 0.05,
                    "expert_pool_pct": 0.30,
                    "student_pool_pct": 0.70,
                    "student_weights": {"usr_student_b": 1.0},
                },
                "members": [
                    ("usr_sponsor", "sponsor"),
                    ("usr_student_b", "student"),
                    ("usr_expert_a", "expert"),
                ],
                "milestones": [
                    ("ms_past3_1", 1, "Radiograph Augmentation & Anonymization", "Automated lung masking and high-resolution radiograph standardization", 35000),
                    ("ms_past3_2", 2, "Sensitivity Thresholding & Triage Model", "Clinical validation achieving >92% sensitivity on pediatric cohort", 40000),
                ],
            },
        ]

        for p in past_projects:
            conn.execute(
                """
                INSERT INTO projects (
                    id, title, public_summary, confidential_brief, budget,
                    engagement_model, status, final_outcome, sponsor_id
                )
                VALUES (?, ?, ?, ?, ?, 'funded', 'closed', ?, ?)
                """,
                (p["id"], p["title"], p["summary"], "Archived confidential brief (sealed upon project completion)", 75000, p["outcome"], p["sponsor_id"]),
            )
            # Create stable closed charter v1 for every past project
            charter_id = f"charter_{p['id']}_v1"
            conn.execute(
                """
                INSERT INTO charters (
                    id, project_id, version, engagement_model, scope, ip_clause,
                    confidentiality_clause, exit_terms, commercialisation_clause,
                    split_config_json, is_current
                ) VALUES (?, ?, 1, 'funded', ?, ?, ?, ?, ?, ?, 1)
                """,
                (
                    charter_id,
                    p["id"],
                    p["scope"],
                    p["ip_clause"],
                    p["confidentiality"],
                    p["exit_terms"],
                    p["commercialisation"],
                    json.dumps(p["split"]),
                ),
            )
            record_ledger_entry(
                actor=p["sponsor_id"],
                action="CHARTER_PUBLISHED",
                payload={"project_id": p["id"], "charter_id": charter_id, "version": 1, "model": "funded"},
                conn=conn,
            )

            # Seed project members and their charter acceptances
            for m_uid, m_role in p["members"]:
                mem_id = f"mem_{p['id']}_{m_uid}"
                conn.execute(
                    """
                    INSERT INTO project_members (id, project_id, user_id, role, status)
                    VALUES (?, ?, ?, ?, 'accepted')
                    """,
                    (mem_id, p["id"], m_uid, m_role),
                )
                acc_id = f"acc_{p['id']}_{m_uid}_v1"
                conn.execute(
                    """
                    INSERT INTO charter_acceptances (id, charter_id, project_id, user_id, version, engagement_model_accepted)
                    VALUES (?, ?, ?, ?, 1, 1)
                    """,
                    (acc_id, charter_id, p["id"], m_uid),
                )
                record_ledger_entry(
                    actor=m_uid,
                    action="CHARTER_ACCEPTED",
                    payload={"project_id": p["id"], "charter_id": charter_id, "version": 1, "engagement_model": "funded"},
                    conn=conn,
                )

            # Seed milestones
            for ms_id, seq, ms_title, ms_desc, ms_budget in p["milestones"]:
                conn.execute(
                    """
                    INSERT INTO milestones (id, project_id, sequence, title, description, budget, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'completed')
                    """,
                    (ms_id, p["id"], seq, ms_title, ms_desc, ms_budget),
                )

            # Ledger entry for past closed project
            record_ledger_entry(
                actor=p["sponsor_id"],
                action="PROJECT_CLOSED",
                payload={"project_id": p["id"], "title": p["title"], "outcome": p["outcome"]},
                conn=conn,
            )

        # Structured reviews for Student A: strong quality (4.8), communication (4.7), one late milestone (timeliness 3.8)
        reviews_student_a = [
            ("usr_sponsor", "usr_student_a", "proj_past_1", 4.9, 4.0, 4.8, 4.8, 5.0, "Outstanding mathematical rigor and architecture."),
            ("usr_expert_a", "usr_student_a", "proj_past_1", 4.8, 3.6, 4.7, 4.7, 5.0, "High quality code, slightly missed deadline on M2."),
            ("usr_sponsor", "usr_student_a", "proj_past_2", 4.7, 4.5, 4.6, 4.7, 5.0, "Delivered solid edge model with clear documentation."),
        ]

        # Structured reviews for Student B: fast (4.5), but twice flagged for similarity, quality (3.7), integrity (3.4)
        reviews_student_b = [
            ("usr_sponsor", "usr_student_b", "proj_past_2", 3.8, 4.6, 3.8, 4.0, 3.4, "Fast execution but code had unverified external snippet overlaps."),
            ("usr_expert_a", "usr_student_b", "proj_past_3", 3.6, 4.5, 3.5, 3.8, 3.4, "Delivered quickly, submission flagged during similarity audit."),
        ]

        # Structured reviews for Expert A: high quality guidance
        reviews_expert_a = [
            ("usr_sponsor", "usr_expert_a", "proj_past_1", 5.0, 4.9, 4.9, 5.0, 5.0, "World-class architectural guidance throughout."),
            ("usr_student_a", "usr_expert_a", "proj_past_1", 5.0, 4.8, 4.9, 5.0, 5.0, "Invaluable mentorship, clear explanations of quantization error."),
        ]

        # Reviews for Sponsor: pays on time, clear acceptance
        reviews_sponsor = [
            ("usr_student_a", "usr_sponsor", "proj_past_1", 4.8, 5.0, 4.7, 4.8, 5.0, "Prompt milestone acceptance and clear requirements.", 4.9, 4.8),
            ("usr_expert_a", "usr_sponsor", "proj_past_2", 4.7, 5.0, 4.8, 4.9, 5.0, "Reliable sponsor, escrow releases happened same-day.", 4.8, 4.7),
        ]

        all_reviews = []
        for r in reviews_student_a + reviews_student_b + reviews_expert_a:
            all_reviews.append((r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], None, None, r[8]))
        for r in reviews_sponsor:
            all_reviews.append((r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[9], r[10], r[8]))

        for idx, rev in enumerate(all_reviews):
            rev_id = f"rev_{idx+1}"
            ledger_ref = f"ledger_{rev_id}"
            conn.execute(
                """
                INSERT INTO reviews (
                    id, reviewer_id, reviewee_id, project_id, quality, timeliness,
                    communication, collaboration, integrity, fairness, clarity, comment, ledger_ref
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (rev_id, rev[0], rev[1], rev[2], rev[3], rev[4], rev[5], rev[6], rev[7], rev[8], rev[9], rev[10], ledger_ref),
            )
            record_ledger_entry(
                actor=rev[0],
                action="REVIEW_SUBMITTED",
                payload={"review_id": rev_id, "reviewee_id": rev[1], "project_id": rev[2]},
                conn=conn,
            )

        # Initial ratings history for users with established ratings
        initial_ratings = [
            ("usr_student_a", None, 4.6, 4.6, "Initial platform rating established from 2 closed project peer reviews"),
            ("usr_student_b", None, 3.9, 3.9, "Initial platform rating established across 2 projects with similarity audit adjustment"),
            ("usr_expert_a", None, 4.9, 4.9, "Consistently high 5.0 peer ratings across biomedical mentoring engagements"),
            ("usr_sponsor", None, 4.7, 4.7, "Consistent prompt escrow releases and clear acceptance criteria"),
        ]
        for user_id, old_r, new_r, delta, reason in initial_ratings:
            entry = record_ledger_entry(
                actor=user_id,
                on_behalf_of=user_id,
                action="STAR_RATING_UPDATED",
                payload={"user_id": user_id, "old_rating": old_r, "new_rating": new_r, "delta": delta, "reason": reason},
                conn=conn,
            )
            conn.execute(
                """
                INSERT INTO ratings_history (id, user_id, old_rating, new_rating, delta, reason, ledger_seq)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (f"rh_init_{user_id}", user_id, old_r, new_r, delta, reason, entry["seq"]),
            )

        # Seed verifiable credentials & certificates for closed past projects (SPEC.md Section 8 & 11)
        initial_certs = [
            ("cert_sa_1", "proj_past_1", "usr_student_a", "student", "verified_credit", "Verified Milestone Credit: Edge Quantization Pipeline", "ledger_cert_sa_1"),
            ("cert_sa_2", "proj_past_1", "usr_student_a", "student", "completion_certificate", "Project Completion Certificate: On-Device Skin Lesion Classifier", "ledger_cert_sa_2"),
            ("cert_sa_3", "proj_past_2", "usr_student_a", "student", "verified_credit", "Verified Milestone Credit: DSP Preprocessing Engine", "ledger_cert_sa_3"),
            ("cert_ea_1", "proj_past_1", "usr_expert_a", "expert", "co_authorship", "Co-Authorship & Advisory Verification: On-Device Skin Lesion Classifier", "ledger_cert_ea_1"),
            ("cert_ea_2", "proj_past_2", "usr_expert_a", "expert", "co_authorship", "Co-Authorship & Advisory Verification: Cardio Acoustic Pulse Analyzer", "ledger_cert_ea_2"),
            ("cert_sb_1", "proj_past_2", "usr_student_b", "student", "verified_credit", "Verified Milestone Credit: Model Normalization Pipeline", "ledger_cert_sb_1"),
            ("cert_sb_2", "proj_past_3", "usr_student_b", "student", "verified_credit", "Verified Milestone Credit: Synthetic EEG Generator", "ledger_cert_sb_2"),
        ]
        for c in initial_certs:
            conn.execute(
                """
                INSERT INTO project_certificates (id, project_id, recipient_id, recipient_role, certificate_type, title, ledger_ref)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                c,
            )
            record_ledger_entry(
                actor="system",
                on_behalf_of=c[1],
                action="CREDENTIAL_ISSUED",
                payload={"cert_id": c[0], "project_id": c[1], "recipient_id": c[2], "title": c[5]},
                conn=conn,
            )

        # 4. Active Seed Project 1: Diabetic Retinopathy (Funded, Rs 1,00,000)
        proj_retino_id = "proj_retinopathy"
        conn.execute(
            """
            INSERT INTO projects (
                id, title, public_summary, confidential_brief, datasets_json,
                budget, engagement_model, status, sponsor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
            """,
            (
                proj_retino_id,
                "Low-cost detection of diabetic retinopathy from fundus images on edge devices",
                "Develop a quantized TensorFlow Lite / ONNX model detecting referable diabetic retinopathy on Raspberry Pi / Android edge hardware with >90% clinical sensitivity.",
                "CONFIDENTIAL CLINICAL BRIEF: High-resolution proprietary dataset of 12,000 annotated macular scans from rural screening clinics in Tamil Nadu. Ground truth verified by 3 retina specialists. Target latency under 350ms on Cortex-A53 without cloud connectivity.",
                json.dumps(["rural_fundus_macular_v2.tar.gz", "annotations_gold_standard.json"]),
                100000,
                "funded",
                "usr_sponsor",
            ),
        )

        record_ledger_entry(
            actor="usr_sponsor",
            action="PROJECT_CREATED",
            payload={"project_id": proj_retino_id, "budget": 100000, "model": "funded"},
            conn=conn,
        )

        # Seed milestones for Diabetic Retinopathy
        m_retino = [
            ("ms_retino_1", proj_retino_id, 1, "Data Pipeline & Preprocessing Benchmark", "Normalization, artifact removal, and TFLite baseline pipeline", 30000),
            ("ms_retino_2", proj_retino_id, 2, "Quantized Model Architecture & Training", "INT8 post-training quantization achieving <350ms latency", 40000),
            ("ms_retino_3", proj_retino_id, 3, "Edge Validation & Clinical Evaluation Report", "Hardware deployment on Raspberry Pi with >90% sensitivity verification", 30000),
        ]
        for m in m_retino:
            conn.execute(
                """
                INSERT INTO milestones (id, project_id, sequence, title, description, budget, status)
                VALUES (?, ?, ?, ?, ?, ?, 'funded')
                """,
                m,
            )

        # Escrow Locker funded for Diabetic Retinopathy
        conn.execute(
            """
            INSERT INTO escrow_lockers (id, project_id, amount, status)
            VALUES (?, ?, ?, 'funded')
            """,
            ("locker_retino", proj_retino_id, 100000),
        )
        record_ledger_entry(
            actor="usr_sponsor",
            action="LOCKER_FUNDED",
            payload={"project_id": proj_retino_id, "amount": 100000},
            conn=conn,
        )

        # 5. Active Seed Project 2: Knowledge Sharing NLP Benchmark
        proj_nlp_id = "proj_indic_nlp"
        conn.execute(
            """
            INSERT INTO projects (
                id, title, public_summary, confidential_brief, datasets_json,
                budget, engagement_model, status, sponsor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
            """,
            (
                proj_nlp_id,
                "Open Clinical NLP Benchmark for Low-Resource Indic Languages",
                "Collaborative open-source effort to curate clinical terminology dictionaries and zero-shot NER models across Hindi, Tamil, and Bengali.",
                "CONFIDENTIAL WORKING DRAFT: Unprocessed EHR clinical discharge summaries anonymized per HIPAA Safe Harbor from partner teaching hospitals.",
                json.dumps(["indic_ehr_unannotated_sample.json"]),
                0,
                "knowledge-sharing",
                "usr_sponsor",
            ),
        )
        record_ledger_entry(
            actor="usr_sponsor",
            action="PROJECT_CREATED",
            payload={"project_id": proj_nlp_id, "budget": 0, "model": "knowledge-sharing"},
            conn=conn,
        )

    # Publish Charter v1 for Diabetic Retinopathy
    publish_or_update_charter(
        project_id=proj_retino_id,
        actor_id="usr_sponsor",
        scope="Design, train, and test an edge-deployable diabetic retinopathy screening network.",
        ip_clause="Sponsor retains commercial licensing rights; student and expert maintain attribution and co-authorship.",
        confidentiality_clause="All patient scans and labels strictly non-disclosable outside project sandbox.",
        exit_terms="Pro-rata payment for accepted milestones; unreleased funds returned to pool or compensated per SPEC Section 9.",
        commercialisation_clause="Open research publication permitted after 90 days from close.",
        split_config={
            "platform_fee_pct": 0.10,
            "ai_reserve_pct": 0.05,
            "expert_pool_pct": 0.30,
            "student_pool_pct": 0.70,
            "student_weights": DEFAULT_STUDENT_WEIGHTS,
        },
        engagement_model="funded",
    )

    # Publish Charter v1 for Indic NLP
    publish_or_update_charter(
        project_id=proj_nlp_id,
        actor_id="usr_sponsor",
        scope="Curate multilingual clinical dictionaries and publish open benchmarking suite.",
        ip_clause="Open source Apache 2.0 license for code; Creative Commons CC-BY for lexicon.",
        confidentiality_clause="Strict anonymization of patient identifiers.",
        exit_terms="Mutual exit at milestone boundaries with credit recorded on ledger.",
        commercialisation_clause="Non-monetary institutional credit and verified co-authorship.",
        split_config={"non_monetary": True},
        engagement_model="knowledge-sharing",
    )

    with get_db() as conn:
        # Seed accepted members for proj_retinopathy
        members_retino = [
            ("pm_retino_sponsor", proj_retino_id, "usr_sponsor", "sponsor", "accepted", 0.0),
            ("pm_retino_expert_a", proj_retino_id, "usr_expert_a", "expert", "accepted", 0.0),
            ("pm_retino_student_b", proj_retino_id, "usr_student_b", "student", "accepted", 0.5),
        ]
        for pm in members_retino:
            conn.execute(
                """
                INSERT OR REPLACE INTO project_members (id, project_id, user_id, role, status, weight)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                pm,
            )

        # Seed charter acceptances for members (usr_student_a left unaccepted so test_core brief gating works)
        retino_charter = conn.execute("SELECT id FROM charters WHERE project_id = ? AND is_current = 1", (proj_retino_id,)).fetchone()
        charter_retino_id = retino_charter["id"] if retino_charter else "charter_proj_retinopathy_v1"
        for u_id in ["usr_expert_a", "usr_student_b"]:
            conn.execute(
                """
                INSERT OR REPLACE INTO charter_acceptances (id, charter_id, project_id, user_id, version, engagement_model_accepted)
                VALUES (?, ?, ?, ?, 1, 1)
                """,
                (f"acc_retino_{u_id}", charter_retino_id, proj_retino_id, u_id),
            )

        # Seed sample project file
        sample_code = "import tflite_runtime.interpreter as tflite\n# VOUCH verified edge pipeline\nprint('Model loaded')"
        import hashlib
        sample_hash = hashlib.sha256(sample_code.encode("utf-8")).hexdigest()
        conn.execute(
            """
            INSERT INTO project_files (id, project_id, uploader_id, filename, file_size, sha256_hash, watermark_text)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("file_retino_1", proj_retino_id, "usr_student_b", "fundus_edge_benchmark.py", len(sample_code), sample_hash, "VOUCH_SECURE_WATERMARK_ROHAN"),
        )
        record_ledger_entry(
            actor="usr_student_b",
            on_behalf_of=proj_retino_id,
            action="FILE_UPLOADED",
            payload={"project_id": proj_retino_id, "filename": "fundus_edge_benchmark.py", "sha256_hash": sample_hash},
            conn=conn,
        )

        # Seed sample chat messages
        conn.execute(
            """
            INSERT INTO project_messages (id, project_id, sender_id, sender_name, sender_role, content)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("msg_retino_1", proj_retino_id, "usr_expert_a", "Dr. Aris Thorne (Expert A)", "expert", "Welcome Rohan. Milestone 1 focus is TFLite INT8 quantization baseline."),
        )
        conn.execute(
            """
            INSERT INTO project_messages (id, project_id, sender_id, sender_name, sender_role, content)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("msg_retino_2", proj_retino_id, "usr_student_b", "Rohan Verma (Student B)", "student", "Uploaded the preprocessing pipeline script. Calibration runs are underway on the edge testbench."),
        )

        # Seed sample submission for Milestone 1
        sub_content = "Completed initial image normalization, macular artifact removal, and TFLite baseline pipeline achieving 310ms inference latency."
        sub_hash = hashlib.sha256(sub_content.encode("utf-8")).hexdigest()
        conn.execute(
            """
            INSERT INTO submissions (
                id, project_id, milestone_id, author_id, title, content, file_hash,
                ai_used, ai_share_pct, ai_declaration, integrity_status, similarity_score, status
            ) VALUES (?, ?, 'ms_retino_1', 'usr_student_b', ?, ?, ?, 1, 15.0, ?, 'clean', 0.05, 'submitted')
            """,
            (
                "sub_retino_m1",
                proj_retino_id,
                "TFLite Edge Preprocessing & Baseline Pipeline",
                sub_content,
                sub_hash,
                "Used GitHub Copilot for boilerplate test fixture generation; edge quantization logic written manually.",
            ),
        )

        # Seed accepted members for Indic NLP (usr_student_a omitted so student_a can apply in test_core_story)
        members_nlp = [
            ("pm_nlp_sponsor", proj_nlp_id, "usr_sponsor", "sponsor", "accepted", 0.0),
            ("pm_nlp_student_b", proj_nlp_id, "usr_student_b", "student", "accepted", 0.5),
            ("pm_nlp_expert_a", proj_nlp_id, "usr_expert_a", "expert", "accepted", 0.0),
        ]
        for pm in members_nlp:
            conn.execute(
                """
                INSERT OR REPLACE INTO project_members (id, project_id, user_id, role, status, weight)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                pm,
            )


if __name__ == "__main__":
    seed_database()
    print("Database seeded successfully with users, projects, charters, and intact ledger.")
