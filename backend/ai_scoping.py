"""
AI Scoping module for VOUCH.
Decomposes a sponsor's problem description into editable, sequential milestones
with required technical skills, budget allocations, and suggested charter clauses.
Includes a fully deterministic offline fallback that requires zero LLM keys or internet.
"""

import os
from typing import Dict, Any, List


def scope_problem(
    title: str,
    public_summary: str,
    confidential_brief: str,
    budget: int,
    engagement_model: str,
) -> Dict[str, Any]:
    """
    Produces milestones, required skills, and charter clauses.
    Ensures total milestone budget equals project budget exactly.
    """
    text = f"{title} {public_summary} {confidential_brief}".lower()

    # Determine domain context
    if any(k in text for k in ["retina", "fundus", "medical", "clinic", "health", "x-ray", "pathology", "diagnosis"]):
        domain = "healthcare_cv"
    elif any(k in text for k in ["indic", "nlp", "llm", "language", "translation", "ner", "text"]):
        domain = "nlp_indic"
    elif any(k in text for k in ["sensor", "iot", "robotics", "embedded", "raspberry", "edge", "hardware"]):
        domain = "edge_embedded"
    else:
        domain = "general_ai"

    # Budget splitting (30%, 40%, 30% exact integer sum)
    if budget > 0:
        b1 = int(budget * 0.30)
        b2 = int(budget * 0.40)
        b3 = budget - b1 - b2
    else:
        b1, b2, b3 = 0, 0, 0

    if domain == "healthcare_cv":
        milestones = [
            {
                "sequence": 1,
                "title": "Clinical Data Ingestion & Image Preprocessing Pipeline",
                "description": "Clean, normalize, and augment high-resolution scans; construct reproducible validation folds and benchmark baseline inference.",
                "skills": ["Python", "Computer Vision", "PyTorch", "Medical Imaging"],
                "budget": b1,
            },
            {
                "sequence": 2,
                "title": "Quantized Edge Model Architecture & Optimization",
                "description": "Train compact neural network; apply INT8 post-training quantization and verify latency on target edge hardware.",
                "skills": ["TensorFlow Lite", "PyTorch", "Model Quantization", "Edge AI"],
                "budget": b2,
            },
            {
                "sequence": 3,
                "title": "Clinical Evaluation, Sensitivity Auditing & Final Artifacts",
                "description": "Validate target clinical sensitivity (>90%), document failure modes, and submit verified deployment package.",
                "skills": ["Clinical Validation", "Embedded Systems", "Edge AI"],
                "budget": b3,
            },
        ]
        scope_summary = "Design, optimize, and clinically validate an edge-deployable diagnostic neural network pipeline."
        ip_clause = "Sponsor retains commercial licensing rights to production weights; contributors retain co-authorship and portfolio attribution."
        confidentiality = "All patient image scans and diagnostic metadata remain strictly confidential within the sandbox environment."
    elif domain == "nlp_indic":
        milestones = [
            {
                "sequence": 1,
                "title": "Multilingual Clinical Corpus Normalization & Lexicon Assembly",
                "description": "Aggregate, deduplicate, and standardize clinical discharge terms across target Indic languages.",
                "skills": ["Python", "NLP", "Data Preprocessing"],
                "budget": b1,
            },
            {
                "sequence": 2,
                "title": "Zero-Shot Clinical NER Model Fine-Tuning & Evaluation",
                "description": "Fine-tune token classification representations for anatomical and pharmaceutical entities.",
                "skills": ["PyTorch", "NLP", "Deep Learning"],
                "budget": b2,
            },
            {
                "sequence": 3,
                "title": "Benchmarking Suite & Open Evaluation Report",
                "description": "Produce reproducible cross-lingual evaluation benchmarks and complete peer-reviewed documentation.",
                "skills": ["FastAPI", "NLP", "Open Source"],
                "budget": b3,
            },
        ]
        scope_summary = "Curate multilingual clinical NLP benchmark suite and train domain-adapted token classifiers."
        ip_clause = "Code distributed under Apache 2.0; lexicons and datasets published under Creative Commons CC-BY."
        confidentiality = "Strict anonymization applied to all source records in compliance with HIPAA Safe Harbor."
    else:
        milestones = [
            {
                "sequence": 1,
                "title": "Architectural Design, Data Pipeline & Baseline Feasibility",
                "description": "Establish foundational technical architecture, data ingestion harness, and initial proof-of-concept pipeline.",
                "skills": ["Python", "PyTorch", "FastAPI"],
                "budget": b1,
            },
            {
                "sequence": 2,
                "title": "Core Algorithm Implementation, Training & Integration",
                "description": "Implement core algorithmic modules, optimize training loop, and achieve specified convergence thresholds.",
                "skills": ["Python", "Machine Learning", "System Design"],
                "budget": b2,
            },
            {
                "sequence": 3,
                "title": "Performance Benchmarking, Code Quality Review & Deployment",
                "description": "Comprehensive test coverage, performance profiling, final documentation, and verified sandbox artifacts.",
                "skills": ["Testing", "Documentation", "Model Optimization"],
                "budget": b3,
            },
        ]
        scope_summary = f"Implement, optimize, and deploy technical deliverables for {title}."
        ip_clause = "Sponsor receives perpetual commercial use; contributors receive verified ledger credentials and attribution."
        confidentiality = "Technical deliverables and proprietary data are protected under platform charter confidentiality terms."

    exit_terms = "Mutual termination permitted at milestone boundaries. Completed and accepted milestones receive guaranteed pro-rata compensation."
    commercialisation = "Commercialization rights adhere to the chosen engagement model. Verified ledger receipts remain immutable."

    return {
        "title": title,
        "engagement_model": engagement_model,
        "total_budget": budget,
        "milestones": milestones,
        "suggested_charter": {
            "scope": scope_summary,
            "ip_clause": ip_clause,
            "confidentiality_clause": confidentiality,
            "exit_terms": exit_terms,
            "commercialisation_clause": commercialisation,
        },
    }
