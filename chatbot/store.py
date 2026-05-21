"""
Vector Store Manager
=====================
Wraps ChromaDB + Gemini embeddings.
Provides upsert, retrieval, and collection-management operations.

Completely decoupled from the CV screening application.
"""

import logging
from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

from chatbot.config import (
    GEMINI_API_KEY,
    GEMINI_EMBEDDING_MODEL,
    CHROMA_PERSIST_DIR,
    CHROMA_COLLECTION_NAME,
    RETRIEVAL_TOP_K,
    RETRIEVAL_SCORE_THRESHOLD,
)

logger = logging.getLogger(__name__)


class VectorStoreManager:
    """
    Manages the ChromaDB vector store lifecycle:
      - Initialise / connect to a persistent collection
      - Add documents (with duplicate-safe upsert via chunk IDs)
      - Semantic similarity search with relevance scores
      - Collection stats and reset

    Usage:
        vsm = VectorStoreManager()
        vsm.add_documents(chunks)
        results = vsm.similarity_search("What is the pricing?")
    """

    def __init__(
        self,
        persist_dir: Optional[str] = None,
        collection_name: Optional[str] = None,
        embedding_model: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self._persist_dir = persist_dir or CHROMA_PERSIST_DIR
        self._collection_name = collection_name or CHROMA_COLLECTION_NAME
        self._api_key = api_key or GEMINI_API_KEY

        # Gemini embedding function via LangChain
        self._embeddings = GoogleGenerativeAIEmbeddings(
            model=embedding_model or GEMINI_EMBEDDING_MODEL,
            google_api_key=self._api_key,
        )

        # Persistent ChromaDB client (data survives restarts)
        self._chroma_client = chromadb.PersistentClient(
            path=self._persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

        # LangChain Chroma wrapper (used for search)
        self._vectorstore: Optional[Chroma] = None
        self._init_vectorstore()

    # ─── Initialisation ───────────────────────────────────────────────────────

    def _init_vectorstore(self) -> None:
        """Connect to (or create) the persistent Chroma collection."""
        try:
            self._vectorstore = Chroma(
                client=self._chroma_client,
                collection_name=self._collection_name,
                embedding_function=self._embeddings,
            )
            count = self._vectorstore._collection.count()
            logger.info(
                f"VectorStore ready: collection='{self._collection_name}', "
                f"documents={count}"
            )
        except Exception as e:
            logger.error(f"Failed to initialise vector store: {e}")
            raise

    # ─── Document Management ──────────────────────────────────────────────────

    def add_documents(self, documents: list[Document]) -> int:
        """
        Add (or update) chunked documents in the vector store.

        IDs are derived from filename + chunk_index to prevent duplicates
        when re-ingesting the same file.

        Returns the number of documents added.
        """
        if not documents:
            logger.warning("add_documents called with empty list — nothing to do.")
            return 0

        # Build stable, deterministic IDs
        ids = [
            f"{doc.metadata.get('category', 'unknown')}"
            f"_{doc.metadata.get('filename', 'file')}"
            f"_{doc.metadata.get('chunk_index', i)}"
            for i, doc in enumerate(documents)
        ]

        # Sanitise: IDs must be unique strings without special characters
        ids = [id_.replace(" ", "_").replace("/", "-") for id_ in ids]

        self._vectorstore.add_documents(documents=documents, ids=ids)
        logger.info(f"Added {len(documents)} chunks to the vector store.")
        return len(documents)

    def reset_collection(self) -> None:
        """Delete and recreate the collection — use before full re-ingestion."""
        logger.warning(
            f"Resetting collection '{self._collection_name}'. "
            "All existing vectors will be deleted."
        )
        self._chroma_client.delete_collection(self._collection_name)
        self._init_vectorstore()

    def reset_category(self, category: str) -> None:
        """Remove all chunks belonging to a specific document category."""
        collection = self._chroma_client.get_collection(self._collection_name)
        results = collection.get(where={"category": category})
        if results["ids"]:
            collection.delete(ids=results["ids"])
            logger.info(
                f"Deleted {len(results['ids'])} chunks for category '{category}'"
            )

    # ─── Retrieval ────────────────────────────────────────────────────────────

    def similarity_search(
        self,
        query: str,
        top_k: int = RETRIEVAL_TOP_K,
        score_threshold: float = RETRIEVAL_SCORE_THRESHOLD,
        filter_category: Optional[str] = None,
    ) -> list[tuple[Document, float]]:
        """
        Retrieve the most relevant chunks for a query.

        Returns a list of (Document, relevance_score) pairs.
        Only results above score_threshold are returned.
        Optionally filter by document category.
        """
        search_kwargs: dict = {"k": top_k}
        if filter_category:
            search_kwargs["filter"] = {"category": filter_category}

        try:
            results = self._vectorstore.similarity_search_with_relevance_scores(
                query=query, **search_kwargs
            )
        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            return []

        # Filter by minimum relevance score
        filtered = [
            (doc, score) for doc, score in results if score >= score_threshold
        ]

        logger.debug(
            f"Query: '{query[:60]}...' → "
            f"{len(results)} candidates, {len(filtered)} above threshold={score_threshold}"
        )
        return filtered

    # ─── Stats ────────────────────────────────────────────────────────────────

    def document_count(self) -> int:
        """Return total number of chunks stored."""
        try:
            return self._vectorstore._collection.count()
        except Exception:
            return 0

    def is_ready(self) -> bool:
        """Return True if the vector store has at least one document."""
        return self.document_count() > 0
