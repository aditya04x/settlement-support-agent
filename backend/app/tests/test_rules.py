"""
Tests for the Rules Engine

Verifies that the deterministic rules engine correctly determines
settlement status, root cause, and confidence for all scenarios.
"""

import pytest
from app.models.schemas import SystemFinding, ExceptionItem
from app.services.rules_engine import RulesEngine


@pytest.fixture
def engine():
    return RulesEngine()


class TestRulesEngine:
    """Test deterministic settlement rules."""

    def test_rule_gateway_missing(self, engine):
        """Rule 1: Gateway missing -> NOT_FOUND."""
        gw = SystemFinding(found=False)
        bank = SystemFinding(found=False)
        ledger = SystemFinding(found=False)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "NOT_FOUND"
        assert conf == "LOW"

    def test_rule_full_success(self, engine):
        """Rule 6: All systems agree -> SETTLED."""
        gw = SystemFinding(found=True, status="SUCCESS", amount=2500, currency="INR")
        bank = SystemFinding(found=True, status="SETTLED", amount=2500, currency="INR")
        ledger = SystemFinding(found=True, status="POSTED", amount=2500, currency="INR")
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "SETTLED"
        assert conf == "HIGH"

    def test_rule_gateway_failed(self, engine):
        """Rule 3: Gateway failed -> PAYMENT_FAILED."""
        gw = SystemFinding(found=True, status="FAILED", reason="Card declined")
        bank = SystemFinding(found=False)
        ledger = SystemFinding(found=False)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "PAYMENT_FAILED"
        assert conf == "HIGH"

    def test_rule_gateway_pending(self, engine):
        """Rule 4: Gateway pending -> PAYMENT_PENDING."""
        gw = SystemFinding(found=True, status="PENDING")
        bank = SystemFinding(found=False)
        ledger = SystemFinding(found=False)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "PAYMENT_PENDING"
        assert conf == "MEDIUM"

    def test_rule_gateway_cancelled(self, engine):
        """Rule 5: Gateway cancelled -> PAYMENT_CANCELLED."""
        gw = SystemFinding(found=True, status="CANCELLED")
        bank = SystemFinding(found=False)
        ledger = SystemFinding(found=False)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "PAYMENT_CANCELLED"
        assert conf == "HIGH"

    def test_rule_bank_pending(self, engine):
        """Rule 7: Bank pending -> DELAYED."""
        gw = SystemFinding(found=True, status="SUCCESS", amount=2500)
        bank = SystemFinding(found=True, status="PENDING", reason="BANK_PROCESSING_DELAY", amount=2500)
        ledger = SystemFinding(found=True, status="POSTED", amount=2500)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "DELAYED"
        assert conf == "HIGH"

    def test_rule_bank_failed(self, engine):
        """Rule 8: Bank failed -> SETTLEMENT_FAILED."""
        gw = SystemFinding(found=True, status="SUCCESS", amount=2500)
        bank = SystemFinding(found=True, status="FAILED", reason="BANK_TIMEOUT", amount=2500)
        ledger = SystemFinding(found=True, status="POSTED", amount=2500)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "SETTLEMENT_FAILED"
        assert conf == "HIGH"

    def test_rule_bank_rejected(self, engine):
        """Rule 8: Bank rejected -> SETTLEMENT_FAILED."""
        gw = SystemFinding(found=True, status="SUCCESS", amount=2500)
        bank = SystemFinding(found=True, status="REJECTED", reason="COMPLIANCE_REVIEW", amount=2500)
        ledger = SystemFinding(found=True, status="POSTED", amount=2500)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "SETTLEMENT_FAILED"

    def test_rule_ledger_missing(self, engine):
        """Rule 9: Ledger missing with bank settled -> LEDGER_MISMATCH."""
        gw = SystemFinding(found=True, status="SUCCESS", amount=2500)
        bank = SystemFinding(found=True, status="SETTLED", amount=2500)
        ledger = SystemFinding(found=False)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "LEDGER_MISMATCH"
        assert conf == "MEDIUM"

    def test_rule_bank_missing(self, engine):
        """Rule 11: Bank missing -> UNKNOWN."""
        gw = SystemFinding(found=True, status="SUCCESS", amount=2500)
        bank = SystemFinding(found=False)
        ledger = SystemFinding(found=True, status="POSTED", amount=2500)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "UNKNOWN"
        assert conf == "LOW"

    def test_rule_amount_mismatch(self, engine):
        """Rule 2: Amount mismatch -> DATA_MISMATCH."""
        gw = SystemFinding(found=True, status="SUCCESS", amount=5000)
        bank = SystemFinding(found=True, status="SETTLED", amount=4500)
        ledger = SystemFinding(found=True, status="POSTED", amount=5000)
        exceptions = [
            ExceptionItem(
                code="GATEWAY_BANK_AMOUNT_MISMATCH",
                severity="HIGH",
                message="Amount mismatch",
                impact="Requires investigation"
            )
        ]
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, exceptions)
        assert status == "DATA_MISMATCH"
        assert conf == "LOW"

    def test_rule_multiple_problems_pending_no_ledger(self, engine):
        """Bank pending + ledger missing -> DELAYED with LOW confidence."""
        gw = SystemFinding(found=True, status="SUCCESS", amount=2500)
        bank = SystemFinding(found=True, status="PENDING", reason="BANK_PROCESSING_DELAY", amount=2500)
        ledger = SystemFinding(found=False)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert status == "DELAYED"
        assert conf == "LOW"

    def test_unknown_never_claims_rejection(self, engine):
        """When bank is missing, root cause should not claim rejection."""
        gw = SystemFinding(found=True, status="SUCCESS", amount=2500)
        bank = SystemFinding(found=False)
        ledger = SystemFinding(found=True, status="POSTED", amount=2500)
        status, cause, conf = engine.evaluate(gw, bank, ledger, None, None, None, [])
        assert "rejected" not in cause.lower()
        assert "reject" not in cause.lower()
