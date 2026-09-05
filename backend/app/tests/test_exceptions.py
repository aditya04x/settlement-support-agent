"""
Tests for the Exception Detector

Verifies that exceptions are correctly detected for various
cross-system anomalies and inconsistencies.
"""

import pytest
from app.models.schemas import GatewayRecord, BankRecord, LedgerRecord
from app.services.exception_detector import ExceptionDetector


@pytest.fixture
def detector():
    return ExceptionDetector()


def make_gateway(**kwargs):
    defaults = {
        "transaction_id": "TXN100001",
        "payment_id": "PAY100001",
        "merchant_id": "MRC001",
        "amount": 2500,
        "currency": "INR",
        "payment_method": "UPI",
        "gateway_status": "SUCCESS",
        "gateway_timestamp": "2026-09-04T10:15:00",
        "gateway_reference": "GW12345",
    }
    defaults.update(kwargs)
    return GatewayRecord(**defaults)


def make_bank(**kwargs):
    defaults = {
        "transaction_id": "TXN100001",
        "settlement_id": "STL100001",
        "merchant_id": "MRC001",
        "amount": 2500,
        "currency": "INR",
        "settlement_status": "SETTLED",
        "settlement_timestamp": "2026-09-04T10:16:00",
        "bank_reference": "BANK12345",
    }
    defaults.update(kwargs)
    return BankRecord(**defaults)


def make_ledger(**kwargs):
    defaults = {
        "transaction_id": "TXN100001",
        "ledger_entry_id": "LED100001",
        "merchant_id": "MRC001",
        "amount": 2500,
        "currency": "INR",
        "ledger_status": "POSTED",
        "debit": 2500,
        "credit": 0,
        "ledger_timestamp": "2026-09-04T10:16:00",
        "posting_reference": "POST12345",
    }
    defaults.update(kwargs)
    return LedgerRecord(**defaults)


class TestExceptionDetector:
    """Test exception detection."""

    def test_no_exceptions_for_clean_transaction(self, detector):
        """Fully matching records should produce no exceptions."""
        gw = make_gateway()
        bank = make_bank()
        ledger = make_ledger()
        exceptions = detector.detect(gw, bank, ledger)
        assert len(exceptions) == 0

    def test_gateway_missing(self, detector):
        """Missing gateway should be flagged."""
        exceptions = detector.detect(None, make_bank(), make_ledger())
        codes = [e.code for e in exceptions]
        assert "GATEWAY_RECORD_MISSING" in codes

    def test_bank_missing_with_success(self, detector):
        """Missing bank record when gateway succeeded should be flagged."""
        gw = make_gateway(gateway_status="SUCCESS")
        exceptions = detector.detect(gw, None, make_ledger())
        codes = [e.code for e in exceptions]
        assert "BANK_RECORD_MISSING" in codes

    def test_bank_missing_not_flagged_when_gateway_failed(self, detector):
        """Missing bank record should NOT be flagged when gateway failed."""
        gw = make_gateway(gateway_status="FAILED")
        exceptions = detector.detect(gw, None, None)
        codes = [e.code for e in exceptions]
        assert "BANK_RECORD_MISSING" not in codes

    def test_ledger_missing_with_success(self, detector):
        """Missing ledger when gateway succeeded should be flagged."""
        gw = make_gateway(gateway_status="SUCCESS")
        exceptions = detector.detect(gw, make_bank(), None)
        codes = [e.code for e in exceptions]
        assert "LEDGER_RECORD_MISSING" in codes

    def test_gateway_bank_amount_mismatch(self, detector):
        """Amount difference between gateway and bank should be flagged."""
        gw = make_gateway(amount=5000)
        bank = make_bank(amount=4500)
        ledger = make_ledger(amount=5000)
        exceptions = detector.detect(gw, bank, ledger)
        codes = [e.code for e in exceptions]
        assert "GATEWAY_BANK_AMOUNT_MISMATCH" in codes

    def test_gateway_ledger_amount_mismatch(self, detector):
        """Amount difference between gateway and ledger should be flagged."""
        gw = make_gateway(amount=5000)
        bank = make_bank(amount=5000)
        ledger = make_ledger(amount=4500)
        exceptions = detector.detect(gw, bank, ledger)
        codes = [e.code for e in exceptions]
        assert "GATEWAY_LEDGER_AMOUNT_MISMATCH" in codes

    def test_bank_ledger_amount_mismatch(self, detector):
        """Amount difference between bank and ledger should be flagged."""
        gw = make_gateway(amount=5000)
        bank = make_bank(amount=4500)
        ledger = make_ledger(amount=5000)
        exceptions = detector.detect(gw, bank, ledger)
        codes = [e.code for e in exceptions]
        assert "GATEWAY_BANK_AMOUNT_MISMATCH" in codes

    def test_currency_mismatch(self, detector):
        """Different currencies across systems should be flagged."""
        gw = make_gateway(currency="INR")
        bank = make_bank(currency="USD")
        ledger = make_ledger(currency="INR")
        exceptions = detector.detect(gw, bank, ledger)
        codes = [e.code for e in exceptions]
        assert "CURRENCY_MISMATCH" in codes

    def test_merchant_mismatch(self, detector):
        """Different merchant IDs across systems should be flagged."""
        gw = make_gateway(merchant_id="MRC001")
        bank = make_bank(merchant_id="MRC002")
        ledger = make_ledger(merchant_id="MRC001")
        exceptions = detector.detect(gw, bank, ledger)
        codes = [e.code for e in exceptions]
        assert "MERCHANT_MISMATCH" in codes

    def test_contradictory_gateway_failed_bank_settled(self, detector):
        """Gateway FAILED but bank SETTLED should be flagged."""
        gw = make_gateway(gateway_status="FAILED")
        bank = make_bank(settlement_status="SETTLED")
        exceptions = detector.detect(gw, bank, make_ledger())
        codes = [e.code for e in exceptions]
        assert "UNEXPECTED_STATUS_COMBINATION" in codes

    def test_missing_settlement_reason(self, detector):
        """Bank FAILED without failure_reason should be flagged."""
        gw = make_gateway()
        bank = make_bank(settlement_status="FAILED", failure_reason=None)
        exceptions = detector.detect(gw, bank, make_ledger())
        codes = [e.code for e in exceptions]
        assert "MISSING_SETTLEMENT_REASON" in codes

    def test_multiple_exceptions(self, detector):
        """Multiple issues should produce multiple exceptions."""
        gw = make_gateway(gateway_status="SUCCESS", amount=5000)
        # bank missing + ledger missing
        exceptions = detector.detect(gw, None, None)
        assert len(exceptions) >= 2
