'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MessageBubbleProps {
  message: any;
  theme?: any;
}

export function MessageBubble({ message, theme }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? theme?.userBubbleColor || 'bg-primary text-primary-foreground'
            : theme?.botBubbleColor || 'bg-muted text-foreground'
        }`}
        style={{
          backgroundColor: isUser 
            ? theme?.userBubbleColor 
            : theme?.botBubbleColor,
          color: isUser 
            ? theme?.userTextColor || 'inherit'
            : theme?.botTextColor || 'inherit',
        }}
      >
        <p className="text-sm">{message.text}</p>
        <p className="text-xs opacity-70 mt-1 text-right">
          {format(message.timestamp, 'HH:mm', { locale: vi })}
        </p>
      </div>
    </div>
  );
}