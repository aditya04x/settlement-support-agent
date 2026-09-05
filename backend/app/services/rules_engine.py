"""
Rules Engine - Deterministic Settlement Decision Logic

Applies a prioritized set of rules to determine the final settlement
status, root cause, and confidence level. This is the core business
logic — the LLM never determines these values.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.models.schemas import (
    SystemFinding, ExceptionItem,
    GatewayRecord, BankRecord, LedgerRecord,
)

logger = logging.getLogger(__name__)


class RulesEngine:
    """
    Deterministic rule engine for settlement status resolution.

    Rules are evaluated in priority order. The first matching rule
    determines the final status. Amount/currency mismatches are
    checked separately and can override other statuses.
    """

    def evaluate(
        self,
        gateway: SystemFinding,
        bank: SystemFinding,
        ledger: SystemFinding,
        gateway_record: Optional[GatewayRecord],
        bank_record: Optional[BankRecord],
        ledger_record: Optional[LedgerRecord],
        exceptions: list[ExceptionItem],
    ) -> tuple[str, str, str]:
        """
        Evaluate all rules and return (final_status, root_cause, confidence).

        Rules are applied in strict priority order:
        1. Gateway not found -> NOT_FOUND
        2. Data mismatches -> DATA_MISMATCH
        3. Gateway failed -> PAYMENT_FAILED
        4. Gateway pending -> PAYMENT_PENDING
        5. Gateway cancelled -> PAYMENT_CANCELLED
        6. Full success -> SETTLED
        7. Bank pending -> DELAYED
        8. Bank failed/rejected -> SETTLEMENT_FAILED
        9. Ledger missing with bank settled -> LEDGER_MISMATCH
        10. Bank missing -> UNKNOWN
        11. Default -> UNKNOWN
        """

        # RULE 1: Gateway record missing
        if not gateway.found:
            return ("NOT_FOUND", "No gateway record found", "LOW")

        # RULE 2: Check for amount/currency mismatches first
        has_amount_mismatch = any(
            e.code in (
                "GATEWAY_BANK_AMOUNT_MISMATCH",
                "GATEWAY_LEDGER_AMOUNT_MISMATCH",
                "BANK_LEDGER_AMOUNT_MISMATCH",
            )
            for e in exceptions
        )
        has_currency_mismatch = any(
            e.code == "CURRENCY_MISMATCH" for e in exceptions
        )

        if has_amount_mismatch or has_currency_mismatch:
            reasons = []
            if has_amount_mismatch:
                reasons.append("Amount mismatch detected between systems")
            if has_currency_mismatch:
                reasons.append("Currency mismatch detected between systems")
            return ("DATA_MISMATCH", "; ".join(reasons), "LOW")

        # RULE 3: Gateway failed
        if gateway.status == "FAILED":
            reason = gateway.reason or gateway.failure_code or "Payment failed at gateway"
            return ("PAYMENT_FAILED", reason, "HIGH")

        # RULE 4: Gateway pending
        if gateway.status == "PENDING":
            return ("PAYMENT_PENDING", "Payment is still being processed at the gateway", "MEDIUM")

        # RULE 5: Gateway cancelled
        if gateway.status == "CANCELLED":
            return ("PAYMENT_CANCELLED", "Payment was cancelled", "HIGH")

        # From here, gateway.status == SUCCESS

        # RULE 6: Full success path
        if (
            gateway.status == "SUCCESS"
            and bank.found and bank.status == "SETTLED"
            and ledger.found and ledger.status == "POSTED"
        ):
            return ("SETTLED", "Transaction fully settled", "HIGH")

        # RULE 7: Bank pending
        if bank.found and bank.status == "PENDING":
            reason = bank.reason or "Bank settlement pending"
            # Check if ledger is also missing
            if not ledger.found:
                return ("DELAYED", reason, "LOW")
            return ("DELAYED", reason, "HIGH")

        # RULE 8: Bank failed or rejected
        if bank.found and bank.status in ("FAILED", "REJECTED"):
            reason = bank.reason or bank.failure_code or "Bank settlement failed"
            return ("SETTLEMENT_FAILED", reason, "HIGH")

        # RULE 9: Bank settled but ledger missing
        if bank.found and bank.status == "SETTLED" and not ledger.found:
            return ("LEDGER_MISMATCH", "Ledger record missing despite successful settlement", "MEDIUM")

        # RULE 10: Bank not initiated (gateway success but no bank action)
        if bank.found and bank.status == "NOT_INITIATED":
            return ("DELAYED", "Bank settlement not yet initiated", "MEDIUM")

        # RULE 11: Bank record missing entirely
        if not bank.found:
            if ledger.found:
                return (
                    "UNKNOWN",
                    "Bank settlement record not found; cannot confirm settlement status",
                    "LOW"
                )
            return (
                "UNKNOWN",
                "Both bank settlement and ledger records are missing",
                "LOW"
            )

        # RULE 12: Default fallback
        return ("UNKNOWN", "Unable to determine settlement status from available records", "LOW")
