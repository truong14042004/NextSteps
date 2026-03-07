'use client';

import { X } from 'lucide-react';

interface ChatHeaderProps {
  botName: string;
  botAvatar?: string;
  onClose: () => void;
}

export function ChatHeader({ botName, botAvatar, onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-background border-b border-border">
      <div className="flex items-center space-x-3">
        {botAvatar ? (
          <img 
            src={botAvatar} 
            alt={botName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">🤖</span>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground">{botName}</h3>
          <p className="text-xs text-muted-foreground">Đang online</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Đóng chat"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  );
}