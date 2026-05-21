"""
Chatbot FastAPI Application
============================
Standalone FastAPI service that exposes the RAG chatbot API.

Run with:
    uvicorn chatbot.main:app --host 0.0.0.0 --port 8001 --reload

This application is completely independent of the existing CV screening
application. It can be deployed as a sidecar, separate container, or
mounted as a sub-application on the existing FastAPI app (see README).
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from chatbot.config import (
    CHATBOT_CORS_ORIGINS,
    validate_config,
)
from chatbot.api.chat import router as chat_router
from chatbot.api.ingestion import router as ingestion_router

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ─── Lifespan (startup / shutdown hooks) ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate config and warm up singletons on startup."""
    logger.info("=== CV Screening Chatbot starting up ===")
    try:
        validate_config()
        # Import here to trigger @lru_cache singleton creation
        from chatbot.api.dependencies import get_rag_engine
        get_rag_engine()  # warm-up: initialise VectorStore + RAGEngine
        logger.info("=== Chatbot ready ===")
    except EnvironmentError as e:
        logger.critical(f"Configuration error: {e}")
        sys.exit(1)

    yield  # Application runs here

    logger.info("=== Chatbot shutting down ===")


# ─── FastAPI Application ───────────────────────────────────────────────────────
app = FastAPI(
    title="CV Screening Chatbot API",
    description=(
        "RAG-powered chatbot for the CV screening platform. "
        "Answers questions about services, pricing, policies, and FAQs."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CHATBOT_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(chat_router)
app.include_router(ingestion_router)


# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/", tags=["root"])
async def root() -> dict:
    return {
        "service": "CV Screening Chatbot",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/chat/health",
    }
