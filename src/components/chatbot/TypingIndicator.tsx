'use client';

interface TypingIndicatorProps {
  theme?: any;
}

export function TypingIndicator({ theme }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div
        className="bg-muted rounded-lg px-4 py-2"
        style={{
          backgroundColor: theme?.botBubbleColor || undefined,
        }}
      >
        <div className="flex space-x-2">
          <div className="flex space-x-1">
            <span className="block w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="block w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="block w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span className="text-sm text-muted-foreground ml-2">Đang gõ...</span>
        </div>
      </div>
    </div>
  );
}