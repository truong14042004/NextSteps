import { useState, useCallback, useRef } from "react";
import { Message } from "./Types";
 
function generateId() {
  return Math.random().toString(36).slice(2, 9);
}
 
const WELCOME: (botName: string) => Message = (botName) => ({
  id: "welcome",
  role: "assistant",
  content: `Xin chào! Tôi là ${botName}. Bạn cần tư vấn gì không? 👋`,
  timestamp: new Date(),
});
 
export function useChatbot(webhookUrl: string, botName: string) {
  const [messages, setMessages] = useState<Message[]>([WELCOME(botName)]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = useRef<string>(generateId());
 
  const sendMessage = useCallback(
    async (userInput: string) => {
      const trimmed = userInput.trim();
      if (!trimmed) return;
 
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "user", content: trimmed, timestamp: new Date() },
      ]);
      setIsLoading(true);
 
      const botId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: botId, role: "assistant", content: "", timestamp: new Date() },
      ]);
 
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, session_id: sessionId.current }),
        });
 
        if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
 
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("Không đọc được stream");
 
        let fullText = "";
 
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
 
          // ✅ Backend trả plain text thẳng, không có "data: " prefix
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
 
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, content: fullText } : m
            )
          );
        }
 
        if (!fullText.trim()) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? { ...m, content: "Xin lỗi, tôi không có câu trả lời phù hợp." }
                : m
            )
          );
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Không thể kết nối đến server.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, content: "⚠️ " + msg } : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [webhookUrl]
  );
 
  const clearMessages = useCallback(() => {
    sessionId.current = generateId();
    setMessages([WELCOME(botName)]);
  }, [botName]);
 
  return { messages, isLoading, sendMessage, clearMessages };
}