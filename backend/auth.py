"""
Authentication module: PBKDF2 password hashing, HMAC-signed session cookies,
and FastAPI auth dependencies.
"""

import hashlib
import hmac
import os
import time
from typing import Optional, Dict, Any
from fastapi import Request, Response, HTTPException, status, Depends
from backend.config import (
    SESSION_COOKIE_NAME,
    SESSION_SECRET,
    SESSION_MAX_AGE_SECONDS,
    PBKDF2_ITERATIONS,
)
from backend.database import get_db


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = os.urandom(16).hex()
    pwd_bytes = password.encode("utf-8")
    salt_bytes = salt.encode("utf-8")
    key = hashlib.pbkdf2_hmac("sha256", pwd_bytes, salt_bytes, PBKDF2_ITERATIONS)
    return key.hex(), salt


def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    calc_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(calc_hash, stored_hash)


def create_session_token(user_id: str) -> str:
    timestamp = str(int(time.time()))
    payload = f"{user_id}:{timestamp}"
    sig = hmac.new(
        SESSION_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return f"{payload}:{sig}"


def parse_and_verify_session_token(token: str) -> Optional[str]:
    """
    Parses token format 'user_id:timestamp:sig'. Returns user_id if valid and not expired.
    """
    parts = token.split(":")
    if len(parts) != 3:
        return None
    user_id, timestamp_str, sig = parts
    try:
        ts = int(timestamp_str)
    except ValueError:
        return None

    # Check expiration
    if time.time() - ts > SESSION_MAX_AGE_SECONDS:
        return None

    expected_payload = f"{user_id}:{timestamp_str}"
    expected_sig = hmac.new(
        SESSION_SECRET.encode("utf-8"), expected_payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(sig, expected_sig):
        return None

    return user_id


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production HTTPS
        path="/",
    )


def clear_auth_cookie(response: Response):
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")


async def get_optional_user(request: Request) -> Optional[Dict[str, Any]]:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        # Also check Authorization header for flexibility in programmatic tests
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        return None

    user_id = parse_and_verify_session_token(token)
    if not user_id:
        return None

    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return None
        return dict(user)


async def get_current_user(user: Optional[Dict[str, Any]] = Depends(get_optional_user)) -> Dict[str, Any]:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return user
