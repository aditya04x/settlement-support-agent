"""
Tracing Service - Transaction Correlation

Correlates transaction records across gateway, bank, and ledger systems.
Produces SystemFinding objects and a unified VerifiedFacts result.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.models.schemas import (
    GatewayRecord, BankRecord, LedgerRecord,
    SystemFinding, VerifiedFacts, TimelineEvent,
)
from app.services.data_service import DataService
from app.services.rules_engine import RulesEngine
from app.services.exception_detector import ExceptionDetector

logger = logging.getLogger(__name__)


class TracingService:
    """
    Traces a transaction across all three systems and produces
    a unified, verified investigation result.
    """

    def __init__(self, data_service: DataService):
        self.data_service = data_service
        self.rules_engine = RulesEngine()
        self.exception_detector = ExceptionDetector()

    def investigate(self, transaction_id: str) -> Optional[VerifiedFacts]:
        """
        Investigate a transaction by tracing it across all systems.

        Returns VerifiedFacts with deterministic status, root cause,
        confidence, and exceptions. Returns None only if the transaction
        is not found in ANY system.
        """
        # Step 1: Retrieve records from each system
        gateway_record = self.data_service.get_gateway_record(transaction_id)
        bank_record = self.data_service.get_bank_record(transaction_id)
        ledger_record = self.data_service.get_ledger_record(transaction_id)

        # If not found in any system, return a NOT_FOUND result
        if gateway_record is None and bank_record is None and ledger_record is None:
            return None

        # Step 2: Build system findings
        gateway_finding = self._build_gateway_finding(gateway_record)
        bank_finding = self._build_bank_finding(bank_record)
        ledger_finding = self._build_ledger_finding(ledger_record)

        # Step 3: Determine primary amount/currency/merchant from gateway
        amount = gateway_record.amount if gateway_record else None
        currency = gateway_record.currency if gateway_record else None
        merchant_id = gateway_record.merchant_id if gateway_record else None

        # Step 4: Detect exceptions
        exceptions = self.exception_detector.detect(
            gateway_record, bank_record, ledger_record
        )

        # Step 5: Apply deterministic rules
        final_status, root_cause, confidence = self.rules_engine.evaluate(
            gateway_finding, bank_finding, ledger_finding,
            gateway_record, bank_record, ledger_record,
            exceptions
        )

        # Step 6: Build verified facts
        verified_facts = VerifiedFacts(
            transaction_id=transaction_id,
            amount=amount,
            currency=currency,
            merchant_id=merchant_id,
            gateway=gateway_finding,
            bank=bank_finding,
            ledger=ledger_finding,
            final_status=final_status,
            root_cause=root_cause,
            confidence=confidence,
            exceptions=exceptions,
        )

        logger.info(
            "Investigation complete: %s -> %s (confidence: %s)",
            transaction_id, final_status, confidence
        )

        return verified_facts

    def build_timeline(self, verified_facts: VerifiedFacts) -> list[TimelineEvent]:
        """
        Build a chronological timeline from verified facts.
        Only includes events that actually exist in the records.
        """
        events: list[TimelineEvent] = []

        # Gateway events
        if verified_facts.gateway.found:
            events.append(TimelineEvent(
                timestamp=verified_facts.gateway.timestamp,
                event="Payment initiated at gateway",
                system="gateway",
                status=verified_facts.gateway.status,
            ))

            if verified_facts.gateway.status == "SUCCESS":
                events.append(TimelineEvent(
                    timestamp=verified_facts.gateway.timestamp,
                    event="Gateway payment successful",
                    system="gateway",
                    status="SUCCESS",
                ))
            elif verified_facts.gateway.status == "FAILED":
                reason = verified_facts.gateway.reason or "Unknown reason"
                events.append(TimelineEvent(
                    timestamp=verified_facts.gateway.timestamp,
                    event=f"Gateway payment failed: {reason}",
                    system="gateway",
                    status="FAILED",
                ))
            elif verified_facts.gateway.status == "PENDING":
                events.append(TimelineEvent(
                    timestamp=verified_facts.gateway.timestamp,
                    event="Gateway payment pending",
                    system="gateway",
                    status="PENDING",
                ))
            elif verified_facts.gateway.status == "CANCELLED":
                events.append(TimelineEvent(
                    timestamp=verified_facts.gateway.timestamp,
                    event="Gateway payment cancelled",
                    system="gateway",
                    status="CANCELLED",
                ))

        # Ledger events
        if verified_facts.ledger.found:
            events.append(TimelineEvent(
                timestamp=verified_facts.ledger.timestamp,
                event=f"Ledger entry {verified_facts.ledger.status.lower()}",
                system="ledger",
                status=verified_facts.ledger.status,
            ))

        # Bank events
        if verified_facts.bank.found:
            if verified_facts.bank.status == "SETTLED":
                events.append(TimelineEvent(
                    timestamp=verified_facts.bank.timestamp,
                    event="Bank settlement completed",
                    system="bank",
                    status="SETTLED",
                ))
            elif verified_facts.bank.status == "PENDING":
                reason = verified_facts.bank.reason or ""
                desc = "Bank settlement pending"
                if reason:
                    desc += f": {reason}"
                events.append(TimelineEvent(
                    timestamp=verified_facts.bank.timestamp,
                    event=desc,
                    system="bank",
                    status="PENDING",
                ))
            elif verified_facts.bank.status in ("FAILED", "REJECTED"):
                reason = verified_facts.bank.reason or "Unknown reason"
                events.append(TimelineEvent(
                    timestamp=verified_facts.bank.timestamp,
                    event=f"Bank settlement {verified_facts.bank.status.lower()}: {reason}",
                    system="bank",
                    status=verified_facts.bank.status,
                ))
            elif verified_facts.bank.status == "NOT_INITIATED":
                events.append(TimelineEvent(
                    timestamp=verified_facts.bank.timestamp,
                    event="Bank settlement not initiated",
                    system="bank",
                    status="NOT_INITIATED",
                ))

        # Sort by timestamp (None timestamps go to end)
        events.sort(key=lambda e: e.timestamp or "9999")

        return events

    # ─── Private helpers ──────────────────────────────────────────────────

    def _build_gateway_finding(self, record: Optional[GatewayRecord]) -> SystemFinding:
        """Convert a gateway record to a SystemFinding."""
        if record is None:
            return SystemFinding(found=False)
        return SystemFinding(
            found=True,
            status=record.gateway_status,
            amount=record.amount,
            currency=record.currency,
            timestamp=record.gateway_timestamp,
            reference=record.gateway_reference,
            reason=record.failure_reason,
            failure_code=record.failure_code,
            raw_record=record.model_dump(),
        )

    def _build_bank_finding(self, record: Optional[BankRecord]) -> SystemFinding:
        """Convert a bank record to a SystemFinding."""
        if record is None:
            return SystemFinding(found=False)
        return SystemFinding(
            found=True,
            status=record.settlement_status,
            amount=record.amount,
            currency=record.currency,
            timestamp=record.settlement_timestamp,
            reference=record.bank_reference,
            reason=record.failure_reason,
            failure_code=record.failure_code,
            raw_record=record.model_dump(),
        )

    def _build_ledger_finding(self, record: Optional[LedgerRecord]) -> SystemFinding:
        """Convert a ledger record to a SystemFinding."""
        if record is None:
            return SystemFinding(found=False)
        return SystemFinding(
            found=True,
            status=record.ledger_status,
            amount=record.amount,
            currency=record.currency,
            timestamp=record.ledger_timestamp,
            reference=record.posting_reference,
            raw_record=record.model_dump(),
        )
