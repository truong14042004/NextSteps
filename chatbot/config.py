"""
Chatbot Configuration Module
Loads all environment variables and exposes typed settings.
Completely isolated from the existing CV screening application.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the chatbot root (or project root)
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# ─── Gemini ───────────────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_LLM_MODEL: str = os.getenv("GEMINI_LLM_MODEL", "gemini-1.5-flash")
GEMINI_EMBEDDING_MODEL: str = os.getenv(
    "GEMINI_EMBEDDING_MODEL", "models/text-embedding-004"
)

# ─── Vector Store ─────────────────────────────────────────────────────────────
CHROMA_PERSIST_DIR: str = os.getenv(
    "CHROMA_PERSIST_DIR",
    str(Path(__file__).parent / "vectorstore" / "chroma_db"),
)
CHROMA_COLLECTION_NAME: str = os.getenv("CHROMA_COLLECTION_NAME", "cv_screening_kb")

# ─── Document Ingestion ───────────────────────────────────────────────────────
DOCUMENTS_DIR: str = os.getenv(
    "DOCUMENTS_DIR",
    str(Path(__file__).parent / "documents"),
)
CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))

# ─── RAG Retrieval ────────────────────────────────────────────────────────────
RETRIEVAL_TOP_K: int = int(os.getenv("RETRIEVAL_TOP_K", "5"))
RETRIEVAL_SCORE_THRESHOLD: float = float(os.getenv("RETRIEVAL_SCORE_THRESHOLD", "0.3"))

# ─── Conversation Memory ──────────────────────────────────────────────────────
MAX_HISTORY_TURNS: int = int(os.getenv("MAX_HISTORY_TURNS", "10"))

# ─── API Server ───────────────────────────────────────────────────────────────
CHATBOT_HOST: str = os.getenv("CHATBOT_HOST", "0.0.0.0")
CHATBOT_PORT: int = int(os.getenv("CHATBOT_PORT", "8001"))
CHATBOT_CORS_ORIGINS: list[str] = os.getenv(
    "CHATBOT_CORS_ORIGINS", "http://localhost:3000,http://localhost:8000"
).split(",")

# ─── Supported Document Categories ───────────────────────────────────────────
DOCUMENT_CATEGORIES: list[str] = ["faq", "services", "pricing", "policies"]

# ─── Validation ───────────────────────────────────────────────────────────────
def validate_config() -> None:
    """Raise early if critical env vars are missing."""
    if not GEMINI_API_KEY:
        raise EnvironmentError(
            "GEMINI_API_KEY is not set. Please configure your .env file."
        )
