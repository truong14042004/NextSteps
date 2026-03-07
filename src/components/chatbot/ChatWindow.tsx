'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatbotConfig } from '@/lib/chatbot/types';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  isTyping: boolean;
  botName: string;
  botAvatar?: string;
  onSendMessage: (message: string) => void;
  theme?: ChatbotConfig['theme'];
}

export function ChatWindow({
  isOpen,
  onClose,
  messages,
  isTyping,
  botName,
  botAvatar,
  onSendMessage,
  theme,
}: ChatWindowProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-24 right-6 w-96 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden"
          style={{
            boxShadow: theme?.primaryColor 
              ? `0 10px 25px -5px ${theme.primaryColor}30, 0 10px 10px -5px ${theme.primaryColor}10`
              : undefined,
          }}
        >
          <ChatHeader botName={botName} botAvatar={botAvatar} onClose={onClose} />
          <MessageList 
            messages={messages} 
            isTyping={isTyping}
            theme={theme}
          />
          <ChatInput onSendMessage={onSendMessage} isDisabled={isTyping} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}