"""
VOUCH Configuration
Holds all platform constants, weights, thresholds, fees, and penalties.
Single source of truth for numeric and policy parameters.
"""

from typing import Dict, List

# Security & Session
SESSION_COOKIE_NAME = "vouch_session"
SESSION_SECRET = "vouch-insecure-demo-secret-key-32bytes-min"
SESSION_MAX_AGE_SECONDS = 86400 * 7  # 7 days
PBKDF2_ITERATIONS = 100_000

# Monetary & Fee Splits (SPEC.md Section 2 & 8)
PLATFORM_FEE_PCT = 0.10        # 10% platform fee
AI_COMPUTE_RESERVE_PCT = 0.05  # 5% AI compute reserve
EXPERT_POOL_PCT = 0.30         # 30% of remaining pool to expert
STUDENT_POOL_PCT = 0.70        # 70% of remaining pool to student team

# Student Distribution Weights (SPEC.md Section 8)
STUDENT_EQUAL_SHARE_PCT = 0.40     # 40% distributed equally
STUDENT_WEIGHTED_SHARE_PCT = 0.60  # 60% distributed by contribution weights
DEFAULT_STUDENT_WEIGHTS = [0.5, 0.3, 0.2]

# Star System (SPEC.md Section 6)
RATING_MIN = 1.0
RATING_MAX = 5.0
STAR_PENALTY_QUIT = 0.5
STAR_PENALTY_WITHDRAW = 0.5
NEWBIE_EXPLORATION_BOOST = 0.05
REPEAT_HIGH_RATING_THRESHOLD = 4.0
REPEAT_PAIR_DECAY = 0.5  # downweight factor for repeated high ratings between the same pair

# Matchmaking Weights (SPEC.md Section 7)
MATCH_WEIGHT_SKILL = 0.50
MATCH_WEIGHT_SIMILAR_PROJECTS = 0.25
MATCH_WEIGHT_STARS = 0.15
MATCH_WEIGHT_AVAILABILITY = 0.10

# Pros and Cons Thresholds (SPEC.md Section 7)
PRO_THRESHOLD = 4.2
CON_THRESHOLD = 3.3
MIN_CLOSED_PROJECTS_FOR_FULL_DATA = 2

# Exit Rules (SPEC.md Section 9)
SPONSOR_WITHDRAWAL_COMPENSATION_PCT = 0.10  # 10% extra charged to sponsor wallet

# Similarity / Integrity (SPEC.md Section 12)
SIMILARITY_SHINGLE_SIZE = 3
SIMILARITY_FLAG_THRESHOLD = 0.40  # Jaccard index >= 0.40 flags for review

import os

# Database file
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vouch.db")
