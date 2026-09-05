"""
Explanation Service - Orchestrator

Orchestrates the full investigation flow:
1. Trace transaction across systems
2. Determine settlement status via rules engine
3. Detect exceptions
4. Generate explanation via LLM
5. Build timeline
6. Return complete investigation response
"""

from __future__ import annotations

import logging

from app.models.schemas import (
    VerifiedFacts, InvestigationResponse,
    TransactionListItem, TransactionListResponse,
    StatsResponse,
)
from app.services.data_service import DataService
from app.services.tracing_service import TracingService
from app.services.llm_service import LLMService
from app.services.rules_engine import RulesEngine

logger = logging.getLogger(__name__)


class ExplanationService:
    """
    Main orchestration service that coordinates the investigation pipeline.
    """

    def __init__(self, data_service: DataService, llm_service: LLMService):
        self.data_service = data_service
        self.tracing_service = TracingService(data_service)
        self.llm_service = llm_service
        self.rules_engine = RulesEngine()

    async def investigate_transaction(
        self, transaction_id: str
    ) -> InvestigationResponse | None:
        """
        Run a complete investigation for a transaction ID.

        Returns None if the transaction is not found in any system.
        """
        # Step 1: Trace and investigate
        verified_facts = self.tracing_service.investigate(transaction_id)

        if verified_facts is None:
            return None

        # Step 2: Generate LLM explanation
        explanation = await self.llm_service.explain(verified_facts)

        # Step 3: Build timeline
        timeline = self.tracing_service.build_timeline(verified_facts)

        return InvestigationResponse(
            transaction_id=transaction_id,
            investigation=verified_facts,
            explanation=explanation,
            timeline=timeline,
        )

    def get_transaction_list(
        self,
        status: str | None = None,
        date: str | None = None,
        merchant_id: str | None = None,
        transaction_id_prefix: str | None = None,
    ) -> TransactionListResponse:
        """
        Get a filtered list of transactions with their deterministic statuses.
        """
        records = self.data_service.search_transactions(
            status=status, date=date, merchant_id=merchant_id,
            transaction_id_prefix=transaction_id_prefix,
        )

        items: list[TransactionListItem] = []
        for record in records:
            txn_id = record["transaction_id"]

            # Quick status lookup
            bank_rec = self.data_service.get_bank_record(txn_id)
            ledger_rec = self.data_service.get_ledger_record(txn_id)

            # Quick trace for final status
            facts = self.tracing_service.investigate(txn_id)
            final_status = facts.final_status if facts else "NOT_FOUND"

            items.append(TransactionListItem(
                transaction_id=txn_id,
                merchant_id=record.get("merchant_id", ""),
                amount=float(record.get("amount", 0)),
                currency=record.get("currency", "INR"),
                gateway_status=record.get("gateway_status", ""),
                settlement_status=bank_rec.settlement_status if bank_rec else None,
                ledger_status=ledger_rec.ledger_status if ledger_rec else None,
                final_status=final_status,
                gateway_timestamp=record.get("gateway_timestamp", ""),
            ))

        filters = {}
        if status:
            filters["status"] = status
        if date:
            filters["date"] = date
        if merchant_id:
            filters["merchant_id"] = merchant_id

        return TransactionListResponse(
            transactions=items,
            total=len(items),
            filters_applied=filters,
        )

    def get_stats(self) -> StatsResponse:
        """Calculate dashboard statistics from actual data."""
        all_txn_ids = self.data_service.get_all_transaction_ids()

        counts = {
            "settled": 0,
            "delayed": 0,
            "failed": 0,
            "mismatched": 0,
            "unknown": 0,
            "payment_failed": 0,
            "payment_pending": 0,
            "payment_cancelled": 0,
        }
        transactions_with_exceptions = 0

        for txn_id in all_txn_ids:
            facts = self.tracing_service.investigate(txn_id)
            if facts is None:
                counts["unknown"] += 1
                continue

            status = facts.final_status
            if status == "SETTLED":
                counts["settled"] += 1
            elif status == "DELAYED":
                counts["delayed"] += 1
            elif status in ("SETTLEMENT_FAILED",):
                counts["failed"] += 1
            elif status in ("DATA_MISMATCH", "LEDGER_MISMATCH"):
                counts["mismatched"] += 1
            elif status == "PAYMENT_FAILED":
                counts["payment_failed"] += 1
            elif status == "PAYMENT_PENDING":
                counts["payment_pending"] += 1
            elif status == "PAYMENT_CANCELLED":
                counts["payment_cancelled"] += 1
            else:
                counts["unknown"] += 1

            if facts.exceptions:
                transactions_with_exceptions += 1

        total = len(all_txn_ids)
        settlement_rate = round((counts["settled"] / total * 100), 1) if total > 0 else 0.0
        exception_rate = round((transactions_with_exceptions / total * 100), 1) if total > 0 else 0.0

        return StatsResponse(
            total_transactions=total,
            settlement_rate=settlement_rate,
            exception_rate=exception_rate,
            **counts,
        )
