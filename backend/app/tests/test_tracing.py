"""
Tests for the Tracing Service

Verifies that the tracing service correctly correlates records
across systems and produces accurate VerifiedFacts.
"""

import pytest
from app.services.data_service import DataService
from app.services.tracing_service import TracingService


@pytest.fixture
def data_service():
    """Create and load a DataService instance."""
    ds = DataService()
    ds.load_data()
    return ds


@pytest.fixture
def tracing_service(data_service):
    """Create a TracingService with loaded data."""
    return TracingService(data_service)


class TestTracingService:
    """Test transaction tracing across systems."""

    def test_investigate_returns_verified_facts(self, tracing_service, data_service):
        """A valid transaction should produce VerifiedFacts."""
        txn_ids = data_service.get_all_transaction_ids()
        assert len(txn_ids) > 0
        result = tracing_service.investigate(txn_ids[0])
        assert result is not None
        assert result.transaction_id == txn_ids[0]

    def test_investigate_not_found(self, tracing_service):
        """A non-existent transaction should return None."""
        result = tracing_service.investigate("TXN_DOES_NOT_EXIST")
        assert result is None

    def test_gateway_finding_populated(self, tracing_service, data_service):
        """Gateway finding should be populated when record exists."""
        txn_ids = data_service.get_all_transaction_ids()
        result = tracing_service.investigate(txn_ids[0])
        assert result.gateway.found is True
        assert result.gateway.status is not None

    def test_all_transactions_have_gateway(self, tracing_service, data_service):
        """Every transaction in our dataset should have a gateway record."""
        for txn_id in data_service.get_all_transaction_ids():
            result = tracing_service.investigate(txn_id)
            assert result is not None, f"No result for {txn_id}"
            assert result.gateway.found is True, f"No gateway for {txn_id}"

    def test_timeline_not_empty_for_valid_transaction(self, tracing_service, data_service):
        """Timeline should have events for valid transactions."""
        txn_ids = data_service.get_all_transaction_ids()
        result = tracing_service.investigate(txn_ids[0])
        timeline = tracing_service.build_timeline(result)
        assert len(timeline) > 0

    def test_timeline_sorted_by_timestamp(self, tracing_service, data_service):
        """Timeline events should be sorted chronologically."""
        txn_ids = data_service.get_all_transaction_ids()
        result = tracing_service.investigate(txn_ids[0])
        timeline = tracing_service.build_timeline(result)
        timestamps = [e.timestamp for e in timeline if e.timestamp]
        assert timestamps == sorted(timestamps)

    def test_verified_facts_has_final_status(self, tracing_service, data_service):
        """Every investigation should produce a final_status."""
        for txn_id in data_service.get_all_transaction_ids()[:20]:
            result = tracing_service.investigate(txn_id)
            assert result is not None
            assert result.final_status != ""
            assert result.confidence in ("HIGH", "MEDIUM", "LOW")
