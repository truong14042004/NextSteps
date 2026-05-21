"""
Session Memory Manager
=======================
In-memory conversation history per session_id.
Automatically prunes old turns to respect the configured window.

This is intentionally lightweight — for production deployments with
multiple workers, swap the dict for Redis (see comments below).
"""

import logging
from collections import defaultdict, deque
from typing import Optional

from chatbot.config import MAX_HISTORY_TURNS
from chatbot.models.schemas import ChatMessage

logger = logging.getLogger(__name__)


class SessionMemoryManager:
    """
    Stores per-session conversation history.

    In-process (single-worker) implementation using a deque.
    For multi-worker deployments, replace with a Redis-backed store:

        import redis, json
        r = redis.Redis(...)
        def get_history(session_id):
            raw = r.lrange(f"chat:{session_id}", 0, -1)
            return [json.loads(m) for m in raw]
    """

    def __init__(self, max_turns: int = MAX_HISTORY_TURNS):
        self._max_turns = max_turns
        # Maps session_id → deque of ChatMessage dicts
        self._store: dict[str, deque] = defaultdict(
            lambda: deque(maxlen=max_turns * 2)  # *2 because user+assistant pairs
        )

    def add_turn(
        self, session_id: str, user_message: str, assistant_message: str
    ) -> None:
        """Append a user/assistant pair to the session history."""
        history = self._store[session_id]
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": assistant_message})
        logger.debug(
            f"Session '{session_id}': history now {len(history)//2} turn(s)"
        )

    def get_history(self, session_id: str) -> list[ChatMessage]:
        """Return the conversation history as a list of ChatMessage objects."""
        return [
            ChatMessage(role=m["role"], content=m["content"])
            for m in self._store[session_id]
        ]

    def get_history_as_text(self, session_id: str) -> str:
        """
        Return history formatted as a plain-text dialogue block,
        suitable for inclusion in the LLM prompt.
        """
        history = self._store[session_id]
        if not history:
            return ""
        lines = []
        for msg in history:
            label = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{label}: {msg['content']}")
        return "\n".join(lines)

    def clear_session(self, session_id: str) -> None:
        """Remove all history for a given session."""
        if session_id in self._store:
            del self._store[session_id]
            logger.info(f"Cleared session '{session_id}'")

    def session_exists(self, session_id: str) -> bool:
        return session_id in self._store and len(self._store[session_id]) > 0

    def active_sessions(self) -> int:
        return len(self._store)
