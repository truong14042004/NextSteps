/**
 * CV Screening Chatbot Widget
 * ============================
 * Drop-in chatbot bubble for any HTML page.
 *
 * Integration: Add ONE script tag to your existing HTML:
 *
 *   <script
 *     src="/static/chatbot-widget.js"
 *     data-chatbot-url="http://localhost:8001"
 *     data-chatbot-title="CV Assistant"
 *     defer
 *   ></script>
 *
 * No other changes to your existing codebase are required.
 */

(function () {
  "use strict";

  // ── Configuration ────────────────────────────────────────────────────────
  const scriptTag = document.currentScript || document.querySelector('[src*="chatbot-widget"]');
  const CHATBOT_URL = (scriptTag && scriptTag.getAttribute("data-chatbot-url")) || "http://localhost:8001";
  const CHATBOT_TITLE = (scriptTag && scriptTag.getAttribute("data-chatbot-title")) || "CV Assistant";

  // Generate a stable session ID for this browser tab
  const SESSION_ID = "sess_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now();

  // ── Styles ───────────────────────────────────────────────────────────────
  const CSS = `
    :root {
      --cb-primary: #2563eb;
      --cb-primary-dark: #1d4ed8;
      --cb-surface: #ffffff;
      --cb-bg: #f8fafc;
      --cb-border: #e2e8f0;
      --cb-text: #1e293b;
      --cb-text-muted: #64748b;
      --cb-user-bubble: #2563eb;
      --cb-bot-bubble: #f1f5f9;
      --cb-radius: 16px;
      --cb-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }

    #cv-chatbot-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--cb-primary);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(37,99,235,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #cv-chatbot-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(37,99,235,0.5); }
    #cv-chatbot-btn svg { width: 28px; height: 28px; fill: white; }
    #cv-chatbot-btn .cb-badge {
      position: absolute;
      top: 4px; right: 4px;
      width: 14px; height: 14px;
      background: #22c55e;
      border-radius: 50%;
      border: 2px solid white;
    }

    #cv-chatbot-panel {
      position: fixed;
      bottom: 100px;
      right: 28px;
      width: 380px;
      height: 560px;
      background: var(--cb-surface);
      border-radius: var(--cb-radius);
      box-shadow: var(--cb-shadow);
      display: flex;
      flex-direction: column;
      z-index: 9998;
      overflow: hidden;
      border: 1px solid var(--cb-border);
      transform: scale(0.9) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
    }
    #cv-chatbot-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    .cb-header {
      background: var(--cb-primary);
      color: white;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cb-header-avatar {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .cb-header-avatar svg { width: 20px; height: 20px; fill: white; }
    .cb-header-info { flex: 1; }
    .cb-header-info strong { display: block; font-size: 15px; }
    .cb-header-info span { font-size: 12px; opacity: 0.8; }
    .cb-close-btn {
      background: none; border: none; color: white; cursor: pointer;
      padding: 4px; border-radius: 8px; opacity: 0.8;
      transition: opacity 0.15s, background 0.15s;
    }
    .cb-close-btn:hover { opacity: 1; background: rgba(255,255,255,0.15); }
    .cb-close-btn svg { width: 20px; height: 20px; fill: white; }

    .cb-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    .cb-messages::-webkit-scrollbar { width: 4px; }
    .cb-messages::-webkit-scrollbar-thumb { background: var(--cb-border); border-radius: 2px; }

    .cb-msg {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 88%;
      animation: cb-fade-up 0.3s ease;
    }
    @keyframes cb-fade-up {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .cb-msg.user { margin-left: auto; flex-direction: row-reverse; }
    .cb-bubble {
      padding: 10px 14px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
      color: var(--cb-text);
      background: var(--cb-bot-bubble);
      border-bottom-left-radius: 4px;
    }
    .cb-msg.user .cb-bubble {
      background: var(--cb-user-bubble);
      color: white;
      border-bottom-left-radius: 18px;
      border-bottom-right-radius: 4px;
    }
    .cb-bot-icon {
      width: 28px; height: 28px; min-width: 28px;
      background: var(--cb-primary);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .cb-bot-icon svg { width: 15px; height: 15px; fill: white; }

    .cb-sources {
      margin-top: 8px;
      font-size: 11px;
      color: var(--cb-text-muted);
    }
    .cb-source-tag {
      display: inline-block;
      background: #eff6ff;
      color: #3b82f6;
      border-radius: 6px;
      padding: 2px 8px;
      margin: 2px 2px 0 0;
      font-weight: 500;
    }

    .cb-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .cb-suggestion-btn {
      font-size: 12px;
      padding: 5px 10px;
      border: 1px solid var(--cb-primary);
      color: var(--cb-primary);
      background: transparent;
      border-radius: 20px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .cb-suggestion-btn:hover { background: var(--cb-primary); color: white; }

    .cb-typing {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 14px;
      background: var(--cb-bot-bubble);
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      width: fit-content;
    }
    .cb-typing span {
      width: 7px; height: 7px;
      background: var(--cb-text-muted);
      border-radius: 50%;
      display: inline-block;
      animation: cb-bounce 1.2s infinite;
    }
    .cb-typing span:nth-child(2) { animation-delay: 0.2s; }
    .cb-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cb-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    .cb-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--cb-border);
      background: var(--cb-surface);
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    .cb-input {
      flex: 1;
      resize: none;
      border: 1.5px solid var(--cb-border);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      max-height: 100px;
      transition: border-color 0.15s;
      color: var(--cb-text);
      background: var(--cb-bg);
    }
    .cb-input:focus { border-color: var(--cb-primary); }
    .cb-send-btn {
      width: 40px; height: 40px; min-width: 40px;
      background: var(--cb-primary);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, transform 0.1s;
    }
    .cb-send-btn:hover { background: var(--cb-primary-dark); }
    .cb-send-btn:active { transform: scale(0.92); }
    .cb-send-btn:disabled { background: var(--cb-border); cursor: not-allowed; }
    .cb-send-btn svg { width: 18px; height: 18px; fill: white; }

    @media (max-width: 440px) {
      #cv-chatbot-panel { right: 12px; left: 12px; width: auto; }
    }
  `;

  // ── Icons ────────────────────────────────────────────────────────────────
  const CHAT_ICON = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
  const SEND_ICON = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
  const CLOSE_ICON = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
  const BOT_ICON = `<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7 14v2a1 1 0 0 0 2 0v-2H7zm8 0v2a1 1 0 0 0 2 0v-2h-2zM3 21v-2h18v2H3z"/></svg>`;

  // ── DOM Construction ──────────────────────────────────────────────────────
  function init() {
    injectStyles();
    const btn = createToggleButton();
    const panel = createPanel();
    document.body.appendChild(btn);
    document.body.appendChild(panel);

    // Toggle panel
    btn.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("open");
      if (isOpen) getInput(panel).focus();
    });
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function createToggleButton() {
    const btn = document.createElement("button");
    btn.id = "cv-chatbot-btn";
    btn.setAttribute("aria-label", "Open chat assistant");
    btn.innerHTML = `${CHAT_ICON}<span class="cb-badge"></span>`;
    return btn;
  }

  function createPanel() {
    const panel = document.createElement("div");
    panel.id = "cv-chatbot-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", CHATBOT_TITLE);
    panel.innerHTML = `
      <div class="cb-header">
        <div class="cb-header-avatar">${BOT_ICON}</div>
        <div class="cb-header-info">
          <strong>${CHATBOT_TITLE}</strong>
          <span>Powered by AI · Usually replies instantly</span>
        </div>
        <button class="cb-close-btn" aria-label="Close chat">${CLOSE_ICON}</button>
      </div>
      <div class="cb-messages" id="cb-messages"></div>
      <div class="cb-footer">
        <textarea class="cb-input" id="cb-input" rows="1"
          placeholder="Ask about pricing, services, policies…"
          aria-label="Type your message"></textarea>
        <button class="cb-send-btn" id="cb-send" aria-label="Send">${SEND_ICON}</button>
      </div>
    `;

    // Close button
    panel.querySelector(".cb-close-btn").addEventListener("click", () => {
      panel.classList.remove("open");
    });

    // Send on Enter (Shift+Enter = new line)
    const input = panel.querySelector("#cb-input");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(panel);
      }
    });
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 100) + "px";
    });

    panel.querySelector("#cb-send").addEventListener("click", () => sendMessage(panel));

    // Show welcome message
    appendBotMessage(panel, "👋 Hi! I'm the CV Screening Assistant. I can help you with questions about our services, pricing, policies, and FAQs. What would you like to know?");

    return panel;
  }

  function getInput(panel) { return panel.querySelector("#cb-input"); }
  function getMessages(panel) { return panel.querySelector("#cb-messages"); }
  function getSendBtn(panel) { return panel.querySelector("#cb-send"); }

  // ── Messaging ─────────────────────────────────────────────────────────────
  function appendUserMessage(panel, text) {
    const msgs = getMessages(panel);
    const el = document.createElement("div");
    el.className = "cb-msg user";
    el.innerHTML = `<div class="cb-bubble">${escapeHtml(text)}</div>`;
    msgs.appendChild(el);
    scrollToBottom(msgs);
  }

  function appendBotMessage(panel, text, sources = [], suggestions = []) {
    const msgs = getMessages(panel);
    const el = document.createElement("div");
    el.className = "cb-msg bot";

    let sourcesHtml = "";
    if (sources && sources.length > 0) {
      const tags = sources.map(s =>
        `<span class="cb-source-tag">📄 ${s.category}</span>`
      ).join("");
      sourcesHtml = `<div class="cb-sources">Sources: ${tags}</div>`;
    }

    let suggestionsHtml = "";
    if (suggestions && suggestions.length > 0) {
      const btns = suggestions.map(s =>
        `<button class="cb-suggestion-btn" data-q="${escapeHtml(s)}">${escapeHtml(s)}</button>`
      ).join("");
      suggestionsHtml = `<div class="cb-suggestions">${btns}</div>`;
    }

    el.innerHTML = `
      <div class="cb-bot-icon">${BOT_ICON}</div>
      <div>
        <div class="cb-bubble">${formatText(text)}</div>
        ${sourcesHtml}
        ${suggestionsHtml}
      </div>
    `;

    // Suggestion button click → auto-send
    el.querySelectorAll(".cb-suggestion-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        getInput(panel).value = btn.dataset.q;
        sendMessage(panel);
      });
    });

    msgs.appendChild(el);
    scrollToBottom(msgs);
  }

  function showTyping(panel) {
    const msgs = getMessages(panel);
    const el = document.createElement("div");
    el.className = "cb-msg bot cb-typing-row";
    el.innerHTML = `
      <div class="cb-bot-icon">${BOT_ICON}</div>
      <div class="cb-typing"><span></span><span></span><span></span></div>
    `;
    msgs.appendChild(el);
    scrollToBottom(msgs);
    return el;
  }

  function removeTyping(panel, typingEl) {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
  }

  // ── Send Logic ────────────────────────────────────────────────────────────
  async function sendMessage(panel) {
    const input = getInput(panel);
    const message = input.value.trim();
    if (!message) return;

    const sendBtn = getSendBtn(panel);
    input.value = "";
    input.style.height = "auto";
    sendBtn.disabled = true;

    appendUserMessage(panel, message);
    const typingEl = showTyping(panel);

    try {
      const response = await fetch(`${CHATBOT_URL}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: SESSION_ID,
          message: message,
        }),
      });

      removeTyping(panel, typingEl);

      if (!response.ok) {
        appendBotMessage(panel, "I'm having trouble connecting right now. Please try again in a moment.");
        return;
      }

      const data = await response.json();
      appendBotMessage(
        panel,
        data.answer,
        data.sources || [],
        data.follow_up_suggestions || []
      );
    } catch (err) {
      removeTyping(panel, typingEl);
      appendBotMessage(panel, "Connection error. Please check your internet and try again.");
      console.error("[Chatbot]", err);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Utilities ─────────────────────────────────────────────────────────────
  function scrollToBottom(el) {
    setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatText(text) {
    // Convert markdown-ish **bold** and newlines to HTML
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
