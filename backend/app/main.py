"""
Settlement Support Agent - FastAPI Application Entry Point

Initializes the FastAPI app, loads data, configures CORS,
and registers routes.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router, init_services
from app.services.data_service import DataService, DataValidationError
from app.services.llm_service import LLMService
from app.services.explanation_service import ExplanationService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize services on startup."""
    logger.info("=" * 60)
    logger.info("Settlement Support Agent - Starting up")
    logger.info("=" * 60)

    # Load data
    data_service = DataService()
    try:
        warnings = data_service.load_data()
        if warnings:
            logger.warning("Data validation warnings:")
            for w in warnings:
                logger.warning("  - %s", w)
        logger.info("Data loaded successfully")
    except DataValidationError as e:
        logger.error("FATAL: Data validation failed: %s", e)
        raise

    # Initialize LLM service
    llm_service = LLMService()
    logger.info("LLM provider: %s", llm_service.provider_name)
    if llm_service.is_demo_mode:
        logger.info("Running in DEMO MODE (no LLM API key configured)")

    # Initialize explanation service
    explanation_service = ExplanationService(data_service, llm_service)

    # Inject services into routes
    init_services(data_service, llm_service, explanation_service)

    logger.info("=" * 60)
    logger.info("Settlement Support Agent - Ready!")
    logger.info("API docs: http://localhost:8000/docs")
    logger.info("=" * 60)

    yield  # Application runs

    logger.info("Settlement Support Agent - Shutting down")


# ─── Create FastAPI App ──────────────────────────────────────────────────────

app = FastAPI(
    title="Settlement Support Agent",
    description=(
        "AI-powered fintech settlement support agent that traces "
        "transactions across payment gateway, bank settlement, "
        "and internal ledger systems."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS Configuration ─────────────────────────────────────────────────────

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [o.strip() for o in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routes ────────────────────────────────────────────────────────

app.include_router(router)
