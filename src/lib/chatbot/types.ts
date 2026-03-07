export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  isTyping: boolean;
  isOpen: boolean;
}

export interface ChatbotConfig {
  webhookUrl: string;
  botName: string;
  botAvatar?: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    userBubbleColor?: string;
    botBubbleColor?: string;
    userTextColor?: string;
    botTextColor?: string;
  };
}

export interface WebhookPayload {
  message: string;
  sessionId: string;
}

export interface WebhookResponse {
  reply: string;
}