"""
Charter management and versioning module.
Handles creation, version updates, and member acceptances with automatic ledger logging.
"""

import json
import uuid
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from backend.database import get_db
from backend.ledger import record_ledger_entry


def publish_or_update_charter(
    project_id: str,
    actor_id: str,
    scope: str,
    ip_clause: str,
    confidentiality_clause: str,
    exit_terms: str,
    commercialisation_clause: str,
    split_config: Dict[str, Any],
    engagement_model: str,
) -> Dict[str, Any]:
    with get_db() as conn:
        project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get latest version
        latest = conn.execute(
            "SELECT MAX(version) as max_v FROM charters WHERE project_id = ?",
            (project_id,),
        ).fetchone()

        new_version = (latest["max_v"] or 0) + 1 if latest and latest["max_v"] else 1
        charter_id = f"charter_{project_id}_v{new_version}"

        # Mark all previous versions as not current
        conn.execute(
            "UPDATE charters SET is_current = 0 WHERE project_id = ?",
            (project_id,),
        )

        split_json = json.dumps(split_config)

        conn.execute(
            """
            INSERT INTO charters (
                id, project_id, version, engagement_model, scope, ip_clause,
                confidentiality_clause, exit_terms, commercialisation_clause,
                split_config_json, is_current
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                charter_id,
                project_id,
                new_version,
                engagement_model,
                scope,
                ip_clause,
                confidentiality_clause,
                exit_terms,
                commercialisation_clause,
                split_json,
            ),
        )

        # Log to ledger
        payload = {
            "project_id": project_id,
            "charter_id": charter_id,
            "version": new_version,
            "engagement_model": engagement_model,
            "scope": scope,
        }
        record_ledger_entry(
            actor=actor_id,
            action="CHARTER_PUBLISHED",
            payload=payload,
            conn=conn,
        )

        # In-app notifications to all project members
        members = conn.execute("SELECT user_id FROM project_members WHERE project_id = ?", (project_id,)).fetchall()
        for m in members:
            if m["user_id"] != actor_id:
                notif_id = f"notif_{uuid.uuid4().hex[:12]}"
                conn.execute(
                    "INSERT INTO notifications (id, user_id, title, message, link, read) VALUES (?, ?, ?, ?, ?, 0)",
                    (
                        notif_id,
                        m["user_id"],
                        f"Charter v{new_version} Published",
                        f"Charter version {new_version} published for {project['title']}. Review terms to unlock brief.",
                        f"/charters/{project_id}",
                    ),
                )

        return {
            "charter_id": charter_id,
            "project_id": project_id,
            "version": new_version,
            "engagement_model": engagement_model,
            "is_current": True,
        }


def accept_charter(
    project_id: str,
    user_id: str,
    version: int,
    accept_engagement_model: bool = True,
) -> Dict[str, Any]:
    if not accept_engagement_model:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Engagement model must be explicitly accepted alongside the charter agreement.",
        )

    with get_db() as conn:
        charter = conn.execute(
            "SELECT * FROM charters WHERE project_id = ? AND version = ? AND is_current = 1",
            (project_id, version),
        ).fetchone()

        if not charter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Active charter v{version} for project '{project_id}' not found or is outdated.",
            )

        acceptance_id = f"acc_{project_id}_{user_id}_v{version}"

        # Insert or replace acceptance
        conn.execute(
            """
            INSERT OR REPLACE INTO charter_acceptances (
                id, charter_id, project_id, user_id, version, engagement_model_accepted
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (acceptance_id, charter["id"], project_id, user_id, version, 1),
        )

        # Update member status if exists
        conn.execute(
            "UPDATE project_members SET status = 'accepted' WHERE project_id = ? AND user_id = ?",
            (project_id, user_id),
        )

        # Auto-log to ledger
        payload = {
            "project_id": project_id,
            "charter_version": version,
            "user_id": user_id,
            "engagement_model_accepted": True,
        }
        record_ledger_entry(
            actor=user_id,
            action="CHARTER_ACCEPTED",
            payload=payload,
            conn=conn,
        )

        return {
            "status": "success",
            "message": f"Charter v{version} and engagement model accepted successfully.",
            "version": version,
            "project_id": project_id,
        }
