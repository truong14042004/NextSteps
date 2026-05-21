# CV Screening RAG Chatbot

A production-ready Retrieval-Augmented Generation (RAG) chatbot, isolated as a
self-contained module alongside your existing CV screening application.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 Existing CV Screening App               │
│           (unchanged — zero modifications)              │
└────────────────────────────┬────────────────────────────┘
                             │  mounts /chatbot (optional)
                             ▼
┌─────────────────────────────────────────────────────────┐
│              Chatbot Service  (port 8001)               │
│                                                         │
│  POST /api/chat/          ← user question               │
│  POST /api/chat/stream    ← streaming SSE               │
│  POST /api/ingest/        ← trigger ingestion           │
│  GET  /api/chat/health    ← health check                │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │  Ingestion  │   │  RAG Engine  │   │  Session    │  │
│  │  Pipeline   │   │              │   │  Memory     │  │
│  │  (.docx →   │   │  Retrieve +  │   │  (per-      │  │
│  │   chunks)   │   │  Generate)   │   │   session)  │  │
│  └──────┬──────┘   └──────┬───────┘   └─────────────┘  │
│         │                 │                             │
│         ▼                 ▼                             │
│  ┌──────────────────────────────┐                       │
│  │        ChromaDB              │  Gemini Embeddings    │
│  │   (persistent vector store)  │  Gemini LLM           │
│  └──────────────────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
your-project/
├── your_existing_app/          ← untouched
│   └── ...
│
├── chatbot/                    ← NEW: entire chatbot module
│   ├── __init__.py
│   ├── config.py               ← all configuration
│   ├── main.py                 ← FastAPI app entry point
│   ├── integration_snippet.py  ← how to mount on existing app
│   │
│   ├── api/
│   │   ├── chat.py             ← /api/chat/* routes
│   │   ├── ingestion.py        ← /api/ingest/* routes
│   │   └── dependencies.py     ← FastAPI DI singletons
│   │
│   ├── rag/
│   │   └── engine.py           ← RAG orchestrator
│   │
│   ├── vectorstore/
│   │   └── store.py            ← ChromaDB wrapper
│   │
│   ├── ingestion/
│   │   └── pipeline.py         ← .docx loader + chunker
│   │
│   ├── models/
│   │   └── schemas.py          ← Pydantic request/response models
│   │
│   ├── utils/
│   │   ├── session_memory.py   ← per-session conversation history
│   │   └── prompt_builder.py   ← RAG prompt construction
│   │
│   ├── static/
│   │   └── chatbot-widget.js   ← drop-in frontend widget
│   │
│   └── documents/              ← place your .docx files here
│       ├── faq/
│       ├── services/
│       ├── pricing/
│       └── policies/
│
├── ingest.py                   ← CLI ingestion script
├── requirements.txt
├── Dockerfile.chatbot
├── docker-compose.chatbot.yml
└── .env.example
```

---

## Quick Start

### 1. Clone / add files to your project

Copy the `chatbot/` directory and supporting files into your project root.

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY
```

### 4. Add your .docx documents

Place your documents in the appropriate subdirectories:

```
chatbot/documents/
├── faq/          ← FAQ documents (e.g. faq_general.docx)
├── services/     ← Service descriptions
├── pricing/      ← Pricing plans and tiers
└── policies/     ← Terms, privacy, refund policies
```

**Document naming convention:** `<category>_<topic>.docx`
Examples: `faq_general.docx`, `pricing_plans.docx`, `policies_privacy.docx`

### 5. Ingest documents

```bash
# Ingest all categories
python ingest.py

# Ingest a specific category
python ingest.py --category faq

# Force re-ingest (clears existing vectors first)
python ingest.py --force

# Dry run (parse only, no vector store writes)
python ingest.py --dry-run
```

### 6. Start the chatbot service

```bash
uvicorn chatbot.main:app --host 0.0.0.0 --port 8001 --reload
```

### 7. Test it

```bash
# Health check
curl http://localhost:8001/api/chat/health

# Send a message
curl -X POST http://localhost:8001/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-001", "message": "What are your pricing plans?"}'
```

---

## Integration with Existing Application

### Option A: Standalone (recommended for isolation)

Run the chatbot as a **separate process or container**. Add the widget script
tag to your frontend HTML:

```html
<!-- Add to your existing HTML template -->
<script
  src="http://localhost:8001/static/chatbot-widget.js"
  data-chatbot-url="http://localhost:8001"
  data-chatbot-title="CV Assistant"
  defer
></script>
```

### Option B: Mount on existing FastAPI app

Add these **3 lines** to your existing `main.py` (no other changes):

```python
from fastapi.staticfiles import StaticFiles
from chatbot.main import app as chatbot_app

# After your existing `app = FastAPI(...)`:
existing_app.mount("/chatbot", chatbot_app)
existing_app.mount("/static/chatbot", StaticFiles(directory="chatbot/static"), name="chatbot-static")
```

Then in your HTML:
```html
<script
  src="/static/chatbot/chatbot-widget.js"
  data-chatbot-url=""
  data-chatbot-title="CV Assistant"
  defer
></script>
```

---

## Docker Deployment

### Build and run chatbot only

```bash
docker build -f Dockerfile.chatbot -t cv-chatbot .
docker run -p 8001:8001 --env-file .env cv-chatbot
```

### Run with Docker Compose (sidecar)

```bash
docker-compose -f docker-compose.chatbot.yml up -d
```

### Ingest documents inside Docker

```bash
docker exec cv_chatbot python ingest.py
```

---

## API Reference

### `POST /api/chat/`

Send a message and receive a grounded answer.

**Request:**
```json
{
  "session_id": "sess_abc123",
  "message": "What is included in the Professional plan?",
  "history": []
}
```

**Response:**
```json
{
  "session_id": "sess_abc123",
  "answer": "The Professional plan includes up to 500 CV screenings...",
  "sources": [
    {
      "category": "pricing",
      "filename": "pricing_plans.docx",
      "chunk_index": 2,
      "relevance_score": 0.8921,
      "excerpt": "PROFESSIONAL PLAN — $149/month..."
    }
  ],
  "has_sources": true,
  "follow_up_suggestions": ["Is there a free trial?", "What payment methods?"]
}
```

### `POST /api/chat/stream`

Same request format. Returns SSE stream of tokens:
```
data: {"token": "The "}
data: {"token": "Professional "}
...
data: [DONE]
```

### `POST /api/ingest/`

Trigger document ingestion.

```json
{
  "category": "pricing",      // null = all categories
  "force_reingest": false
}
```

### `DELETE /api/chat/session/{session_id}`

Clear conversation history for a session.

### `GET /api/chat/health`

Returns vector store readiness and document count.

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(required)* | Google Gemini API key |
| `GEMINI_LLM_MODEL` | `gemini-1.5-flash` | LLM model for responses |
| `GEMINI_EMBEDDING_MODEL` | `models/text-embedding-004` | Embedding model |
| `CHROMA_PERSIST_DIR` | `./chatbot/vectorstore/chroma_db` | ChromaDB storage path |
| `CHROMA_COLLECTION_NAME` | `cv_screening_kb` | Collection name |
| `DOCUMENTS_DIR` | `./chatbot/documents` | Root documents directory |
| `CHUNK_SIZE` | `800` | Characters per chunk |
| `CHUNK_OVERLAP` | `150` | Overlap between chunks |
| `RETRIEVAL_TOP_K` | `5` | Chunks to retrieve per query |
| `RETRIEVAL_SCORE_THRESHOLD` | `0.3` | Minimum relevance score |
| `MAX_HISTORY_TURNS` | `10` | Conversation turns to remember |
| `CHATBOT_PORT` | `8001` | API server port |
| `CHATBOT_CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins |

---

## Hallucination Prevention

The RAG engine uses two layers of hallucination prevention:

1. **Score threshold filtering** — chunks below `RETRIEVAL_SCORE_THRESHOLD` are discarded
2. **Grounded prompt instruction** — the system prompt explicitly instructs Gemini to answer
   only from the retrieved context and to say "I don't have that information" otherwise

---

## Adding More Documents

1. Place new `.docx` files in the appropriate category directory
2. Re-run: `python ingest.py --category <category>`
3. No restart required — the vector store is queried live

---

## Production Checklist

- [ ] Set `GEMINI_API_KEY` securely (use secrets manager, not .env in production)
- [ ] Configure `CHATBOT_CORS_ORIGINS` to match your frontend domain
- [ ] Protect `/api/ingest/` with authentication (IP allowlist or API key middleware)
- [ ] Mount a persistent volume for `chroma_db` in Docker
- [ ] Set up log aggregation (the app logs to stdout in structured format)
- [ ] For multi-worker deployments: replace in-memory session store with Redis
