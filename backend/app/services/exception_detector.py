"""
Exception Detector - Anomaly and Inconsistency Detection

Scans transaction records across all three systems to detect
missing records, amount mismatches, currency mismatches, and
other data inconsistencies.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.models.schemas import (
    GatewayRecord, BankRecord, LedgerRecord, ExceptionItem,
)

logger = logging.getLogger(__name__)


class ExceptionDetector:
    """
    Detects exceptions and anomalies in cross-system transaction records.

    Each detection method returns a list of ExceptionItem objects.
    The main detect() method aggregates all findings.
    """

    def detect(
        self,
        gateway: Optional[GatewayRecord],
        bank: Optional[BankRecord],
        ledger: Optional[LedgerRecord],
    ) -> list[ExceptionItem]:
        """
        Run all exception checks and return aggregated results.
        """
        exceptions: list[ExceptionItem] = []

        exceptions.extend(self._check_missing_records(gateway, bank, ledger))
        exceptions.extend(self._check_amount_mismatches(gateway, bank, ledger))
        exceptions.extend(self._check_currency_mismatches(gateway, bank, ledger))
        exceptions.extend(self._check_merchant_mismatches(gateway, bank, ledger))
        exceptions.extend(self._check_status_inconsistencies(gateway, bank, ledger))
        exceptions.extend(self._check_missing_fields(gateway, bank, ledger))

        return exceptions

    # ─── Missing Records ──────────────────────────────────────────────────

    def _check_missing_records(
        self,
        gateway: Optional[GatewayRecord],
        bank: Optional[BankRecord],
        ledger: Optional[LedgerRecord],
    ) -> list[ExceptionItem]:
        exceptions = []

        if gateway is None:
            exceptions.append(ExceptionItem(
                code="GATEWAY_RECORD_MISSING",
                severity="HIGH",
                message="No payment gateway record was found for this transaction.",
                impact="Cannot confirm whether the payment was initiated or processed."
            ))

        # Only flag bank/ledger missing if gateway succeeded
        gw_success = gateway and gateway.gateway_status == "SUCCESS"

        if bank is None and gw_success:
            exceptions.append(ExceptionItem(
                code="BANK_RECORD_MISSING",
                severity="HIGH",
                message="No bank settlement record was found for this transaction.",
                impact="Bank settlement status cannot be confirmed from available records."
            ))

        if ledger is None and gw_success:
            exceptions.append(ExceptionItem(
                code="LEDGER_RECORD_MISSING",
                severity="HIGH",
                message="No internal ledger record was found for this transaction.",
                impact="Internal accounting status cannot be confirmed."
            ))

        return exceptions

    # ─── Amount Mismatches ────────────────────────────────────────────────

    def _check_amount_mismatches(
        self,
        gateway: Optional[GatewayRecord],
        bank: Optional[BankRecord],
        ledger: Optional[LedgerRecord],
    ) -> list[ExceptionItem]:
        exceptions = []

        gw_amount = gateway.amount if gateway else None
        bank_amount = bank.amount if bank else None
        ledger_amount = ledger.amount if ledger else None

        if gw_amount is not None and bank_amount is not None:
            if abs(gw_amount - bank_amount) > 0.01:
                exceptions.append(ExceptionItem(
                    code="GATEWAY_BANK_AMOUNT_MISMATCH",
                    severity="HIGH",
                    message=(
                        f"Gateway amount ({gw_amount}) does not match "
                        f"bank settlement amount ({bank_amount})."
                    ),
                    impact="Settlement amount discrepancy requires investigation."
                ))

        if gw_amount is not None and ledger_amount is not None:
            if abs(gw_amount - ledger_amount) > 0.01:
                exceptions.append(ExceptionItem(
                    code="GATEWAY_LEDGER_AMOUNT_MISMATCH",
                    severity="HIGH",
                    message=(
                        f"Gateway amount ({gw_amount}) does not match "
                        f"ledger amount ({ledger_amount})."
                    ),
                    impact="Internal accounting discrepancy requires investigation."
                ))

        if bank_amount is not None and ledger_amount is not None:
            if abs(bank_amount - ledger_amount) > 0.01:
                exceptions.append(ExceptionItem(
                    code="BANK_LEDGER_AMOUNT_MISMATCH",
                    severity="HIGH",
                    message=(
                        f"Bank settlement amount ({bank_amount}) does not match "
                        f"ledger amount ({ledger_amount})."
                    ),
                    impact="Cross-system amount discrepancy requires reconciliation."
                ))

        return exceptions

    # ─── Currency Mismatches ──────────────────────────────────────────────

    def _check_currency_mismatches(
        self,
        gateway: Optional[GatewayRecord],
        bank: Optional[BankRecord],
        ledger: Optional[LedgerRecord],
    ) -> list[ExceptionItem]:
        exceptions = []
        currencies = set()

        if gateway and gateway.currency:
            currencies.add(gateway.currency)
        if bank and bank.currency:
            currencies.add(bank.currency)
        if ledger and ledger.currency:
            currencies.add(ledger.currency)

        if len(currencies) > 1:
            exceptions.append(ExceptionItem(
                code="CURRENCY_MISMATCH",
                severity="HIGH",
                message=f"Currency mismatch detected across systems: {', '.join(sorted(currencies))}.",
                impact="Currency discrepancy may indicate a data integrity issue."
            ))

        return exceptions

    # ─── Merchant Mismatches ──────────────────────────────────────────────

    def _check_merchant_mismatches(
        self,
        gateway: Optional[GatewayRecord],
        bank: Optional[BankRecord],
        ledger: Optional[LedgerRecord],
    ) -> list[ExceptionItem]:
        exceptions = []
        merchants = set()

        if gateway and gateway.merchant_id:
            merchants.add(gateway.merchant_id)
        if bank and bank.merchant_id:
            merchants.add(bank.merchant_id)
        if ledger and ledger.merchant_id:
            merchants.add(ledger.merchant_id)

        if len(merchants) > 1:
            exceptions.append(ExceptionItem(
                code="MERCHANT_MISMATCH",
                severity="HIGH",
                message=f"Merchant ID mismatch across systems: {', '.join(sorted(merchants))}.",
                impact="Records may belong to different merchants."
            ))

        return exceptions

    # ─── Status Inconsistencies ───────────────────────────────────────────

    def _check_status_inconsistencies(
        self,
        gateway: Optional[GatewayRecord],
        bank: Optional[BankRecord],
        ledger: Optional[LedgerRecord],
    ) -> list[ExceptionItem]:
        exceptions = []

        # Gateway failed but bank shows settled
        if (
            gateway and gateway.gateway_status == "FAILED"
            and bank and bank.settlement_status == "SETTLED"
        ):
            exceptions.append(ExceptionItem(
                code="UNEXPECTED_STATUS_COMBINATION",
                severity="HIGH",
                message="Gateway shows FAILED but bank shows SETTLED.",
                impact="Contradictory statuses require urgent investigation."
            ))

        # Gateway failed but ledger posted
        if (
            gateway and gateway.gateway_status == "FAILED"
            and ledger and ledger.ledger_status == "POSTED"
        ):
            exceptions.append(ExceptionItem(
                code="UNEXPECTED_STATUS_COMBINATION",
                severity="HIGH",
                message="Gateway shows FAILED but ledger shows POSTED.",
                impact="Contradictory statuses require urgent investigation."
            ))

        # Bank settled but ledger reversed
        if (
            bank and bank.settlement_status == "SETTLED"
            and ledger and ledger.ledger_status == "REVERSED"
        ):
            exceptions.append(ExceptionItem(
                code="UNEXPECTED_STATUS_COMBINATION",
                severity="MEDIUM",
                message="Bank shows SETTLED but ledger shows REVERSED.",
                impact="Settlement may have been reversed after bank confirmation."
            ))

        return exceptions

    # ─── Missing Fields ───────────────────────────────────────────────────

    def _check_missing_fields(
        self,
        gateway: Optional[GatewayRecord],
        bank: Optional[BankRecord],
        ledger: Optional[LedgerRecord],
    ) -> list[ExceptionItem]:
        exceptions = []

        if gateway and not gateway.gateway_timestamp:
            exceptions.append(ExceptionItem(
                code="MISSING_TIMESTAMP",
                severity="LOW",
                message="Gateway record is missing a timestamp.",
                impact="Timeline reconstruction may be incomplete."
            ))

        if bank and not bank.settlement_timestamp:
            exceptions.append(ExceptionItem(
                code="MISSING_TIMESTAMP",
                severity="LOW",
                message="Bank settlement record is missing a timestamp.",
                impact="Timeline reconstruction may be incomplete."
            ))

        if ledger and not ledger.ledger_timestamp:
            exceptions.append(ExceptionItem(
                code="MISSING_TIMESTAMP",
                severity="LOW",
                message="Ledger record is missing a timestamp.",
                impact="Timeline reconstruction may be incomplete."
            ))

        # Missing settlement reason when bank failed
        if (
            bank
            and bank.settlement_status in ("FAILED", "REJECTED")
            and not bank.failure_reason
        ):
            exceptions.append(ExceptionItem(
                code="MISSING_SETTLEMENT_REASON",
                severity="MEDIUM",
                message="Bank settlement failed/rejected but no failure reason was provided.",
                impact="Root cause of settlement failure cannot be determined."
            ))

        return exceptions
