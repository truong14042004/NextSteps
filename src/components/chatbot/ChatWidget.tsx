'use client';

import { useChatbot } from '@/hooks/useChatbot';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';
import { ChatbotConfig } from '@/lib/chatbot/types';

interface ChatWidgetProps {
  config: ChatbotConfig;
}

export function ChatWidget({ config }: ChatWidgetProps) {
  const { session, sendMessage, toggleChat, closeChat } = useChatbot({
    webhookUrl: config.webhookUrl,
    botName: config.botName,
  });

  return (
    <>
      <ChatButton isOpen={session.isOpen} onToggle={toggleChat} />
      <ChatWindow
        isOpen={session.isOpen}
        onClose={closeChat}
        messages={session.messages}
        isTyping={session.isTyping}
        botName={config.botName}
        botAvatar={config.botAvatar}
        onSendMessage={sendMessage}
        theme={config.theme}
      />
    </>
  );
}