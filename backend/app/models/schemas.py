"""
Settlement Support Agent - Pydantic Schemas

Defines all data models for the application including request/response
schemas, internal data models, and LLM interaction models.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums ────────────────────────────────────────────────────────────────────

class GatewayStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"


class SettlementStatus(str, Enum):
    SETTLED = "SETTLED"
    PENDING = "PENDING"
    FAILED = "FAILED"
    REJECTED = "REJECTED"
    NOT_INITIATED = "NOT_INITIATED"


class LedgerStatus(str, Enum):
    POSTED = "POSTED"
    PENDING = "PENDING"
    FAILED = "FAILED"
    REVERSED = "REVERSED"


class FinalStatus(str, Enum):
    SETTLED = "SETTLED"
    DELAYED = "DELAYED"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    SETTLEMENT_FAILED = "SETTLEMENT_FAILED"
    LEDGER_MISMATCH = "LEDGER_MISMATCH"
    DATA_MISMATCH = "DATA_MISMATCH"
    UNKNOWN = "UNKNOWN"
    NOT_FOUND = "NOT_FOUND"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_CANCELLED = "PAYMENT_CANCELLED"


class Confidence(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Severity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


# ─── Data Records ────────────────────────────────────────────────────────────

class GatewayRecord(BaseModel):
    """A payment gateway transaction record."""
    transaction_id: str
    payment_id: str
    merchant_id: str
    amount: float
    currency: str
    payment_method: str
    gateway_status: str
    gateway_timestamp: str
    gateway_reference: str
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None


class BankRecord(BaseModel):
    """A bank settlement record."""
    transaction_id: str
    settlement_id: str
    merchant_id: str
    amount: float
    currency: str
    settlement_status: str
    settlement_timestamp: str
    bank_reference: str
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None


class LedgerRecord(BaseModel):
    """An internal ledger record."""
    transaction_id: str
    ledger_entry_id: str
    merchant_id: str
    amount: float
    currency: str
    ledger_status: str
    debit: float
    credit: float
    ledger_timestamp: str
    posting_reference: str


# ─── System Findings ─────────────────────────────────────────────────────────

class SystemFinding(BaseModel):
    """Finding from one system (gateway/bank/ledger)."""
    found: bool
    status: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    timestamp: Optional[str] = None
    reference: Optional[str] = None
    reason: Optional[str] = None
    failure_code: Optional[str] = None
    raw_record: Optional[dict] = None


class ExceptionItem(BaseModel):
    """A detected exception or anomaly."""
    code: str
    severity: str
    message: str
    impact: str


# ─── Verified Facts ──────────────────────────────────────────────────────────

class VerifiedFacts(BaseModel):
    """The complete verified investigation result."""
    transaction_id: str
    amount: Optional[float] = None
    currency: Optional[str] = None
    merchant_id: Optional[str] = None

    gateway: SystemFinding
    bank: SystemFinding
    ledger: SystemFinding

    final_status: str
    root_cause: str
    confidence: str
    exceptions: list[ExceptionItem] = Field(default_factory=list)


# ─── LLM Explanation ─────────────────────────────────────────────────────────

class LLMExplanation(BaseModel):
    """Structured explanation from LLM or demo provider."""
    summary: str
    root_cause_explanation: str
    recommended_action: str
    customer_friendly_explanation: str
    uncertainties: list[str] = Field(default_factory=list)
    is_demo_mode: bool = False


# ─── Timeline ────────────────────────────────────────────────────────────────

class TimelineEvent(BaseModel):
    """A single event in the transaction timeline."""
    timestamp: Optional[str] = None
    event: str
    system: str
    status: Optional[str] = None


# ─── API Request/Response ────────────────────────────────────────────────────

class InvestigateRequest(BaseModel):
    """Request body for transaction investigation."""
    transaction_id: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Transaction ID to investigate",
        pattern=r"^[A-Za-z0-9_-]+$"
    )


class InvestigationResponse(BaseModel):
    """Full investigation response."""
    transaction_id: str
    investigation: VerifiedFacts
    explanation: LLMExplanation
    timeline: list[TimelineEvent] = Field(default_factory=list)


class TransactionListItem(BaseModel):
    """Summary item for transaction list."""
    transaction_id: str
    merchant_id: str
    amount: float
    currency: str
    gateway_status: str
    settlement_status: Optional[str] = None
    ledger_status: Optional[str] = None
    final_status: str
    gateway_timestamp: str


class TransactionListResponse(BaseModel):
    """Response for transaction list endpoint."""
    transactions: list[TransactionListItem]
    total: int
    filters_applied: dict = Field(default_factory=dict)


class StatsResponse(BaseModel):
    """Dashboard statistics response."""
    total_transactions: int
    settled: int
    delayed: int
    failed: int
    mismatched: int
    unknown: int
    payment_failed: int
    payment_pending: int
    payment_cancelled: int
    # Derived metrics
    settlement_rate: float = 0.0  # percentage of fully settled transactions
    exception_rate: float = 0.0   # percentage of transactions with exceptions


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    llm_provider: str
    llm_available: bool
    data_loaded: bool


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
