'use client';

import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Message } from '@/lib/chatbot/types';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  theme?: any;
}

export function MessageList({ messages, isTyping, theme }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: theme?.backgroundColor }}>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          theme={theme}
        />
      ))}
      {isTyping && <TypingIndicator theme={theme} />}
      <div ref={messagesEndRef} />
    </div>
  );
}