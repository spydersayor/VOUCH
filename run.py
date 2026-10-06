"""
Single-command runner for VOUCH.
Usage: python run.py
Initializes the database, runs seed data if empty, and launches Uvicorn server.
"""

import os
import uvicorn
from backend.database import init_db
from backend.seed import seed_database
from backend.config import DB_PATH

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"[*] Initializing and seeding database at {DB_PATH}...")
        seed_database()
    else:
        init_db()

    print("[*] Starting VOUCH server on http://localhost:8000...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
