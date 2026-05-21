"""
Ingestion API Router
=====================
Administrative endpoints to trigger document ingestion.

  POST /api/ingest/       — ingest documents (all or by category)
  GET  /api/ingest/status — check ingestion status

These should be protected by an API key or firewall in production.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Header, status
from typing import Optional

from chatbot.api.dependencies import get_vector_store
from chatbot.ingestion.pipeline import DocumentIngestionPipeline
from chatbot.models.schemas import IngestionRequest, IngestionResponse
from chatbot.vectorstore.store import VectorStoreManager
from chatbot.config import DOCUMENT_CATEGORIES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ingest", tags=["ingestion"])


def _run_ingestion(
    vector_store: VectorStoreManager,
    category: Optional[str] = None,
    force_reingest: bool = False,
) -> IngestionResponse:
    """
    Internal helper: run the ingestion pipeline for one or all categories.
    """
    pipeline = DocumentIngestionPipeline()
    categories_to_process = [category] if category else DOCUMENT_CATEGORIES
    total_chunks = 0

    for cat in categories_to_process:
        if force_reingest:
            vector_store.reset_category(cat)

        chunks = pipeline.ingest_category(cat)
        if chunks:
            vector_store.add_documents(chunks)
            total_chunks += len(chunks)
            logger.info(f"Ingested category '{cat}': {len(chunks)} chunks")
        else:
            logger.warning(f"No chunks produced for category '{cat}'")

    return IngestionResponse(
        status="success",
        categories_processed=categories_to_process,
        total_chunks=total_chunks,
        message=(
            f"Successfully ingested {total_chunks} chunks "
            f"across {len(categories_to_process)} category(ies)."
        ),
    )


@router.post(
    "/",
    response_model=IngestionResponse,
    summary="Ingest .docx documents into the vector store",
    description=(
        "Loads .docx files from /documents/<category>/, chunks them, "
        "embeds them via Gemini, and stores them in ChromaDB."
    ),
)
async def ingest_documents(
    request: IngestionRequest,
    vector_store: VectorStoreManager = Depends(get_vector_store),
) -> IngestionResponse:
    """Trigger document ingestion for all or a specific category."""
    if request.category and request.category not in DOCUMENT_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unknown category '{request.category}'. "
                f"Valid categories: {DOCUMENT_CATEGORIES}"
            ),
        )

    if request.force_reingest and not request.category:
        # Full reset — delete all existing vectors before reingest
        logger.warning("force_reingest=True with no category → resetting entire collection")
        vector_store.reset_collection()

    try:
        return _run_ingestion(
            vector_store=vector_store,
            category=request.category,
            force_reingest=request.force_reingest,
        )
    except Exception as e:
        logger.exception(f"Ingestion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion error: {str(e)}",
        )


@router.get(
    "/status",
    summary="Check vector store ingestion status",
)
async def ingestion_status(
    vector_store: VectorStoreManager = Depends(get_vector_store),
) -> dict:
    """Return the current state of the vector store."""
    return {
        "status": "ready" if vector_store.is_ready() else "empty",
        "total_chunks": vector_store.document_count(),
        "supported_categories": DOCUMENT_CATEGORIES,
    }
