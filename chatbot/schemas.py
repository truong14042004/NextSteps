"""
Pydantic Models for the Chatbot API.
Defines strict request/response schemas — isolated from CV screening models.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """A single turn in the conversation history."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Incoming chat request payload."""
    session_id: str = Field(
        ...,
        description="Unique session identifier for conversation continuity",
        example="sess_abc123",
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's question or message",
    )
    history: Optional[list[ChatMessage]] = Field(
        default=None,
        description="Previous conversation turns (client-managed history)",
    )


class SourceDocument(BaseModel):
    """A retrieved source chunk used to ground the answer."""
    category: str = Field(..., description="Document category (faq/services/pricing/policies)")
    filename: str = Field(..., description="Source .docx filename")
    chunk_index: int = Field(..., description="Chunk position within the document")
    relevance_score: float = Field(..., description="Semantic similarity score")
    excerpt: str = Field(..., description="Short excerpt from the chunk")


class ChatResponse(BaseModel):
    """Outgoing chat response payload."""
    session_id: str
    answer: str = Field(..., description="The assistant's answer")
    sources: list[SourceDocument] = Field(
        default_factory=list,
        description="Source documents used to generate the answer",
    )
    has_sources: bool = Field(
        ..., description="Whether the answer is grounded in retrieved documents"
    )
    follow_up_suggestions: list[str] = Field(
        default_factory=list,
        description="Optional follow-up questions the user might ask",
    )


class IngestionRequest(BaseModel):
    """Request to trigger document ingestion."""
    category: Optional[str] = Field(
        default=None,
        description="Ingest only this category; None means ingest all",
    )
    force_reingest: bool = Field(
        default=False,
        description="Clear existing vectors before ingesting",
    )


class IngestionResponse(BaseModel):
    """Response after document ingestion."""
    status: str
    categories_processed: list[str]
    total_chunks: int
    message: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    vectorstore_ready: bool
    document_count: int
    version: str = "1.0.0"
