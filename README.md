# Settlement Q&A Agent for Fintech Support 💳🤖

An AI-powered support investigation agent that automatically traces transaction lifecycles across Payment Gateways, Bank Settlement feeds, and Internal Ledgers to deterministically identify settlement status, detect exceptions/discrepancies, and explain root causes in clear English.

---

## 🌟 Key Features & Problem Solved

### The Problem
When merchant support teams are asked *"Why wasn't my settlement processed?"*, they typically must manually query and correlate:
1. Payment Gateway logs
2. Bank Settlement files / Clearing reports
3. Internal Ledger entries

This manual process is slow, error-prone, and inconsistent.

### The Solution
The **Settlement Q&A Agent** automates multi-system correlation and deterministic status resolution while leveraging LLMs strictly as an **explanation layer**.

- 🎯 **Deterministic Fact Engine**: Python rules & reconciliation algorithms evaluate payment state, amount matches, timestamp sequences, and currency consistency before any LLM call.
- 🛡️ **Guaranteed Anti-Hallucination**: The LLM is provided only structured *Verified Facts*. It is strictly constrained from inventing missing records, guessing bank reasons, or turning assumptions into facts.
- ⚡ **Demo Mode Resilience**: Works out of the box without needing an external API key (`LLM_PROVIDER=demo`). Supports Google Gemini API and Groq API.
- 📊 **Interactive Support Dashboard**: Real-time stats, multi-system trace visualization, interactive timeline, source record viewer, and pre-built scenario tests.

---

## 🏗️ Architecture & Source of Truth Flow

```
[ USER / SUPPORT AGENT ]
           │
           ▼
[ FRONTEND Dashboard (React + Vite + Tailwind CSS) ]
           │ (POST /api/investigate)
           ▼
[ BACKEND API (FastAPI) ]
           │
           ├──► [ Gateway CSV ]
           ├──► [ Bank Settlements CSV ]
           └──► [ Internal Ledger CSV ]
                   │
                   ▼
[ Deterministic Tracing & Exception Engine ]
  • Correlates records by transaction ID
  • Detects missing records & amount/currency mismatches
  • Calculates investigation confidence level
                   │
                   ▼
            [ Verified Facts ]
                   │
                   ▼
     [ LLM Abstraction Layer ]
  (Gemini API / Groq API / Demo Mode)
                   │
                   ▼
      [ Plain-English Explanation ]
                   │
                   ▼
  [ Consolidated Dashboard Response ]
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.11+
- **Node.js**: 18+
- **npm** or **yarn**

---

### Step 1: Clone & Configure Environment

```bash
cd settlement-support-agent
cp .env.example backend/.env
```

Default `.env` configuration (Demo Mode, no API keys required):
```env
LLM_PROVIDER=demo
GEMINI_API_KEY=
GROQ_API_KEY=
BACKEND_URL=http://localhost:8000
```

---

### Step 2: Start the Backend Server

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS / Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API will be running at [http://localhost:8000](http://localhost:8000). Interactive Swagger docs available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Step 3: Start the Frontend Dashboard

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```
Frontend app will be running at [http://localhost:5173](http://localhost:5173).

---

## 🐳 Optional Docker Setup

Run both Backend and Frontend in containerized mode:

```bash
docker compose up --build
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8000](http://localhost:8000)

---

## 🧪 Running Automated Tests

The test suite validates deterministic state rules, exception detection, API endpoints, and correlation logic without requiring any external LLM connection:

```bash
cd backend
pytest app/tests/ -v
```

Expected Output:
```text
======================== 46 passed in 1.90s ========================
```

---

## 📊 Demo Transactions & Test Scenarios

Use the **"Try Demo Scenarios"** toolbar on the dashboard to test different fintech lifecycle cases:

| Scenario | Transaction ID | Settlement State | Key Demonstration |
| :--- | :--- | :--- | :--- |
| **Case 1: Full Success** | `TXN100001` | `SETTLED` | Gateway (Success), Bank (Settled), Ledger (Posted). |
| **Case 2: Bank Delay** | `TXN100042` | `DELAYED` | Gateway (Success), Bank (Pending: `BANK_PROCESSING_DELAY`), Ledger (Posted). |
| **Case 3: Bank Failure** | `TXN100010` | `SETTLEMENT_FAILED` | Gateway (Success), Bank (Failed: `INVALID_BANK_ACCOUNT`). |
| **Case 4: Gateway Failure** | `TXN100015` | `PAYMENT_FAILED` | Gateway (Failed), Bank & Ledger Not Initiated/Missing. |
| **Case 5: Ledger Missing** | `TXN100005` | `LEDGER_MISMATCH` | Gateway (Success), Bank (Settled), Ledger entry missing. |
| **Case 6: Bank Record Missing** | `TXN100006` | `UNKNOWN` | Gateway (Success), Ledger (Posted), Bank record missing. **AI explicitly states status cannot be confirmed rather than guessing bank rejection.** |
| **Case 7: Amount Mismatch** | `TXN100007` | `DATA_MISMATCH` | Gateway (₹5,000) vs Bank (₹4,500). High-severity exception flagged. |
| **Case 8: Ledger Amount Mismatch** | `TXN100008` | `DATA_MISMATCH` | Gateway (₹5,000) vs Ledger (₹4,500). Ledger amount mismatch flagged. |
| **Case 9: Multiple Exceptions** | `TXN100009` | `DELAYED` | Bank pending + missing ledger record + currency mismatch. |
| **Case 10: Unknown ID** | `TXN999999` | `NOT_FOUND` | Handled gracefully with user notification. |

---

## 🔌 API Endpoints Reference

### 1. Healthcheck
- **`GET /health`**
- **Response**: `{"status": "ok", "timestamp": "...", "data_records": {"gateway": 105, "bank": 105, "ledger": 105}}`

### 2. Investigate Transaction
- **`POST /api/investigate`**
- **Payload**: `{"transaction_id": "TXN100042"}`
- **Response**:
```json
{
  "transaction_id": "TXN100042",
  "investigation": {
    "final_status": "DELAYED",
    "root_cause": "Bank processing delay",
    "confidence": "HIGH",
    "exceptions": [
      {
        "code": "BANK_PENDING",
        "severity": "MEDIUM",
        "message": "Bank settlement is pending processing (Reason: BANK_PROCESSING_DELAY).",
        "impact": "Merchant settlement is delayed until bank processing completes."
      }
    ],
    "verified_facts": { ... }
  },
  "explanation": {
    "summary": "The payment of ₹2,500.00 was successfully processed by the payment gateway...",
    "root_cause_explanation": "The bank settlement is currently pending due to: BANK_PROCESSING_DELAY.",
    "recommended_action": "Monitor bank settlement feed. If settlement remains pending beyond 48 hours, escalate to bank support.",
    "customer_friendly_explanation": "Your payment of ₹2,500.00 was successfully charged and logged...",
    "uncertainties": [],
    "is_demo_explanation": true
  }
}
```

### 3. Dashboard Statistics
- **`GET /api/stats`**
- **Response**: Summary breakdown of `total_transactions`, `settled`, `delayed`, `failed`, `mismatched`, `unknown`.

### 4. Transactions List & Filter
- **`GET /api/transactions?date=2026-09-04&status=DELAYED`**
- Returns list of matching transactions with correlated basic info.

---

## 🛡️ Anti-Hallucination & AI Safety Design

1. **Hierarchy of Truth**:
   - **Layer 1**: Synthetic CSV Data Sources
   - **Layer 2**: Python Deterministic Correlation & Rules Engine
   - **Layer 3**: Immutable `Verified Facts` Object
   - **Layer 4**: LLM Explanation Generator

2. **System Prompt Guardrails**:
   - Explicit prohibition against generating dates, amounts, or reasons not provided in verified facts.
   - Required acknowledgment when a system record is missing instead of inventing failure causes.
   - Recommended next actions prioritized according to detected exception severity.

---

## 📜 License
MIT License. Built for Fintech Support Hackathons.
