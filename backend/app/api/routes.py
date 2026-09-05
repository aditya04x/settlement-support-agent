"""
API Routes - REST Endpoints

Implements all REST API endpoints for the Settlement Support Agent.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import (
    InvestigateRequest, InvestigationResponse,
    TransactionListResponse, StatsResponse,
    HealthResponse, ErrorResponse,
)
from app.services.explanation_service import ExplanationService
from app.services.data_service import DataService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

router = APIRouter()

# These will be injected by main.py on startup
_explanation_service: Optional[ExplanationService] = None
_data_service: Optional[DataService] = None
_llm_service: Optional[LLMService] = None


def init_services(
    data_service: DataService,
    llm_service: LLMService,
    explanation_service: ExplanationService,
):
    """Initialize service dependencies for routes."""
    global _explanation_service, _data_service, _llm_service
    _data_service = data_service
    _llm_service = llm_service
    _explanation_service = explanation_service


def _get_explanation_service() -> ExplanationService:
    if _explanation_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    return _explanation_service


# ─── Health Check ─────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        llm_provider=_llm_service.provider_name if _llm_service else "unknown",
        llm_available=not _llm_service.is_demo_mode if _llm_service else False,
        data_loaded=_data_service.is_loaded if _data_service else False,
    )


# ─── Investigate Transaction ─────────────────────────────────────────────────

@router.post(
    "/api/investigate",
    response_model=InvestigationResponse,
    responses={
        404: {"model": ErrorResponse},
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def investigate_transaction(request: InvestigateRequest):
    """
    Investigate a transaction by tracing it across all systems.

    The investigation follows these steps:
    1. Find the transaction in Payment Gateway data
    2. Find the corresponding Bank Settlement record
    3. Find the corresponding Internal Ledger record
    4. Correlate records using transaction identifiers
    5. Determine settlement state using deterministic rules
    6. Detect exceptions and inconsistencies
    7. Generate a plain-English explanation
    """
    service = _get_explanation_service()

    try:
        result = await service.investigate_transaction(request.transaction_id)
    except Exception as e:
        logger.error("Investigation error for %s: %s", request.transaction_id, e)
        raise HTTPException(
            status_code=500,
            detail=f"Internal error during investigation: {str(e)}"
        )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Transaction {request.transaction_id} was not found "
                "in the available records."
            ),
        )

    return result


# ─── Transaction List ─────────────────────────────────────────────────────────

@router.get("/api/transactions", response_model=TransactionListResponse)
async def list_transactions(
    status: Optional[str] = Query(None, description="Filter by gateway status (SUCCESS, FAILED, PENDING, CANCELLED)"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    merchant_id: Optional[str] = Query(None, description="Filter by merchant ID"),
    transaction_id: Optional[str] = Query(None, description="Search by transaction ID prefix"),
):
    """List transactions with optional filters."""
    service = _get_explanation_service()

    # Validate date format
    if date:
        import re
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', date):
            raise HTTPException(
                status_code=400,
                detail="Date must be in YYYY-MM-DD format"
            )

    # Validate status
    valid_statuses = {"SUCCESS", "FAILED", "PENDING", "CANCELLED"}
    if status and status.upper() not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(valid_statuses))}"
        )

    try:
        return service.get_transaction_list(
            status=status, date=date, merchant_id=merchant_id,
            transaction_id_prefix=transaction_id,
        )
    except Exception as e:
        logger.error("Transaction list error: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving transactions: {str(e)}"
        )


# ─── Single Transaction ──────────────────────────────────────────────────────

@router.get(
    "/api/transactions/{transaction_id}",
    response_model=InvestigationResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_transaction(transaction_id: str):
    """Get correlated records for a specific transaction."""
    service = _get_explanation_service()

    try:
        result = await service.investigate_transaction(transaction_id)
    except Exception as e:
        logger.error("Transaction lookup error for %s: %s", transaction_id, e)
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Transaction {transaction_id} was not found "
                "in the available records."
            ),
        )

    return result


# ─── Dashboard Statistics ─────────────────────────────────────────────────────

@router.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """Get dashboard statistics calculated from actual data."""
    service = _get_explanation_service()

    try:
        return service.get_stats()
    except Exception as e:
        logger.error("Stats error: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating statistics: {str(e)}"
        )


# ─── Demo Transactions ───────────────────────────────────────────────────────

@router.get("/api/demo-transactions")
async def get_demo_transactions():
    """
    Return a curated list of demo transactions showcasing different scenarios.
    """
    if _data_service is None or not _data_service.is_loaded:
        raise HTTPException(status_code=503, detail="Data not loaded")

    service = _get_explanation_service()
    all_ids = _data_service.get_all_transaction_ids()

    demos = []
    seen_statuses = set()

    # Find one transaction for each scenario type
    target_statuses = [
        "SETTLED", "DELAYED", "SETTLEMENT_FAILED", "PAYMENT_FAILED",
        "LEDGER_MISMATCH", "DATA_MISMATCH", "UNKNOWN", "PAYMENT_PENDING",
        "PAYMENT_CANCELLED",
    ]

    from app.services.tracing_service import TracingService
    tracer = TracingService(_data_service)

    for txn_id in all_ids:
        facts = tracer.investigate(txn_id)
        if facts and facts.final_status not in seen_statuses:
            seen_statuses.add(facts.final_status)
            label_map = {
                "SETTLED": "Successful Settlement",
                "DELAYED": "Bank Processing Delay",
                "SETTLEMENT_FAILED": "Bank Settlement Failed",
                "PAYMENT_FAILED": "Gateway Payment Failed",
                "LEDGER_MISMATCH": "Ledger Record Missing",
                "DATA_MISMATCH": "Amount Mismatch",
                "UNKNOWN": "Missing Bank Record",
                "PAYMENT_PENDING": "Payment Pending",
                "PAYMENT_CANCELLED": "Payment Cancelled",
            }
            demos.append({
                "transaction_id": txn_id,
                "label": label_map.get(facts.final_status, facts.final_status),
                "final_status": facts.final_status,
                "description": f"Demonstrates {label_map.get(facts.final_status, 'scenario').lower()} scenario",
            })

        if len(demos) >= len(target_statuses):
            break

    # Also find a multi-exception case
    for txn_id in all_ids:
        facts = tracer.investigate(txn_id)
        if facts and len(facts.exceptions) >= 2:
            if not any(d["transaction_id"] == txn_id for d in demos):
                demos.append({
                    "transaction_id": txn_id,
                    "label": "Multiple Exceptions",
                    "final_status": facts.final_status,
                    "description": f"Demonstrates multiple exception detection ({len(facts.exceptions)} exceptions)",
                })
                break

    return {"demo_transactions": demos}
