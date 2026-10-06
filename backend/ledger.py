"""
Hash-chained Append-Only Ledger implementation.
Follows SPEC.md Section 11:
entry_hash = SHA256(seq|timestamp|actor|on_behalf_of|action|payload_hash|prev_hash)
"""

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple, List
from backend.database import get_db

GENESIS_PREV_HASH = "0" * 64


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def compute_entry_hash(
    seq: int,
    timestamp: str,
    actor: str,
    on_behalf_of: str,
    action: str,
    payload_hash: str,
    prev_hash: str,
) -> str:
    raw = f"{seq}|{timestamp}|{actor}|{on_behalf_of}|{action}|{payload_hash}|{prev_hash}"
    return sha256_text(raw)


def record_ledger_entry(
    actor: str,
    action: str,
    payload: Dict[str, Any],
    on_behalf_of: Optional[str] = None,
    conn: Optional[sqlite3.Connection] = None,
) -> Dict[str, Any]:
    """
    Appends a new entry to the immutable ledger.
    Can be called within an existing transaction if conn is provided.
    """
    actor_str = str(actor or "SYSTEM")
    on_behalf_str = str(on_behalf_of or actor_str)
    action_str = str(action)
    payload_json = json.dumps(payload, sort_keys=True)
    payload_hash = sha256_text(payload_json)
    timestamp = datetime.now(timezone.utc).isoformat()

    def _execute(c: sqlite3.Connection):
        last_row = c.execute(
            "SELECT seq, entry_hash FROM ledger ORDER BY seq DESC LIMIT 1"
        ).fetchone()

        if last_row:
            seq = last_row["seq"] + 1
            prev_hash = last_row["entry_hash"]
        else:
            seq = 1
            prev_hash = GENESIS_PREV_HASH

        entry_hash = compute_entry_hash(
            seq=seq,
            timestamp=timestamp,
            actor=actor_str,
            on_behalf_of=on_behalf_str,
            action=action_str,
            payload_hash=payload_hash,
            prev_hash=prev_hash,
        )

        c.execute(
            """
            INSERT INTO ledger (seq, timestamp, actor, on_behalf_of, action, payload_hash, prev_hash, entry_hash, payload_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                seq,
                timestamp,
                actor_str,
                on_behalf_str,
                action_str,
                payload_hash,
                prev_hash,
                entry_hash,
                payload_json,
            ),
        )
        return {
            "seq": seq,
            "timestamp": timestamp,
            "actor": actor_str,
            "on_behalf_of": on_behalf_str,
            "action": action_str,
            "payload_hash": payload_hash,
            "prev_hash": prev_hash,
            "entry_hash": entry_hash,
            "payload": payload,
        }

    if conn is not None:
        return _execute(conn)
    else:
        with get_db() as c:
            return _execute(c)


def verify_ledger(conn: Optional[sqlite3.Connection] = None) -> Dict[str, Any]:
    """
    Verifies the entire hash chain from seq 1 to the end.
    Returns status 'ok' or 'tampered' with the first broken sequence.
    """
    def _run_verify(c: sqlite3.Connection):
        rows = c.execute("SELECT * FROM ledger ORDER BY seq ASC").fetchall()
        if not rows:
            return {"status": "ok", "count": 0, "message": "Ledger is empty"}

        expected_prev = GENESIS_PREV_HASH
        for row in rows:
            seq = row["seq"]
            # 1. Verify prev_hash link
            if row["prev_hash"] != expected_prev:
                return {
                    "status": "tampered",
                    "broken_seq": seq,
                    "reason": f"Broken chain link at seq {seq}: prev_hash does not match preceding entry_hash",
                }

            # 2. Verify payload hash
            calc_payload_hash = sha256_text(row["payload_json"])
            if calc_payload_hash != row["payload_hash"]:
                return {
                    "status": "tampered",
                    "broken_seq": seq,
                    "reason": f"Payload tampering at seq {seq}: payload hash mismatch",
                }

            # 3. Verify entry_hash
            calc_entry_hash = compute_entry_hash(
                seq=row["seq"],
                timestamp=row["timestamp"],
                actor=row["actor"],
                on_behalf_of=row["on_behalf_of"],
                action=row["action"],
                payload_hash=row["payload_hash"],
                prev_hash=row["prev_hash"],
            )
            if calc_entry_hash != row["entry_hash"]:
                return {
                    "status": "tampered",
                    "broken_seq": seq,
                    "reason": f"Hash signature mismatch at seq {seq}",
                }

            expected_prev = row["entry_hash"]

        return {
            "status": "ok",
            "count": len(rows),
            "head_seq": rows[-1]["seq"],
            "head_hash": rows[-1]["entry_hash"],
            "message": "All entries verified intact",
        }

    if conn is not None:
        return _run_verify(conn)
    else:
        with get_db() as c:
            return _run_verify(c)


def simulate_tamper(target_seq: Optional[int] = None, conn: Optional[sqlite3.Connection] = None) -> Dict[str, Any]:
    """
    Admin demo action: alters an existing ledger entry's payload in SQLite
    without updating entry_hash, ensuring verify_ledger() catches it immediately.
    """
    def _run_tamper(c: sqlite3.Connection):
        if target_seq is None:
            # Pick the second entry if available, else first
            row = c.execute("SELECT seq FROM ledger ORDER BY seq ASC LIMIT 2").fetchall()
            if not row:
                raise ValueError("No ledger entries to tamper with")
            seq = row[1]["seq"] if len(row) > 1 else row[0]["seq"]
        else:
            seq = target_seq

        # Corrupt the payload_json
        c.execute(
            "UPDATE ledger SET payload_json = ? WHERE seq = ?",
            ('{"tampered": true, "unauthorized_modification": "altered_amount_50000"}', seq),
        )
        return {"status": "tampered", "tampered_seq": seq}

    if conn is not None:
        return _run_tamper(conn)
    else:
        with get_db() as c:
            return _run_tamper(c)
