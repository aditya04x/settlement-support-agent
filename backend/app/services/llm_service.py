"""
LLM Service - Provider Abstraction Layer

Implements a clean abstraction over LLM providers (Gemini, Groq, Demo).
The LLM receives ONLY verified facts and generates explanations.
It never determines facts or settlement status.
"""

from __future__ import annotations

import json
import logging
import os
from abc import ABC, abstractmethod
from typing import Optional

from app.models.schemas import VerifiedFacts, LLMExplanation

logger = logging.getLogger(__name__)

# ─── System Prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a fintech settlement support assistant.

You will receive VERIFIED transaction investigation results.

Your job is to explain those results clearly to a support agent.

STRICT RULES:

1. Use ONLY the supplied verified facts.
2. Never invent a bank response, failure reason, timestamp, transaction, or settlement event.
3. If a record is missing, explicitly say it is missing.
4. If the cause cannot be determined, say that it cannot be determined from the available records.
5. Never turn an assumption into a fact.
6. Do not contradict the deterministic final_status.
7. Explain the root cause in simple English.
8. Mention relevant exceptions.
9. Provide a concise recommended next action.
10. Clearly distinguish facts from uncertainty.

Return ONLY valid JSON with this exact structure:

{
  "summary": "A brief 1-2 sentence summary of the transaction status",
  "root_cause_explanation": "Plain English explanation of why this happened",
  "recommended_action": "What the support agent should do next",
  "customer_friendly_explanation": "An explanation suitable for telling the customer",
  "uncertainties": ["List of things that cannot be confirmed from available records"]
}

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON."""


# ─── Base Provider ────────────────────────────────────────────────────────────

class LLMProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def generate_explanation(
        self, verified_facts: VerifiedFacts
    ) -> LLMExplanation:
        """Generate a plain-English explanation from verified facts."""
        pass

    def _build_user_prompt(self, facts: VerifiedFacts) -> str:
        """Build the user message containing verified facts."""
        facts_dict = facts.model_dump()
        # Remove raw records to limit LLM input
        for system in ("gateway", "bank", "ledger"):
            if system in facts_dict and "raw_record" in facts_dict[system]:
                del facts_dict[system]["raw_record"]

        return (
            "Analyze the following verified transaction investigation results "
            "and provide a clear explanation.\n\n"
            f"VERIFIED FACTS:\n{json.dumps(facts_dict, indent=2, default=str)}"
        )

    def _parse_llm_response(self, response_text: str) -> LLMExplanation:
        """Parse LLM JSON response into LLMExplanation."""
        try:
            # Try to extract JSON from the response
            text = response_text.strip()
            # Handle markdown code blocks
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1])
            data = json.loads(text)
            return LLMExplanation(
                summary=data.get("summary", "No summary provided."),
                root_cause_explanation=data.get("root_cause_explanation", ""),
                recommended_action=data.get("recommended_action", ""),
                customer_friendly_explanation=data.get("customer_friendly_explanation", ""),
                uncertainties=data.get("uncertainties", []),
                is_demo_mode=False,
            )
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.warning("Failed to parse LLM response: %s", e)
            # Return the raw text as summary
            return LLMExplanation(
                summary=response_text[:500],
                root_cause_explanation="LLM response could not be parsed into structured format.",
                recommended_action="Review the raw investigation data.",
                customer_friendly_explanation=response_text[:300],
                uncertainties=["LLM response format was unexpected"],
                is_demo_mode=False,
            )


# ─── Gemini Provider ─────────────────────────────────────────────────────────

class GeminiProvider(LLMProvider):
    """Google Gemini API provider."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._client = genai.GenerativeModel(
                "gemini-2.0-flash",
                system_instruction=SYSTEM_PROMPT,
            )
        return self._client

    async def generate_explanation(
        self, verified_facts: VerifiedFacts
    ) -> LLMExplanation:
        try:
            model = self._get_client()
            prompt = self._build_user_prompt(verified_facts)
            response = model.generate_content(prompt)
            return self._parse_llm_response(response.text)
        except Exception as e:
            logger.error("Gemini API error: %s", e)
            raise LLMError(f"Gemini API error: {e}") from e


# ─── Groq Provider ───────────────────────────────────────────────────────────

class GroqProvider(LLMProvider):
    """Groq API provider."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            from groq import Groq
            self._client = Groq(api_key=self.api_key)
        return self._client

    async def generate_explanation(
        self, verified_facts: VerifiedFacts
    ) -> LLMExplanation:
        try:
            client = self._get_client()
            prompt = self._build_user_prompt(verified_facts)
            response = client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=1024,
            )
            return self._parse_llm_response(response.choices[0].message.content)
        except Exception as e:
            logger.error("Groq API error: %s", e)
            raise LLMError(f"Groq API error: {e}") from e


# ─── Demo Provider ───────────────────────────────────────────────────────────

class DemoProvider(LLMProvider):
    """
    Deterministic fallback provider for demo mode.
    Generates template-based explanations without any API calls.
    """

    TEMPLATES = {
        "SETTLED": {
            "summary": (
                "The payment was successfully processed by the payment gateway, "
                "the bank settlement completed, and the transaction was posted "
                "to the internal ledger."
            ),
            "root_cause_explanation": "All systems confirm successful processing.",
            "recommended_action": "No action required. Transaction is fully settled.",
            "customer_friendly_explanation": (
                "Your payment has been successfully processed and settled. "
                "The funds have been transferred as expected."
            ),
        },
        "DELAYED": {
            "summary": (
                "The payment was successfully processed at the gateway, "
                "but the bank settlement is still pending."
            ),
            "root_cause_explanation": (
                "The payment gateway processed the transaction successfully, "
                "but the bank settlement has not yet completed. This is typically "
                "due to bank processing delays."
            ),
            "recommended_action": (
                "Monitor the settlement status. If it remains pending beyond "
                "the expected processing window (typically 24-48 hours), "
                "escalate for bank investigation."
            ),
            "customer_friendly_explanation": (
                "Your payment was received and is being processed. Bank settlement "
                "is in progress and should complete within the standard processing window."
            ),
        },
        "PAYMENT_FAILED": {
            "summary": "The payment failed at the gateway level.",
            "root_cause_explanation": (
                "The payment could not be processed by the payment gateway. "
                "Since the payment itself failed, bank settlement was not initiated."
            ),
            "recommended_action": (
                "Review the failure reason from the gateway. The customer may "
                "need to retry the payment with a different payment method or "
                "resolve the issue indicated by the failure code."
            ),
            "customer_friendly_explanation": (
                "Your payment could not be processed. Please check your payment "
                "details and try again, or use an alternative payment method."
            ),
        },
        "SETTLEMENT_FAILED": {
            "summary": (
                "The payment was processed successfully, but the bank "
                "settlement failed."
            ),
            "root_cause_explanation": (
                "The payment gateway processed the transaction, but the bank "
                "rejected or failed to process the settlement."
            ),
            "recommended_action": (
                "Review the bank failure reason. Escalate to the banking "
                "operations team for resolution. A manual settlement or "
                "refund may be required."
            ),
            "customer_friendly_explanation": (
                "Your payment was received but there was an issue with the "
                "bank settlement. Our team is investigating and will resolve "
                "this promptly."
            ),
        },
        "LEDGER_MISMATCH": {
            "summary": (
                "The payment gateway and bank indicate successful settlement, "
                "but the internal ledger entry is missing."
            ),
            "root_cause_explanation": (
                "Gateway and bank records confirm successful processing, "
                "but no corresponding entry was found in the internal ledger. "
                "This may indicate a ledger posting failure or delay."
            ),
            "recommended_action": (
                "Investigate the internal ledger system. A manual ledger "
                "entry may need to be created. Escalate to the finance team."
            ),
            "customer_friendly_explanation": (
                "Your payment has been processed and settled by the bank. "
                "There is an internal recording issue that our team is addressing."
            ),
        },
        "DATA_MISMATCH": {
            "summary": (
                "Discrepancies were detected between the transaction amounts "
                "or currencies across different systems."
            ),
            "root_cause_explanation": (
                "The systems contain conflicting transaction data. The exact "
                "cause of this discrepancy cannot be determined from the "
                "available records alone."
            ),
            "recommended_action": (
                "Escalate to the reconciliation team. Compare the original "
                "amounts across all systems and investigate the source of "
                "the discrepancy."
            ),
            "customer_friendly_explanation": (
                "We have identified a discrepancy in our records for your "
                "transaction. Our team is investigating to ensure everything "
                "is correctly reconciled."
            ),
        },
        "UNKNOWN": {
            "summary": (
                "The settlement status could not be fully determined from "
                "the available records."
            ),
            "root_cause_explanation": (
                "Some records are missing or incomplete, preventing a "
                "definitive determination of the settlement status."
            ),
            "recommended_action": (
                "Review the available records and investigate the missing "
                "data. Manual verification may be required."
            ),
            "customer_friendly_explanation": (
                "We are investigating your transaction status. Our team "
                "will provide an update once the review is complete."
            ),
        },
        "NOT_FOUND": {
            "summary": "No records were found for this transaction.",
            "root_cause_explanation": (
                "The transaction ID was not found in any of the available "
                "systems (gateway, bank, or ledger)."
            ),
            "recommended_action": (
                "Verify the transaction ID is correct. Check if the "
                "transaction was initiated through a different system."
            ),
            "customer_friendly_explanation": (
                "We could not find a record for this transaction. Please "
                "verify the transaction ID and try again."
            ),
        },
        "PAYMENT_PENDING": {
            "summary": "The payment is still being processed at the gateway.",
            "root_cause_explanation": (
                "The payment gateway has not yet completed processing this "
                "transaction."
            ),
            "recommended_action": (
                "Wait for the gateway to complete processing. If it remains "
                "pending beyond normal processing time, investigate the "
                "gateway status."
            ),
            "customer_friendly_explanation": (
                "Your payment is currently being processed. Please allow "
                "a few minutes for it to complete."
            ),
        },
        "PAYMENT_CANCELLED": {
            "summary": "The payment was cancelled.",
            "root_cause_explanation": "The payment was cancelled before completion.",
            "recommended_action": (
                "If the cancellation was unintentional, the customer should "
                "initiate a new payment."
            ),
            "customer_friendly_explanation": (
                "This payment was cancelled. If you did not intend to cancel, "
                "please initiate a new payment."
            ),
        },
    }

    async def generate_explanation(
        self, verified_facts: VerifiedFacts
    ) -> LLMExplanation:
        template = self.TEMPLATES.get(
            verified_facts.final_status,
            self.TEMPLATES["UNKNOWN"]
        )

        # Enhance with specific details
        summary = template["summary"]
        root_cause = template["root_cause_explanation"]

        if verified_facts.root_cause and verified_facts.root_cause != "Transaction fully settled":
            root_cause = f"{verified_facts.root_cause}. {root_cause}"

        uncertainties = []
        for exc in verified_facts.exceptions:
            if exc.severity in ("HIGH", "MEDIUM"):
                uncertainties.append(exc.message)

        return LLMExplanation(
            summary=summary,
            root_cause_explanation=root_cause,
            recommended_action=template["recommended_action"],
            customer_friendly_explanation=template["customer_friendly_explanation"],
            uncertainties=uncertainties,
            is_demo_mode=True,
        )


# ─── Errors ──────────────────────────────────────────────────────────────────

class LLMError(Exception):
    """Raised when an LLM API call fails."""
    pass


# ─── Factory ─────────────────────────────────────────────────────────────────

class LLMService:
    """
    Factory and manager for LLM providers.

    Falls back to DemoProvider if the configured provider fails
    or no API key is available.
    """

    def __init__(self):
        self.provider: LLMProvider = DemoProvider()
        self.provider_name: str = "demo"
        self._initialize_provider()

    def _initialize_provider(self):
        """Initialize the LLM provider based on environment variables."""
        provider_name = os.getenv("LLM_PROVIDER", "demo").lower()

        if provider_name == "gemini":
            api_key = os.getenv("GEMINI_API_KEY", "")
            if api_key:
                self.provider = GeminiProvider(api_key)
                self.provider_name = "gemini"
                logger.info("LLM provider initialized: Gemini")
                return
            logger.warning("GEMINI_API_KEY not set, falling back to demo mode")

        elif provider_name == "groq":
            api_key = os.getenv("GROQ_API_KEY", "")
            if api_key:
                self.provider = GroqProvider(api_key)
                self.provider_name = "groq"
                logger.info("LLM provider initialized: Groq")
                return
            logger.warning("GROQ_API_KEY not set, falling back to demo mode")

        self.provider = DemoProvider()
        self.provider_name = "demo"
        logger.info("LLM provider initialized: Demo (fallback)")

    @property
    def is_demo_mode(self) -> bool:
        return self.provider_name == "demo"

    async def explain(self, verified_facts: VerifiedFacts) -> LLMExplanation:
        """
        Generate an explanation from verified facts.
        Falls back to demo mode if the LLM call fails.
        """
        try:
            return await self.provider.generate_explanation(verified_facts)
        except LLMError as e:
            logger.error("LLM provider failed, falling back to demo: %s", e)
            demo = DemoProvider()
            explanation = await demo.generate_explanation(verified_facts)
            explanation.is_demo_mode = True
            return explanation
        except Exception as e:
            logger.error("Unexpected LLM error, falling back to demo: %s", e)
            demo = DemoProvider()
            explanation = await demo.generate_explanation(verified_facts)
            explanation.is_demo_mode = True
            return explanation
