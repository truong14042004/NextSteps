"""
Document Ingestion Pipeline
============================
Loads .docx files from the /documents directory, splits them into chunks,
and stores embeddings in ChromaDB.

Supported categories: faq | services | pricing | policies

This module is completely independent of the CV screening application.
"""

import logging
from pathlib import Path
from typing import Optional

from langchain_community.document_loaders import Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from chatbot.config import (
    DOCUMENTS_DIR,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    DOCUMENT_CATEGORIES,
)

logger = logging.getLogger(__name__)


class DocumentIngestionPipeline:
    """
    Handles loading, splitting, and metadata enrichment of .docx documents.

    Usage:
        pipeline = DocumentIngestionPipeline()
        chunks = pipeline.ingest(category="faq")
    """

    def __init__(
        self,
        documents_dir: Optional[str] = None,
        chunk_size: int = CHUNK_SIZE,
        chunk_overlap: int = CHUNK_OVERLAP,
    ):
        self.documents_dir = Path(documents_dir or DOCUMENTS_DIR)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            # Prefer splitting at paragraph / sentence boundaries
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
            length_function=len,
        )

    def _load_docx(self, file_path: Path) -> list[Document]:
        """Load a single .docx file and return raw LangChain Documents."""
        try:
            loader = Docx2txtLoader(str(file_path))
            docs = loader.load()
            logger.info(f"Loaded {file_path.name} ({len(docs)} page(s))")
            return docs
        except Exception as e:
            logger.error(f"Failed to load {file_path}: {e}")
            return []

    def _enrich_metadata(
        self, docs: list[Document], category: str, file_path: Path
    ) -> list[Document]:
        """Add category, filename, and source metadata to each document."""
        for doc in docs:
            doc.metadata.update(
                {
                    "category": category,
                    "filename": file_path.name,
                    "source": str(file_path),
                }
            )
        return docs

    def _split_documents(self, docs: list[Document]) -> list[Document]:
        """Split documents into overlapping chunks for retrieval."""
        chunks = self.text_splitter.split_documents(docs)
        # Tag each chunk with its positional index within the source file
        chunk_counter: dict[str, int] = {}
        for chunk in chunks:
            key = chunk.metadata.get("filename", "unknown")
            idx = chunk_counter.get(key, 0)
            chunk.metadata["chunk_index"] = idx
            chunk_counter[key] = idx + 1
        return chunks

    def ingest_category(self, category: str) -> list[Document]:
        """
        Ingest all .docx files under documents/<category>/.

        Returns a flat list of chunked Documents ready for embedding.
        """
        if category not in DOCUMENT_CATEGORIES:
            raise ValueError(
                f"Unknown category '{category}'. "
                f"Valid: {DOCUMENT_CATEGORIES}"
            )

        category_dir = self.documents_dir / category
        if not category_dir.exists():
            logger.warning(f"Category directory not found: {category_dir}")
            return []

        docx_files = list(category_dir.glob("*.docx"))
        if not docx_files:
            logger.warning(f"No .docx files found in {category_dir}")
            return []

        all_chunks: list[Document] = []
        for file_path in docx_files:
            raw_docs = self._load_docx(file_path)
            if not raw_docs:
                continue
            enriched = self._enrich_metadata(raw_docs, category, file_path)
            chunks = self._split_documents(enriched)
            logger.info(
                f"  → {file_path.name}: {len(chunks)} chunks "
                f"(avg ~{sum(len(c.page_content) for c in chunks)//max(len(chunks),1)} chars)"
            )
            all_chunks.extend(chunks)

        logger.info(
            f"Category '{category}': {len(docx_files)} file(s), "
            f"{len(all_chunks)} total chunks"
        )
        return all_chunks

    def ingest_all(self) -> dict[str, list[Document]]:
        """Ingest all supported document categories."""
        result: dict[str, list[Document]] = {}
        for category in DOCUMENT_CATEGORIES:
            result[category] = self.ingest_category(category)
        return result
