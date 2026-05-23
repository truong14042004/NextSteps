"use client";
 
import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import Image from "next/image";
import { useChatbot } from "./useChatbot";
import { Message, ChatWidgetConfig } from "./types";
 
// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="ns-msg ns-msg--bot">
      <div className="ns-avatar ns-avatar--bot" style={{ background: color }}>
        ✦
      </div>
      <div className="ns-bubble ns-bubble--bot ns-typing">
        <span /><span /><span />
      </div>
    </div>
  );
}
 
// ─── Single message ───────────────────────────────────────────────────────────
interface ChatMessageProps {
  msg: Message;
  botAvatar?: string;
  userBubbleColor: string;
  botBubbleColor: string;
  primaryColor: string;
}
 
function ChatMessage({
  msg,
  botAvatar,
  userBubbleColor,
  botBubbleColor,
  primaryColor,
}: ChatMessageProps) {
  const isUser = msg.role === "user";
  return (
    <div className={`ns-msg ${isUser ? "ns-msg--user" : "ns-msg--bot"}`}>
      {!isUser && (
        <div className="ns-avatar ns-avatar--bot" style={{ background: primaryColor }}>
          {botAvatar ? (
            <Image src={botAvatar} alt="bot" width={28} height={28} style={{ borderRadius: "50%" }} />
          ) : (
            "✦"
          )}
        </div>
      )}
      <div
        className={`ns-bubble ${isUser ? "ns-bubble--user" : "ns-bubble--bot"}`}
        style={
          isUser
            ? { background: userBubbleColor, color: "#fff" }
            : { background: botBubbleColor, color: "#1f2937" }
        }
      >
        {msg.content}
      </div>
      {isUser && (
        <div className="ns-avatar ns-avatar--user">You</div>
      )}
    </div>
  );
}
 
// ─── Main Widget ──────────────────────────────────────────────────────────────
interface ChatWidgetProps {
  config: ChatWidgetConfig;
}
 
export function ChatWidget({ config }: ChatWidgetProps) {
  const {
    webhookUrl,
    botName = "AI Assistant",
    botAvatar,
    theme = {},
  } = config;
 
  const {
    primaryColor = "#3b82f6",
    backgroundColor = "#ffffff",
    userBubbleColor = "#3b82f6",
    botBubbleColor = "#f3f4f6",
  } = theme;
 
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, clearMessages } = useChatbot(
    webhookUrl,
    botName
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
 
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);
 
  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };
 
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
 
  return (
    <>
      <style>{`
        .ns-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: var(--font-outfit-sans, 'Segoe UI', system-ui, sans-serif);
        }
 
        /* ── Toggle button ── */
        .ns-toggle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          font-size: 22px;
          color: #fff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ns-toggle:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.3); }
 
        /* ── Panel ── */
        .ns-panel {
          position: absolute;
          bottom: 68px;
          right: 0;
          width: 360px;
          height: 520px;
          border-radius: 20px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transform-origin: bottom right;
          animation: ns-pop 0.22s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes ns-pop {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
 
        /* ── Header ── */
        .ns-header {
          color: #fff;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .ns-header-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; overflow: hidden;
        }
        .ns-header-title { font-weight: 700; font-size: 15px; }
        .ns-header-sub { font-size: 11px; opacity: 0.8; margin-top: 1px; }
        .ns-header-actions { margin-left: auto; display: flex; gap: 6px; }
        .ns-icon-btn {
          background: rgba(255,255,255,0.15);
          border: none; color: #fff; cursor: pointer;
          border-radius: 8px; width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; transition: background 0.15s;
        }
        .ns-icon-btn:hover { background: rgba(255,255,255,0.28); }
 
        /* ── Messages ── */
        .ns-messages {
          flex: 1; overflow-y: auto;
          padding: 14px 12px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .ns-messages::-webkit-scrollbar { width: 4px; }
        .ns-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
 
        .ns-msg { display: flex; align-items: flex-end; gap: 7px; }
        .ns-msg--user { flex-direction: row-reverse; }
 
        .ns-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          color: #fff; font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
        }
        .ns-avatar--user { background: #e5e7eb; color: #6b7280; font-size: 9px; }
 
        .ns-bubble {
          max-width: 245px;
          padding: 10px 13px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.55;
          word-break: break-word;
          white-space: pre-wrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07);
        }
        .ns-bubble--bot { border-bottom-left-radius: 4px; }
        .ns-bubble--user { border-bottom-right-radius: 4px; }
 
        /* ── Typing ── */
        .ns-typing {
          display: flex; align-items: center; gap: 5px;
          padding: 13px 16px; min-width: 52px;
        }
        .ns-typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: #9ca3af; display: inline-block;
          animation: ns-bounce 1.2s infinite;
        }
        .ns-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ns-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes ns-bounce {
          0%,80%,100% { transform: translateY(0); opacity:0.5; }
          40% { transform: translateY(-6px); opacity:1; }
        }
 
        /* ── Input area ── */
        .ns-input-area {
          padding: 10px 12px;
          border-top: 1px solid #e5e7eb;
          display: flex; align-items: flex-end; gap: 8px;
          flex-shrink: 0;
        }
        .ns-textarea {
          flex: 1;
          border: 1.5px solid #e5e7eb; border-radius: 14px;
          padding: 9px 13px; font-size: 14px; font-family: inherit;
          resize: none; outline: none; max-height: 96px; line-height: 1.45;
          background: #f9fafb; color: #1f2937;
          transition: border-color 0.15s, background 0.15s;
        }
        .ns-textarea:focus { border-color: var(--ns-primary, #3b82f6); background: #fff; }
        .ns-textarea::placeholder { color: #9ca3af; }
        .ns-send {
          width: 38px; height: 38px; border-radius: 50%;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: #fff; font-size: 15px;
          transition: opacity 0.15s, transform 0.15s;
        }
        .ns-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .ns-send:not(:disabled):hover { transform: scale(1.08); }
 
        @media (max-width: 480px) {
          .ns-panel { width: calc(100vw - 28px); right: -4px; height: 72vh; }
        }
      `}</style>
 
      <div className="ns-widget">
        {isOpen && (
          <div className="ns-panel" style={{ background: backgroundColor }}>
            {/* Header */}
            <div className="ns-header" style={{ background: primaryColor }}>
              <div className="ns-header-avatar">
                {botAvatar ? (
                  <Image src={botAvatar} alt={botName} width={36} height={36} />
                ) : (
                  "✦"
                )}
              </div>
              <div>
                <div className="ns-header-title">{botName}</div>
                <div className="ns-header-sub">● Online</div>
              </div>
              <div className="ns-header-actions">
                <button className="ns-icon-btn" title="Xóa lịch sử" onClick={clearMessages}>
                  🗑
                </button>
                <button className="ns-icon-btn" title="Đóng" onClick={() => setIsOpen(false)}>
                  ✕
                </button>
              </div>
            </div>
 
            {/* Messages */}
            <div className="ns-messages">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  botAvatar={botAvatar}
                  userBubbleColor={userBubbleColor}
                  botBubbleColor={botBubbleColor}
                  primaryColor={primaryColor}
                />
              ))}
              {isLoading && <TypingIndicator color={primaryColor} />}
              <div ref={messagesEndRef} />
            </div>
 
            {/* Input */}
            <div className="ns-input-area" style={{ background: backgroundColor }}>
              <textarea
                ref={inputRef}
                className="ns-textarea"
                rows={1}
                placeholder="Nhập câu hỏi... (Enter để gửi)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                className="ns-send"
                style={{ background: primaryColor }}
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                title="Gửi"
              >
                ➤
              </button>
            </div>
          </div>
        )}
 
        {/* Toggle */}
        <button
          className="ns-toggle"
          style={{ background: primaryColor }}
          onClick={() => setIsOpen((o) => !o)}
          title={isOpen ? "Đóng chat" : "Mở chat"}
        >
          {isOpen ? "✕" : "💬"}
        </button>
      </div>
    </>
  );
}