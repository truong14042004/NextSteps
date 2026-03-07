import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatSession, Message, WebhookPayload } from '@/lib/chatbot/types';
import { ChatbotAPI } from '@/lib/chatbot/api';

export function useChatbot(config: {
  webhookUrl: string;
  botName: string;
  initialMessages?: Message[];
}) {
  const [session, setSession] = useState<ChatSession>({
    id: generateSessionId(),
    messages: config.initialMessages || [],
    isTyping: false,
    isOpen: false,
  });

  const apiRef = useRef(new ChatbotAPI(config.webhookUrl));

  const addMessage = useCallback((message: Message) => {
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const setIsTyping = useCallback((isTyping: boolean) => {
    setSession(prev => ({ ...prev, isTyping }));
  }, []);

  const toggleChat = useCallback(() => {
    setSession(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const closeChat = useCallback(() => {
    setSession(prev => ({ ...prev, isOpen: false }));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: generateMessageId(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    addMessage(userMessage);

    setIsTyping(true);

    try {
      const payload: WebhookPayload = {
        message: text.trim(),
        sessionId: session.id,
      };

      const response = await apiRef.current.sendMessage(payload);

      const botMessage: Message = {
        id: generateMessageId(),
        text: response.reply,
        sender: 'bot',
        timestamp: new Date(),
      };

      addMessage(botMessage);
    } catch (error) {
      const errorMessage: Message = {
        id: generateMessageId(),
        text: "Xin lỗi, hiện tại tôi không thể trả lời. Vui lòng thử lại sau.",
        sender: 'bot',
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  }, [addMessage, setIsTyping, session.id]);

  return {
    session,
    sendMessage,
    toggleChat,
    closeChat,
  };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}