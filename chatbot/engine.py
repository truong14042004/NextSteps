"""
RAG Engine
===========
Orchestrates the full Retrieve → Augment → Generate pipeline.

Flow:
  1. Embed the user question with Gemini
  2. Retrieve top-K relevant chunks from ChromaDB
  3. Build a grounded prompt with retrieved context + conversation history
  4. Call Gemini LLM and stream/return the answer
  5. Return answer + source citations

This module has zero knowledge of FastAPI, HTTP, or the CV screening app.
"""

import logging
from typing import AsyncGenerator, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document

from chatbot.config import (
    GEMINI_API_KEY,
    GEMINI_LLM_MODEL,
    RETRIEVAL_TOP_K,
    RETRIEVAL_SCORE_THRESHOLD,
)
from chatbot.vectorstore.store import VectorStoreManager
from chatbot.utils.prompt_builder import build_rag_prompt, build_no_context_prompt
from chatbot.utils.session_memory import SessionMemoryManager
from chatbot.models.schemas import SourceDocument, ChatResponse, ChatMessage

logger = logging.getLogger(__name__)

# Suggested follow-up questions by category
_FOLLOWUP_BY_CATEGORY: dict[str, list[str]] = {
    "faq": [
        "How do I get started?",
        "What file formats do you accept?",
        "How long does CV screening take?",
    ],
    "services": [
        "What is included in each service tier?",
        "Do you offer custom integrations?",
        "Can I trial the service?",
    ],
    "pricing": [
        "Is there a free trial available?",
        "What payment methods do you accept?",
        "Are there discounts for volume screening?",
    ],
    "policies": [
        "How is my data protected?",
        "What is your refund policy?",
        "How do I request data deletion?",
    ],
}


class RAGEngine:
    """
    The core Retrieval-Augmented Generation engine.

    Usage:
        engine = RAGEngine(vector_store_manager, session_memory_manager)
        response = await engine.chat(session_id="s1", message="What's the pricing?")
    """

    def __init__(
        self,
        vector_store: VectorStoreManager,
        memory: SessionMemoryManager,
        llm_model: str = GEMINI_LLM_MODEL,
        api_key: str = GEMINI_API_KEY,
        top_k: int = RETRIEVAL_TOP_K,
        score_threshold: float = RETRIEVAL_SCORE_THRESHOLD,
    ):
        self._vector_store = vector_store
        self._memory = memory
        self._top_k = top_k
        self._score_threshold = score_threshold

        # Gemini LLM via LangChain
        self._llm = ChatGoogleGenerativeAI(
            model=llm_model,
            google_api_key=api_key,
            temperature=0.2,          # low temperature → factual, less creative
            max_output_tokens=1024,
        )

    # ─── Public Interface ─────────────────────────────────────────────────────

    async def chat(
        self,
        session_id: str,
        message: str,
        client_history: Optional[list[ChatMessage]] = None,
    ) -> ChatResponse:
        """
        Process a user message and return a grounded ChatResponse.

        Args:
            session_id: Unique session identifier.
            message: The user's current question.
            client_history: Optional history sent by the client (takes precedence
                            over server-side memory if provided).
        """
        # ── 1. Build conversation context ─────────────────────────────────────
        if client_history:
            history_text = "\n".join(
                f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
                for m in client_history
            )
        else:
            history_text = self._memory.get_history_as_text(session_id)

        # ── 2. Retrieve relevant chunks ───────────────────────────────────────
        retrieved = self._vector_store.similarity_search(
            query=message,
            top_k=self._top_k,
            score_threshold=self._score_threshold,
        )
        logger.info(
            f"[{session_id}] Retrieved {len(retrieved)} chunks for: '{message[:60]}'"
        )

        # ── 3. Build prompt ───────────────────────────────────────────────────
        if retrieved:
            prompt = build_rag_prompt(message, retrieved, history_text)
        else:
            prompt = build_no_context_prompt(message, history_text)

        # ── 4. Generate answer ────────────────────────────────────────────────
        answer = await self._generate(prompt)

        # ── 5. Persist to server-side memory ─────────────────────────────────
        self._memory.add_turn(session_id, message, answer)

        # ── 6. Build source citations ─────────────────────────────────────────
        sources = self._build_sources(retrieved)

        # ── 7. Generate follow-up suggestions ────────────────────────────────
        follow_ups = self._get_follow_ups(retrieved)

        return ChatResponse(
            session_id=session_id,
            answer=answer,
            sources=sources,
            has_sources=bool(sources),
            follow_up_suggestions=follow_ups,
        )

    async def chat_stream(
        self,
        session_id: str,
        message: str,
        client_history: Optional[list[ChatMessage]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming version — yields answer tokens as they arrive from Gemini.
        The full answer is stored in memory after the stream completes.
        """
        if client_history:
            history_text = "\n".join(
                f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
                for m in client_history
            )
        else:
            history_text = self._memory.get_history_as_text(session_id)

        retrieved = self._vector_store.similarity_search(
            query=message,
            top_k=self._top_k,
            score_threshold=self._score_threshold,
        )

        prompt = (
            build_rag_prompt(message, retrieved, history_text)
            if retrieved
            else build_no_context_prompt(message, history_text)
        )

        full_answer = ""
        async for chunk in self._llm.astream([HumanMessage(content=prompt)]):
            token = chunk.content
            full_answer += token
            yield token

        # Persist the complete answer after streaming
        self._memory.add_turn(session_id, message, full_answer)

    # ─── Private Helpers ──────────────────────────────────────────────────────

    async def _generate(self, prompt: str) -> str:
        """Call Gemini and return the complete text response."""
        try:
            response = await self._llm.ainvoke([HumanMessage(content=prompt)])
            return response.content.strip()
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            return (
                "I'm sorry, I'm experiencing technical difficulties right now. "
                "Please try again shortly or contact our support team."
            )

    def _build_sources(
        self, retrieved: list[tuple[Document, float]]
    ) -> list[SourceDocument]:
        """Convert retrieved chunks into SourceDocument citation objects."""
        sources = []
        seen: set[str] = set()
        for doc, score in retrieved:
            meta = doc.metadata
            key = f"{meta.get('filename')}:{meta.get('chunk_index')}"
            if key in seen:
                continue
            seen.add(key)
            # Truncate excerpt to 200 chars for the response payload
            excerpt = doc.page_content.strip()[:200]
            if len(doc.page_content) > 200:
                excerpt += "…"
            sources.append(
                SourceDocument(
                    category=meta.get("category", "unknown"),
                    filename=meta.get("filename", "unknown"),
                    chunk_index=meta.get("chunk_index", 0),
                    relevance_score=round(score, 4),
                    excerpt=excerpt,
                )
            )
        return sources

    def _get_follow_ups(
        self, retrieved: list[tuple[Document, float]]
    ) -> list[str]:
        """Return up to 3 follow-up suggestions based on the top retrieved category."""
        if not retrieved:
            return []
        top_category = retrieved[0][0].metadata.get("category", "")
        suggestions = _FOLLOWUP_BY_CATEGORY.get(top_category, [])
        return suggestions[:3]
