"""
Mock Data Generator for Settlement Support Agent

Generates realistic synthetic fintech data across three systems:
- Payment Gateway (gateway.csv)
- Bank Settlement (bank_settlements.csv)
- Internal Ledger (ledger.csv)

Creates 100 transactions with deliberate scenario variations.
"""

import csv
import os
import random
from datetime import datetime, timedelta

# Seed for reproducibility
random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MERCHANTS = ["MRC001", "MRC002", "MRC003", "MRC004", "MRC005"]
CURRENCIES = ["INR"]
PAYMENT_METHODS = ["UPI", "NEFT", "IMPS", "CARD", "WALLET"]

BASE_DATE = datetime(2026, 9, 4, 8, 0, 0)


def generate_timestamp(base: datetime, offset_minutes: int) -> str:
    return (base + timedelta(minutes=offset_minutes)).strftime("%Y-%m-%dT%H:%M:%S")


# ─── Define transaction scenarios ─────────────────────────────────────────────
# Each scenario: (gateway_status, bank_status, ledger_status, bank_reason, special)

SCENARIOS = []

# CASE 1: Full success (40 transactions)
for _ in range(40):
    SCENARIOS.append(("SUCCESS", "SETTLED", "POSTED", "", "normal"))

# CASE 2: Bank processing delay (15 transactions)
for _ in range(15):
    SCENARIOS.append(("SUCCESS", "PENDING", "POSTED", "BANK_PROCESSING_DELAY", "normal"))

# CASE 3: Bank failure (8 transactions)
bank_fail_reasons = [
    ("BANK_TIMEOUT", "BANK_TIMEOUT"),
    ("INVALID_BANK_ACCOUNT", "INVALID_BANK_ACCOUNT"),
    ("BANK_SERVER_UNAVAILABLE", "BANK_SERVER_UNAVAILABLE"),
    ("SETTLEMENT_WINDOW_MISSED", "SETTLEMENT_WINDOW_MISSED"),
    ("COMPLIANCE_REVIEW", "COMPLIANCE_REVIEW"),
]
for i in range(8):
    code, reason = bank_fail_reasons[i % len(bank_fail_reasons)]
    status = "FAILED" if i < 5 else "REJECTED"
    SCENARIOS.append(("SUCCESS", status, "POSTED", reason, "normal"))

# CASE 4: Gateway failure (10 transactions)
gateway_fail_reasons = [
    ("INSUFFICIENT_FUNDS", "Customer has insufficient funds"),
    ("CARD_DECLINED", "Card was declined by issuing bank"),
    ("TIMEOUT", "Payment gateway timed out"),
    ("INVALID_CARD", "Invalid card number provided"),
    ("FRAUD_DETECTED", "Suspected fraudulent transaction"),
]
for i in range(10):
    code, reason = gateway_fail_reasons[i % len(gateway_fail_reasons)]
    SCENARIOS.append(("FAILED", "NOT_INITIATED", None, "", f"gw_fail:{code}:{reason}"))

# CASE 5: Ledger missing (5 transactions)
for _ in range(5):
    SCENARIOS.append(("SUCCESS", "SETTLED", None, "", "ledger_missing"))

# CASE 6: Bank record missing (5 transactions)
for _ in range(5):
    SCENARIOS.append(("SUCCESS", None, "POSTED", "", "bank_missing"))

# CASE 7: Amount mismatch - bank (3 transactions)
for _ in range(3):
    SCENARIOS.append(("SUCCESS", "SETTLED", "POSTED", "", "bank_amount_mismatch"))

# CASE 8: Ledger amount mismatch (3 transactions)
for _ in range(3):
    SCENARIOS.append(("SUCCESS", "SETTLED", "POSTED", "", "ledger_amount_mismatch"))

# CASE 9: Multiple problems - gateway success, bank pending, ledger missing (5 transactions)
for _ in range(5):
    SCENARIOS.append(("SUCCESS", "PENDING", None, "BANK_PROCESSING_DELAY", "multi_problem"))

# CASE 10: Gateway pending (3 transactions)
for _ in range(3):
    SCENARIOS.append(("PENDING", None, None, "", "gw_pending"))

# CASE 11: Gateway cancelled (3 transactions)
for _ in range(3):
    SCENARIOS.append(("CANCELLED", None, None, "", "gw_cancelled"))

# Total: 100 transactions
assert len(SCENARIOS) == 100, f"Expected 100 scenarios, got {len(SCENARIOS)}"

# Shuffle to mix scenarios
random.shuffle(SCENARIOS)


def generate_data():
    gateway_rows = []
    bank_rows = []
    ledger_rows = []

    for i, scenario in enumerate(SCENARIOS):
        txn_id = f"TXN{100001 + i}"
        gw_status, bank_status, ledger_status, bank_reason, special = scenario
        merchant = random.choice(MERCHANTS)
        amount = round(random.choice([500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 25000]), 2)
        currency = "INR"
        payment_method = random.choice(PAYMENT_METHODS)

        # Time offsets
        base_offset = i * 3  # 3 minute gaps between transactions
        gw_time = generate_timestamp(BASE_DATE, base_offset)
        bank_time = generate_timestamp(BASE_DATE, base_offset + 1)
        ledger_time = generate_timestamp(BASE_DATE, base_offset + 1)

        payment_id = f"PAY{100001 + i}"
        gw_ref = f"GW{random.randint(10000, 99999)}"

        # Parse special flags
        gw_fail_code = ""
        gw_fail_reason = ""
        if special.startswith("gw_fail:"):
            parts = special.split(":", 2)
            gw_fail_code = parts[1]
            gw_fail_reason = parts[2]

        # ─── Gateway record (always present) ──────────────────────────────
        gateway_rows.append({
            "transaction_id": txn_id,
            "payment_id": payment_id,
            "merchant_id": merchant,
            "amount": amount,
            "currency": currency,
            "payment_method": payment_method,
            "gateway_status": gw_status,
            "gateway_timestamp": gw_time,
            "gateway_reference": gw_ref,
            "failure_code": gw_fail_code,
            "failure_reason": gw_fail_reason,
        })

        # ─── Bank record ──────────────────────────────────────────────────
        if bank_status is not None:
            bank_amount = amount
            if special == "bank_amount_mismatch":
                bank_amount = amount - 500  # Deliberate mismatch

            bank_fail_code = ""
            bank_fail_reason_field = ""
            if bank_status in ("FAILED", "REJECTED"):
                bank_fail_code = bank_reason
                bank_fail_reason_field = bank_reason
            elif bank_status == "PENDING":
                bank_fail_reason_field = bank_reason

            settlement_id = f"STL{100001 + i}"
            bank_ref = f"BANK{random.randint(10000, 99999)}"

            bank_rows.append({
                "transaction_id": txn_id,
                "settlement_id": settlement_id,
                "merchant_id": merchant,
                "amount": bank_amount,
                "currency": currency,
                "settlement_status": bank_status,
                "settlement_timestamp": bank_time,
                "bank_reference": bank_ref,
                "failure_code": bank_fail_code,
                "failure_reason": bank_fail_reason_field,
            })

        # ─── Ledger record ────────────────────────────────────────────────
        if ledger_status is not None:
            ledger_amount = amount
            if special == "ledger_amount_mismatch":
                ledger_amount = amount - 500  # Deliberate mismatch

            ledger_entry_id = f"LED{100001 + i}"
            posting_ref = f"POST{random.randint(10000, 99999)}"

            ledger_rows.append({
                "transaction_id": txn_id,
                "ledger_entry_id": ledger_entry_id,
                "merchant_id": merchant,
                "amount": ledger_amount,
                "currency": currency,
                "ledger_status": ledger_status,
                "debit": ledger_amount,
                "credit": 0,
                "ledger_timestamp": ledger_time,
                "posting_reference": posting_ref,
            })

    # ─── Write CSVs ───────────────────────────────────────────────────────────

    data_dir = os.path.join(BASE_DIR)

    gw_path = os.path.join(data_dir, "gateway.csv")
    with open(gw_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "transaction_id", "payment_id", "merchant_id", "amount", "currency",
            "payment_method", "gateway_status", "gateway_timestamp", "gateway_reference",
            "failure_code", "failure_reason"
        ])
        writer.writeheader()
        writer.writerows(gateway_rows)

    bank_path = os.path.join(data_dir, "bank_settlements.csv")
    with open(bank_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "transaction_id", "settlement_id", "merchant_id", "amount", "currency",
            "settlement_status", "settlement_timestamp", "bank_reference",
            "failure_code", "failure_reason"
        ])
        writer.writeheader()
        writer.writerows(bank_rows)

    ledger_path = os.path.join(data_dir, "ledger.csv")
    with open(ledger_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "transaction_id", "ledger_entry_id", "merchant_id", "amount", "currency",
            "ledger_status", "debit", "credit", "ledger_timestamp", "posting_reference"
        ])
        writer.writeheader()
        writer.writerows(ledger_rows)

    print(f"Generated {len(gateway_rows)} gateway records -> {gw_path}")
    print(f"Generated {len(bank_rows)} bank records -> {bank_path}")
    print(f"Generated {len(ledger_rows)} ledger records -> {ledger_path}")


if __name__ == "__main__":
    generate_data()
