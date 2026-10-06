"""
Database setup and connection helpers for SQLite.
Creates all required tables if they don't exist.
"""

import sqlite3
import os
from contextlib import contextmanager
from typing import Generator
from backend.config import DB_PATH

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL, -- student, expert, sponsor, admin
    name TEXT NOT NULL,
    headline TEXT DEFAULT '',
    skills_json TEXT DEFAULT '[]',
    interests_json TEXT DEFAULT '[]',
    weekly_hours INTEGER DEFAULT 20,
    avatar_initials TEXT DEFAULT '',
    is_kyc_verified INTEGER DEFAULT 1,
    stars REAL DEFAULT NULL,
    newbie_badge INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    public_summary TEXT NOT NULL,
    confidential_brief TEXT NOT NULL,
    datasets_json TEXT DEFAULT '[]',
    budget INTEGER DEFAULT 0,
    engagement_model TEXT NOT NULL, -- funded, stipend, knowledge-sharing, institutional-credit
    sensitivity_label TEXT DEFAULT 'Confidential', -- Public, Confidential, Strictly Restricted
    status TEXT DEFAULT 'open',     -- draft, open, in_progress, closed, withdrawn
    final_outcome TEXT DEFAULT NULL, -- Verified deliverable outcome for closed projects
    sponsor_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sponsor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS charters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    engagement_model TEXT NOT NULL,
    scope TEXT NOT NULL,
    ip_clause TEXT NOT NULL,
    confidentiality_clause TEXT NOT NULL,
    exit_terms TEXT NOT NULL,
    commercialisation_clause TEXT NOT NULL,
    split_config_json TEXT NOT NULL,
    is_current INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS charter_acceptances (
    id TEXT PRIMARY KEY,
    charter_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    engagement_model_accepted INTEGER DEFAULT 1,
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(charter_id) REFERENCES charters(id),
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- student, expert, sponsor
    status TEXT DEFAULT 'accepted', -- applied, invited, accepted, quit, removed
    weight REAL DEFAULT 0.0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    skills_json TEXT DEFAULT '[]',
    budget INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, funded, in_progress, submitted, accepted, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS escrow_lockers (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    milestone_id TEXT,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'funded', -- empty, funded, released, refunded
    funded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    milestone_id TEXT,
    recipient_id TEXT NOT NULL,
    recipient_role TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    ledger_ref TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(recipient_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    reviewee_id TEXT NOT NULL,
    quality REAL NOT NULL,
    timeliness REAL NOT NULL,
    communication REAL NOT NULL,
    collaboration REAL NOT NULL,
    integrity REAL NOT NULL,
    fairness REAL,
    clarity REAL,
    comment TEXT DEFAULT '',
    tags_json TEXT DEFAULT '[]',
    ledger_ref TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(reviewer_id) REFERENCES users(id),
    FOREIGN KEY(reviewee_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ledger (
    seq INTEGER PRIMARY KEY,
    timestamp TEXT NOT NULL,
    actor TEXT NOT NULL,
    on_behalf_of TEXT NOT NULL,
    action TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    entry_hash TEXT NOT NULL,
    payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conflicts_of_interest (
    id TEXT PRIMARY KEY,
    expert_id TEXT NOT NULL,
    sponsor_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    declared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(expert_id) REFERENCES users(id),
    FOREIGN KEY(sponsor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT DEFAULT '',
    read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ratings_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    old_rating REAL,
    new_rating REAL,
    delta REAL,
    reason TEXT NOT NULL,
    ledger_seq INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS star_penalties (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    penalty_type TEXT NOT NULL, -- quit, withdraw, admin_adjustment
    penalty_value REAL NOT NULL, -- e.g. -0.5
    reason TEXT NOT NULL,
    good_cause INTEGER DEFAULT 0,
    ledger_seq INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS con_replies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    con_key TEXT NOT NULL,
    reply_text TEXT NOT NULL,
    ledger_ref TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    notification_invites INTEGER DEFAULT 1,
    notification_charter INTEGER DEFAULT 1,
    notification_milestones INTEGER DEFAULT 1,
    notification_payouts INTEGER DEFAULT 1,
    notification_stars INTEGER DEFAULT 1,
    notification_integrity INTEGER DEFAULT 1,
    delete_requested INTEGER DEFAULT 0,
    portfolio_links_json TEXT DEFAULT '[]',
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    uploader_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    sha256_hash TEXT NOT NULL,
    watermark_text TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(uploader_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_messages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    milestone_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_hash TEXT,
    ai_used INTEGER NOT NULL DEFAULT 0,
    ai_share_pct REAL NOT NULL DEFAULT 0.0,
    ai_declaration TEXT DEFAULT '',
    integrity_status TEXT DEFAULT 'clean', -- clean, flagged_similarity, flagged_injection
    similarity_score REAL DEFAULT 0.0,
    similarity_match_source TEXT DEFAULT '',
    status TEXT DEFAULT 'submitted', -- submitted, changes_requested, expert_approved, expert_rejected, sponsor_accepted, sponsor_rejected
    expert_comment TEXT DEFAULT '',
    expert_reviewed_by TEXT,
    expert_reviewed_at TIMESTAMP,
    sponsor_decision_reason TEXT DEFAULT '',
    sponsor_decided_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(milestone_id) REFERENCES milestones(id),
    FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_agent_actions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_payload_json TEXT NOT NULL,
    status TEXT DEFAULT 'pending_approval', -- pending_approval, approved, rejected
    approved_by TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_certificates (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    recipient_role TEXT NOT NULL,
    certificate_type TEXT NOT NULL, -- co_authorship, verified_credit, completion_certificate
    title TEXT NOT NULL,
    ledger_ref TEXT NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(recipient_id) REFERENCES users(id)
);
"""


def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


def get_db_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db(db_path: str = DB_PATH) -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(db_path: str = DB_PATH):
    with get_db(db_path) as conn:
        conn.executescript(SCHEMA_SQL)
        try:
            conn.execute("ALTER TABLE projects ADD COLUMN sensitivity_label TEXT DEFAULT 'Confidential'")
        except sqlite3.OperationalError:
            pass  # column already exists
        try:
            conn.execute("ALTER TABLE projects ADD COLUMN final_outcome TEXT DEFAULT NULL")
        except sqlite3.OperationalError:
            pass  # column already exists

