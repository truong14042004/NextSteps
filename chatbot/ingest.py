#!/usr/bin/env python3
"""
Ingestion CLI Script
=====================
Run document ingestion from the command line.

Usage:
    # Ingest all categories
    python ingest.py

    # Ingest a specific category
    python ingest.py --category faq

    # Force re-ingest (deletes existing vectors first)
    python ingest.py --force

    # Ingest specific category with force
    python ingest.py --category pricing --force
"""

import argparse
import logging
import sys
from pathlib import Path

# Ensure the project root is on the Python path
sys.path.insert(0, str(Path(__file__).parent))

from chatbot.config import validate_config, DOCUMENT_CATEGORIES
from chatbot.ingestion.pipeline import DocumentIngestionPipeline
from chatbot.vectorstore.store import VectorStoreManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description="Ingest .docx documents into the chatbot knowledge base"
    )
    parser.add_argument(
        "--category",
        choices=DOCUMENT_CATEGORIES,
        default=None,
        help="Ingest only this category (default: all categories)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Delete existing vectors before ingesting",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse documents but do not write to the vector store",
    )
    args = parser.parse_args()

    # ── Validate config ────────────────────────────────────────────────────────
    try:
        validate_config()
    except EnvironmentError as e:
        logger.critical(f"Configuration error: {e}")
        sys.exit(1)

    # ── Initialise components ──────────────────────────────────────────────────
    pipeline = DocumentIngestionPipeline()
    vector_store = None if args.dry_run else VectorStoreManager()

    # ── Determine categories ───────────────────────────────────────────────────
    categories = [args.category] if args.category else DOCUMENT_CATEGORIES
    logger.info(f"Categories to process: {categories}")

    if args.force and not args.dry_run:
        if args.category:
            logger.warning(f"Force mode: clearing category '{args.category}'")
            vector_store.reset_category(args.category)
        else:
            logger.warning("Force mode: resetting entire vector store")
            vector_store.reset_collection()

    # ── Run ingestion ──────────────────────────────────────────────────────────
    total_chunks = 0
    for category in categories:
        logger.info(f"\n{'─'*50}")
        logger.info(f"Processing category: {category.upper()}")
        chunks = pipeline.ingest_category(category)

        if not chunks:
            logger.warning(f"  No chunks produced for '{category}'")
            continue

        total_chunks += len(chunks)

        if args.dry_run:
            logger.info(f"  [DRY RUN] Would add {len(chunks)} chunks to vector store")
            for chunk in chunks[:2]:  # Preview first 2 chunks
                logger.info(
                    f"  Preview → [{chunk.metadata['filename']}] "
                    f"{chunk.page_content[:100]}..."
                )
        else:
            added = vector_store.add_documents(chunks)
            logger.info(f"  ✓ Added {added} chunks to vector store")

    # ── Summary ────────────────────────────────────────────────────────────────
    logger.info(f"\n{'═'*50}")
    logger.info(f"Ingestion complete!")
    logger.info(f"  Categories processed : {len(categories)}")
    logger.info(f"  Total chunks         : {total_chunks}")

    if not args.dry_run and vector_store:
        logger.info(f"  Vector store total   : {vector_store.document_count()} chunks")

    if args.dry_run:
        logger.info("  [DRY RUN] No data was written.")


if __name__ == "__main__":
    main()
