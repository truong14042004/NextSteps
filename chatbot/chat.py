"""
Chat API Router
================
Provides REST endpoints for the chatbot:
  POST /api/chat/         — standard (non-streaming) chat
  POST /api/chat/stream   — SSE streaming chat
  DELETE /api/chat/session/{session_id} — clear a session
  GET  /api/chat/health   — health check

All routes are prefixed with /api/chat and mounted on the main app.
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from chatbot.api.dependencies import get_rag_engine, get_vector_store, get_session_memory
from chatbot.models.schemas import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
)
from chatbot.rag.engine import RAGEngine
from chatbot.vectorstore.store import VectorStoreManager
from chatbot.utils.session_memory import SessionMemoryManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chatbot"])


# ─── Standard Chat Endpoint ───────────────────────────────────────────────────

@router.post(
    "/",
    response_model=ChatResponse,
    summary="Send a message to the chatbot",
    description=(
        "Send a user message. The chatbot retrieves relevant knowledge-base "
        "chunks and returns a grounded answer with source citations."
    ),
)
async def chat(
    request: ChatRequest,
    engine: RAGEngine = Depends(get_rag_engine),
) -> ChatResponse:
    """Non-streaming chat endpoint."""
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message cannot be empty.",
        )

    logger.info(
        f"Chat request | session={request.session_id} | "
        f"message='{request.message[:80]}'"
    )

    try:
        response = await engine.chat(
            session_id=request.session_id,
            message=request.message,
            client_history=request.history,
        )
        return response
    except Exception as e:
        logger.exception(f"Chat error for session {request.session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your message. Please try again.",
        )


# ─── Streaming Chat Endpoint ──────────────────────────────────────────────────

@router.post(
    "/stream",
    summary="Stream a chatbot response via SSE",
    description=(
        "Streaming version of the chat endpoint. Tokens are streamed as "
        "Server-Sent Events (SSE). Use EventSource on the client side."
    ),
)
async def chat_stream(
    request: ChatRequest,
    engine: RAGEngine = Depends(get_rag_engine),
) -> StreamingResponse:
    """SSE streaming chat endpoint."""

    async def event_generator():
        """Yields SSE-formatted tokens from Gemini."""
        try:
            async for token in engine.chat_stream(
                session_id=request.session_id,
                message=request.message,
                client_history=request.history,
            ):
                # Escape newlines in the token for SSE format
                safe_token = token.replace("\n", "\\n")
                yield f"data: {json.dumps({'token': safe_token})}\n\n"
        except Exception as e:
            logger.exception(f"Stream error for session {request.session_id}: {e}")
            yield f"data: {json.dumps({'error': 'Stream failed'})}\n\n"
        finally:
            # Signal end-of-stream
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disable nginx buffering
        },
    )


# ─── Session Management ───────────────────────────────────────────────────────

@router.delete(
    "/session/{session_id}",
    summary="Clear conversation history for a session",
)
async def clear_session(
    session_id: str,
    memory: SessionMemoryManager = Depends(get_session_memory),
) -> dict:
    """Clear all conversation history for a given session_id."""
    memory.clear_session(session_id)
    return {"status": "ok", "message": f"Session '{session_id}' cleared."}


# ─── Health Check ─────────────────────────────────────────────────────────────

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Chatbot health check",
)
async def health_check(
    vector_store: VectorStoreManager = Depends(get_vector_store),
) -> HealthResponse:
    """Returns chatbot readiness and vector store stats."""
    return HealthResponse(
        status="ok",
        vectorstore_ready=vector_store.is_ready(),
        document_count=vector_store.document_count(),
    )
