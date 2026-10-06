"""
Server-Side Role-Based Access Control (RBAC) and Brief Gating.
Enforces role boundaries and project membership strictly on the backend.
"""

from typing import List, Dict, Any, Callable
from fastapi import HTTPException, status, Depends
from backend.auth import get_current_user
from backend.database import get_db


def require_role(*allowed_roles: str) -> Callable:
    """
    FastAPI dependency that restricts endpoint access to specified roles.
    Raises 403 Forbidden if user's role is not authorized.
    """
    async def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User role '{user_role}' cannot access this resource. Required: {', '.join(allowed_roles)}",
            )
        return user

    return role_checker


def check_confidential_brief_access(project_id: str, user: Dict[str, Any]) -> bool:
    """
    Server-side gate for confidential briefs and datasets (SPEC.md Section 8).
    Rule: Never returned to anyone who has not accepted the current charter version.
    Sponsor who created the project can view.
    Members (students/experts) MUST have accepted the current published charter version.
    """
    user_id = user["id"]
    user_role = user.get("role")

    with get_db() as conn:
        project = conn.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_id}' not found.",
            )

        if project["status"] == "closed":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Confidential brief locked: This project has concluded and confidential data is archived.",
            )

        # Sponsor owner can view their own project brief
        if project["sponsor_id"] == user_id:
            return True

        # Admins can audit if explicitly needed, but candidates/students/experts MUST accept charter
        # Fetch current charter
        charter = conn.execute(
            "SELECT * FROM charters WHERE project_id = ? AND is_current = 1",
            (project_id,),
        ).fetchone()

        if not charter:
            # No published charter yet
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Confidential brief locked: No published charter agreement exists yet.",
            )

        current_version = charter["version"]

        # Check acceptance for this user on current version
        acceptance = conn.execute(
            """
            SELECT * FROM charter_acceptances
            WHERE project_id = ? AND user_id = ? AND version = ? AND engagement_model_accepted = 1
            """,
            (project_id, user_id, current_version),
        ).fetchone()

        if not acceptance:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Confidential brief locked: You have not accepted the current charter version (v{current_version}) and engagement model.",
            )

        return True
