"""
Data Service - CSV Loading and Validation

Loads gateway, bank settlement, and ledger CSV data into pandas DataFrames.
Validates data quality on startup and provides query methods.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import pandas as pd

from app.models.schemas import GatewayRecord, BankRecord, LedgerRecord

logger = logging.getLogger(__name__)

# Valid values for data validation
VALID_GATEWAY_STATUSES = {"SUCCESS", "FAILED", "PENDING", "CANCELLED"}
VALID_SETTLEMENT_STATUSES = {"SETTLED", "PENDING", "FAILED", "REJECTED", "NOT_INITIATED"}
VALID_LEDGER_STATUSES = {"POSTED", "PENDING", "FAILED", "REVERSED"}
VALID_CURRENCIES = {"INR", "USD", "EUR", "GBP"}


class DataValidationError(Exception):
    """Raised when CSV data fails validation."""
    pass


class DataService:
    """
    Service for loading and querying transaction data from CSV files.

    Loads all three datasets on initialization and provides methods
    to query by transaction ID or date filters.
    """

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        self.data_dir = os.path.abspath(data_dir)
        self.gateway_df: Optional[pd.DataFrame] = None
        self.bank_df: Optional[pd.DataFrame] = None
        self.ledger_df: Optional[pd.DataFrame] = None
        self._loaded = False

    def load_data(self) -> list[str]:
        """
        Load all CSV files and validate them.
        Returns a list of validation warnings (empty if all clean).
        """
        warnings = []

        # Load gateway data
        gw_path = os.path.join(self.data_dir, "gateway.csv")
        if not os.path.exists(gw_path):
            raise DataValidationError(f"Gateway CSV not found: {gw_path}")
        self.gateway_df = pd.read_csv(gw_path, dtype=str)
        self.gateway_df["amount"] = pd.to_numeric(self.gateway_df["amount"], errors="coerce")
        warnings.extend(self._validate_gateway())

        # Load bank data
        bank_path = os.path.join(self.data_dir, "bank_settlements.csv")
        if not os.path.exists(bank_path):
            raise DataValidationError(f"Bank settlements CSV not found: {bank_path}")
        self.bank_df = pd.read_csv(bank_path, dtype=str)
        self.bank_df["amount"] = pd.to_numeric(self.bank_df["amount"], errors="coerce")
        warnings.extend(self._validate_bank())

        # Load ledger data
        ledger_path = os.path.join(self.data_dir, "ledger.csv")
        if not os.path.exists(ledger_path):
            raise DataValidationError(f"Ledger CSV not found: {ledger_path}")
        self.ledger_df = pd.read_csv(ledger_path, dtype=str)
        self.ledger_df["amount"] = pd.to_numeric(self.ledger_df["amount"], errors="coerce")
        self.ledger_df["debit"] = pd.to_numeric(self.ledger_df["debit"], errors="coerce")
        self.ledger_df["credit"] = pd.to_numeric(self.ledger_df["credit"], errors="coerce")
        warnings.extend(self._validate_ledger())

        self._loaded = True
        logger.info(
            "Data loaded: %d gateway, %d bank, %d ledger records",
            len(self.gateway_df), len(self.bank_df), len(self.ledger_df)
        )

        if warnings:
            for w in warnings:
                logger.warning("Data validation: %s", w)

        return warnings

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    # ─── Validation ───────────────────────────────────────────────────────

    def _validate_gateway(self) -> list[str]:
        """Validate gateway CSV data quality."""
        warnings = []
        required = ["transaction_id", "payment_id", "merchant_id", "amount",
                     "currency", "gateway_status", "gateway_timestamp"]
        missing = [c for c in required if c not in self.gateway_df.columns]
        if missing:
            raise DataValidationError(f"Gateway CSV missing columns: {missing}")

        # Check for duplicates
        dupes = self.gateway_df[self.gateway_df["transaction_id"].duplicated()]
        if not dupes.empty:
            warnings.append(
                f"Gateway has {len(dupes)} duplicate transaction IDs"
            )

        # Validate statuses
        invalid = self.gateway_df[
            ~self.gateway_df["gateway_status"].isin(VALID_GATEWAY_STATUSES)
        ]
        if not invalid.empty:
            warnings.append(
                f"Gateway has {len(invalid)} records with invalid status"
            )

        # Check NaN amounts
        nan_amounts = self.gateway_df["amount"].isna().sum()
        if nan_amounts > 0:
            warnings.append(f"Gateway has {nan_amounts} records with non-numeric amounts")

        return warnings

    def _validate_bank(self) -> list[str]:
        """Validate bank settlement CSV data quality."""
        warnings = []
        required = ["transaction_id", "settlement_id", "merchant_id", "amount",
                     "currency", "settlement_status", "settlement_timestamp"]
        missing = [c for c in required if c not in self.bank_df.columns]
        if missing:
            raise DataValidationError(f"Bank CSV missing columns: {missing}")

        invalid = self.bank_df[
            ~self.bank_df["settlement_status"].isin(VALID_SETTLEMENT_STATUSES)
        ]
        if not invalid.empty:
            warnings.append(
                f"Bank has {len(invalid)} records with invalid status"
            )

        return warnings

    def _validate_ledger(self) -> list[str]:
        """Validate ledger CSV data quality."""
        warnings = []
        required = ["transaction_id", "ledger_entry_id", "merchant_id", "amount",
                     "currency", "ledger_status", "ledger_timestamp"]
        missing = [c for c in required if c not in self.ledger_df.columns]
        if missing:
            raise DataValidationError(f"Ledger CSV missing columns: {missing}")

        invalid = self.ledger_df[
            ~self.ledger_df["ledger_status"].isin(VALID_LEDGER_STATUSES)
        ]
        if not invalid.empty:
            warnings.append(
                f"Ledger has {len(invalid)} records with invalid status"
            )

        return warnings

    # ─── Query Methods ────────────────────────────────────────────────────

    def get_gateway_record(self, transaction_id: str) -> Optional[GatewayRecord]:
        """Look up a gateway record by transaction ID."""
        if self.gateway_df is None:
            return None
        matches = self.gateway_df[self.gateway_df["transaction_id"] == transaction_id]
        if matches.empty:
            return None
        row = matches.iloc[0].to_dict()
        # Clean NaN values
        for k, v in row.items():
            if pd.isna(v):
                row[k] = None
        return GatewayRecord(**row)

    def get_bank_record(self, transaction_id: str) -> Optional[BankRecord]:
        """Look up a bank settlement record by transaction ID."""
        if self.bank_df is None:
            return None
        matches = self.bank_df[self.bank_df["transaction_id"] == transaction_id]
        if matches.empty:
            return None
        row = matches.iloc[0].to_dict()
        for k, v in row.items():
            if pd.isna(v):
                row[k] = None
        return BankRecord(**row)

    def get_ledger_record(self, transaction_id: str) -> Optional[LedgerRecord]:
        """Look up a ledger record by transaction ID."""
        if self.ledger_df is None:
            return None
        matches = self.ledger_df[self.ledger_df["transaction_id"] == transaction_id]
        if matches.empty:
            return None
        row = matches.iloc[0].to_dict()
        for k, v in row.items():
            if pd.isna(v):
                row[k] = None
        return LedgerRecord(**row)

    def get_all_transaction_ids(self) -> list[str]:
        """Get all unique transaction IDs from gateway data."""
        if self.gateway_df is None:
            return []
        return sorted(self.gateway_df["transaction_id"].unique().tolist())

    def search_by_date(self, date_str: str) -> list[dict]:
        """Search transactions by date (YYYY-MM-DD format)."""
        if self.gateway_df is None:
            return []
        # Filter gateway records by date prefix
        mask = self.gateway_df["gateway_timestamp"].str.startswith(date_str)
        matches = self.gateway_df[mask]
        return matches.to_dict("records")

    def search_transactions(
        self,
        status: Optional[str] = None,
        date: Optional[str] = None,
        merchant_id: Optional[str] = None,
        transaction_id_prefix: Optional[str] = None,
    ) -> list[dict]:
        """Search transactions with optional filters."""
        if self.gateway_df is None:
            return []

        df = self.gateway_df.copy()

        if status:
            df = df[df["gateway_status"] == status.upper()]
        if date:
            df = df[df["gateway_timestamp"].str.startswith(date)]
        if merchant_id:
            df = df[df["merchant_id"] == merchant_id]
        if transaction_id_prefix:
            df = df[df["transaction_id"].str.upper().str.startswith(transaction_id_prefix.upper())]

        return df.to_dict("records")

    def get_stats(self) -> dict:
        """Calculate aggregate statistics from gateway data."""
        if self.gateway_df is None:
            return {}
        return {
            "total": len(self.gateway_df),
            "by_status": self.gateway_df["gateway_status"].value_counts().to_dict(),
        }
