"""
Payout engine implementing exact integer-rupee allocation rules.
Conforms strictly to SPEC.md Section 8:
- Platform fee: 10%
- AI compute reserve: 5%
- Expert: 30% of remaining pool
- Student pool: remainder (70% of pool)
  - 40% equal share across active students
  - 60% proportional to assigned contribution weights
- Any rounding remainder (e.g. 1 rupee) is absorbed by the last student.
- Total payouts + fee + reserve MUST equal the milestone amount.
"""

from typing import List, Dict, Any
from backend.config import (
    PLATFORM_FEE_PCT,
    AI_COMPUTE_RESERVE_PCT,
    EXPERT_POOL_PCT,
    STUDENT_EQUAL_SHARE_PCT,
    STUDENT_WEIGHTED_SHARE_PCT,
    DEFAULT_STUDENT_WEIGHTS,
)


def calculate_milestone_payout(
    amount: int,
    student_weights: List[float] = None,
    expert_present: bool = True,
    platform_fee_pct: float = PLATFORM_FEE_PCT,
    ai_reserve_pct: float = AI_COMPUTE_RESERVE_PCT,
    expert_pool_pct: float = EXPERT_POOL_PCT,
) -> Dict[str, Any]:
    """
    Computes exact integer rupee distribution for a given milestone budget.
    """
    if student_weights is None or len(student_weights) == 0:
        student_weights = list(DEFAULT_STUDENT_WEIGHTS)

    # Normalize student weights if needed
    weight_sum = sum(student_weights)
    if weight_sum > 0:
        norm_weights = [w / weight_sum for w in student_weights]
    else:
        norm_weights = [1.0 / len(student_weights)] * len(student_weights)

    # 1. Platform Fee & AI Reserve
    platform_fee = int(round(amount * platform_fee_pct))
    ai_reserve = int(round(amount * ai_reserve_pct))
    net_pool = amount - platform_fee - ai_reserve

    # 2. Expert Share
    if expert_present:
        expert_payout = int(round(net_pool * expert_pool_pct))
    else:
        expert_payout = 0

    # 3. Student Pool
    student_pool = net_pool - expert_payout
    num_students = len(norm_weights)

    equal_pool = student_pool * STUDENT_EQUAL_SHARE_PCT
    weighted_pool = student_pool * STUDENT_WEIGHTED_SHARE_PCT

    equal_per_student = equal_pool / num_students

    student_payouts: List[int] = []
    for w in norm_weights:
        raw_val = equal_per_student + (weighted_pool * w)
        student_payouts.append(int(round(raw_val)))

    # Adjust rounding remainder to the last student so the student pool is exact
    allocated_students = sum(student_payouts)
    remainder = student_pool - allocated_students
    if num_students > 0 and remainder != 0:
        student_payouts[-1] += remainder

    # Final assertion checking conservation of funds
    total_distributed = platform_fee + ai_reserve + expert_payout + sum(student_payouts)
    assert total_distributed == amount, (
        f"Payout conservation error: sum {total_distributed} != {amount}"
    )

    payout_lines = [
        {
            "role": "platform",
            "type": "fee",
            "amount": platform_fee,
            "reason": f"Platform maintenance fee ({int(platform_fee_pct * 100)}%)",
        },
        {
            "role": "platform",
            "type": "reserve",
            "amount": ai_reserve,
            "reason": f"AI compute reserve ({int(ai_reserve_pct * 100)}%)",
        },
    ]

    if expert_present:
        payout_lines.append(
            {
                "role": "expert",
                "type": "expert_share",
                "amount": expert_payout,
                "reason": f"Expert advisory compensation ({int(expert_pool_pct * 100)}% of net pool)",
            }
        )

    for idx, (p_amt, w) in enumerate(zip(student_payouts, norm_weights)):
        payout_lines.append(
            {
                "role": "student",
                "type": "student_share",
                "index": idx,
                "weight": round(w, 2),
                "amount": p_amt,
                "reason": (
                    f"Student #{idx+1} milestone payout: equal base + {round(w*100, 1)}% contribution share"
                    + (" (+1 Re rounding adj)" if idx == len(student_payouts) - 1 and remainder != 0 else "")
                ),
            }
        )

    return {
        "milestone_amount": amount,
        "platform_fee": platform_fee,
        "ai_reserve": ai_reserve,
        "expert_payout": expert_payout,
        "student_payouts": student_payouts,
        "payout_lines": payout_lines,
        "total_distributed": total_distributed,
    }
