export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
 
export interface ChatbotTheme {
  primaryColor?: string;
  backgroundColor?: string;
  userBubbleColor?: string;
  botBubbleColor?: string;
}
 
export interface ChatWidgetConfig {
  webhookUrl: string;       // URL backend Render của bạn
  botName?: string;         // "AI Assistant"
  botAvatar?: string;       // "/bot_avatar.jpg"
  theme?: ChatbotTheme;
}
 
export interface ChatApiRequest {
  message: string;
  session_id?: string;
}
 
export interface ChatApiResponse {
  answer?: string;
  response?: string;
  message?: string;
}