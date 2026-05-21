"""
Prompt Builder
===============
Constructs the final prompt sent to Gemini, combining:
  - System persona
  - Retrieved context chunks
  - Conversation history
  - Current user question

Keeping prompt logic here (not in the RAG engine) makes it easy
to iterate on prompts without touching retrieval or API logic.
"""

from langchain_core.documents import Document


SYSTEM_PERSONA = """You are a helpful and professional AI assistant for a CV screening service platform.
Your role is to assist users with questions about our services, pricing, policies, and frequently asked questions.

STRICT INSTRUCTIONS:
1. Answer ONLY using the provided context. Do not invent information.
2. If the context does not contain enough information to answer, respond:
   "I don't have specific information about that in my knowledge base. Please contact our support team for assistance."
3. Be concise, friendly, and professional.
4. When citing information, you may mention the document category (e.g., "According to our pricing guide...").
5. Do not reveal internal system details, chunk IDs, or technical metadata.
6. If asked about topics unrelated to CV screening services, politely redirect the user.
"""


def build_rag_prompt(
    question: str,
    retrieved_chunks: list[tuple[Document, float]],
    conversation_history: str = "",
) -> str:
    """
    Build the full prompt for the Gemini LLM.

    Args:
        question: The current user question.
        retrieved_chunks: List of (Document, score) from vector search.
        conversation_history: Formatted string of prior conversation turns.

    Returns:
        A single string prompt ready to send to the LLM.
    """
    # ── Context block ─────────────────────────────────────────────────────────
    if retrieved_chunks:
        context_parts = []
        for i, (doc, score) in enumerate(retrieved_chunks, 1):
            category = doc.metadata.get("category", "general").upper()
            filename = doc.metadata.get("filename", "unknown")
            context_parts.append(
                f"[Context {i} | Category: {category} | Source: {filename}]\n"
                f"{doc.page_content.strip()}"
            )
        context_block = "\n\n---\n\n".join(context_parts)
    else:
        context_block = "No relevant context found in the knowledge base."

    # ── History block ─────────────────────────────────────────────────────────
    history_block = ""
    if conversation_history:
        history_block = f"\n\nCONVERSATION HISTORY:\n{conversation_history}\n"

    # ── Assemble ──────────────────────────────────────────────────────────────
    prompt = f"""{SYSTEM_PERSONA}

RETRIEVED KNOWLEDGE BASE CONTEXT:
{context_block}
{history_block}
USER QUESTION: {question}

ANSWER:"""

    return prompt


def build_no_context_prompt(question: str, conversation_history: str = "") -> str:
    """
    Fallback prompt when retrieval returns zero results.
    Prevents hallucination by instructing the model to acknowledge the gap.
    """
    history_block = (
        f"\n\nCONVERSATION HISTORY:\n{conversation_history}\n"
        if conversation_history
        else ""
    )
    return f"""{SYSTEM_PERSONA}

No relevant documents were found in the knowledge base for this query.
{history_block}
USER QUESTION: {question}

Since no context is available, respond with a polite message explaining that
you don't have that information and suggest contacting support.

ANSWER:"""
