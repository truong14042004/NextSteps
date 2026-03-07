'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface ChatButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatButton({ isOpen, onToggle }: ChatButtonProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className="bg-primary text-primary-foreground shadow-lg rounded-full p-4 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50"
        aria-label={isOpen ? "Đóng chatbot" : "Mở chatbot"}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
}