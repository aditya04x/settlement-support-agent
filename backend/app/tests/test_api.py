"""
Tests for the API Endpoints

Verifies all REST API endpoints return correct responses.
Does not require a real LLM API key.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create a test client with lifespan support."""
    with TestClient(app) as c:
        yield c


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "llm_provider" in data
        assert "data_loaded" in data


class TestInvestigateEndpoint:
    def test_investigate_valid_transaction(self, client):
        """Valid transaction should return full investigation."""
        response = client.post(
            "/api/investigate",
            json={"transaction_id": "TXN100001"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_id"] == "TXN100001"
        assert "investigation" in data
        assert "explanation" in data
        assert "timeline" in data

    def test_investigate_not_found(self, client):
        """Unknown transaction should return 404."""
        response = client.post(
            "/api/investigate",
            json={"transaction_id": "TXN999999"}
        )
        assert response.status_code == 404

    def test_investigate_empty_id(self, client):
        """Empty transaction ID should return 422."""
        response = client.post(
            "/api/investigate",
            json={"transaction_id": ""}
        )
        assert response.status_code == 422

    def test_investigate_invalid_characters(self, client):
        """Transaction ID with special chars should return 422."""
        response = client.post(
            "/api/investigate",
            json={"transaction_id": "TXN'; DROP TABLE--"}
        )
        assert response.status_code == 422

    def test_investigation_has_verified_facts(self, client):
        """Investigation should contain all verified fact fields."""
        response = client.post(
            "/api/investigate",
            json={"transaction_id": "TXN100001"}
        )
        data = response.json()
        investigation = data["investigation"]
        assert "gateway" in investigation
        assert "bank" in investigation
        assert "ledger" in investigation
        assert "final_status" in investigation
        assert "root_cause" in investigation
        assert "confidence" in investigation
        assert "exceptions" in investigation

    def test_explanation_has_required_fields(self, client):
        """Explanation should contain all required fields."""
        response = client.post(
            "/api/investigate",
            json={"transaction_id": "TXN100001"}
        )
        data = response.json()
        explanation = data["explanation"]
        assert "summary" in explanation
        assert "root_cause_explanation" in explanation
        assert "recommended_action" in explanation
        assert "customer_friendly_explanation" in explanation


class TestTransactionListEndpoint:
    def test_list_all(self, client):
        """Should return all transactions."""
        response = client.get("/api/transactions")
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "total" in data
        assert data["total"] == 100

    def test_filter_by_date(self, client):
        """Should filter by date."""
        response = client.get("/api/transactions?date=2026-09-04")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0


class TestTransactionDetailEndpoint:
    def test_get_existing(self, client):
        """Should return investigation for existing transaction."""
        response = client.get("/api/transactions/TXN100001")
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_id"] == "TXN100001"

    def test_get_not_found(self, client):
        """Should return 404 for unknown transaction."""
        response = client.get("/api/transactions/TXN999999")
        assert response.status_code == 404


class TestStatsEndpoint:
    def test_stats(self, client):
        """Should return calculated statistics."""
        response = client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["total_transactions"] == 100
        assert "settled" in data
        assert "delayed" in data
        assert "failed" in data
        assert "mismatched" in data


class TestDemoTransactionsEndpoint:
    def test_demo_transactions(self, client):
        """Should return demo transaction list."""
        response = client.get("/api/demo-transactions")
        assert response.status_code == 200
        data = response.json()
        assert "demo_transactions" in data
        demos = data["demo_transactions"]
        assert len(demos) > 0
        # Should have at least a few different scenarios
        statuses = {d["final_status"] for d in demos}
        assert len(statuses) >= 3
