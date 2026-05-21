"""
Integration Snippet for Existing FastAPI Application
======================================================
Add these lines to your EXISTING main.py / app.py.

This mounts the chatbot as a sub-application under /chatbot/
and serves the widget JavaScript as a static file.

Changes to your existing app: MINIMAL (3 import lines + 2 mount calls).
Your existing routes, middleware, and business logic are UNTOUCHED.
"""

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Add these imports to your existing app's main.py
# ─────────────────────────────────────────────────────────────────────────────
from fastapi.staticfiles import StaticFiles
from chatbot.main import app as chatbot_app          # import the chatbot sub-app

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: After creating your existing `app = FastAPI(...)`, add:
# ─────────────────────────────────────────────────────────────────────────────

# Mount chatbot API under /chatbot/api/...
# Your existing routes at / are completely unchanged.
# existing_app.mount("/chatbot", chatbot_app)

# Serve the widget JavaScript so frontend can load it from your domain
# existing_app.mount(
#     "/static/chatbot",
#     StaticFiles(directory="chatbot/static"),
#     name="chatbot-static"
# )

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Add ONE script tag to your HTML template (e.g. base.html / index.html)
# ─────────────────────────────────────────────────────────────────────────────
#
#   <script
#     src="/static/chatbot/chatbot-widget.js"
#     data-chatbot-url=""
#     data-chatbot-title="CV Assistant"
#     defer
#   ></script>
#
# Leave data-chatbot-url empty ("") to use same-origin routing via the mount.
# Or set it to the chatbot's standalone URL (e.g. "http://localhost:8001")
# if you are running the chatbot as a separate service.
# ─────────────────────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────────────────────
# ALTERNATIVE: Standalone mode (separate process / container)
# ─────────────────────────────────────────────────────────────────────────────
# If you prefer zero changes to your main app, run the chatbot separately:
#
#   # Terminal 1: your existing app
#   uvicorn your_app.main:app --port 8000
#
#   # Terminal 2: chatbot service
#   uvicorn chatbot.main:app --port 8001
#
# Then set data-chatbot-url="http://localhost:8001" in the script tag
# and ensure CHATBOT_CORS_ORIGINS includes your frontend origin.
