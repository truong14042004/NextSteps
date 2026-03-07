# Chatbot UI Component

Một chatbot UI hiện đại được xây dựng bằng React, TypeScript và Next.js, tích hợp sẵn với hệ thống hiện tại.

## Tính năng

- **Floating Chatbot Widget**: Component dạng nổi ở góc dưới phải
- **Modular Components**: Mỗi phần được tách biệt, dễ tái sử dụng
- **TypeScript First**: Toàn bộ code được type đầy đủ
- **TailwindCSS**: Sử dụng hệ thống styling hiện có của dự án
- **React Hooks**: Quản lý state local cho chatbot
- **API Integration**: Giao tiếp với webhook n8n qua POST request

## Cấu trúc thư mục

```
src/
├── components/
│   ├── chatbot/
│   │   ├── ChatWidget.tsx          # Main component
│   │   ├── ChatButton.tsx          # Floating button
│   │   ├── ChatWindow.tsx          # Cửa sổ chat chính
│   │   ├── ChatHeader.tsx          # Header chat
│   │   ├── MessageList.tsx         # Danh sách tin nhắn
│   │   ├── MessageBubble.tsx       # Bubble tin nhắn
│   │   ├── TypingIndicator.tsx     # Hiển thị đang gõ
│   │   └── ChatInput.tsx           # Ô nhập tin nhắn
│   └── ui/                         # Các component UI có sẵn
├── lib/
│   └── chatbot/
│       ├── types.ts                # TypeScript interfaces
│       └── api.ts                  # API utilities
└── hooks/
    └── useChatbot.ts               # Custom hook quản lý state
```

## Cài đặt

1. Cài đặt dependencies:

```bash
npm install framer-motion date-fns lucide-react
```

2. Thêm environment variables vào `.env.local`:

```env
NEXT_PUBLIC_CHATBOT_WEBHOOK_URL=/api/chatbot
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chatbot
```

## Sử dụng

### Cơ bản

```typescript
import { ChatWidget } from '@/components/chatbot/ChatWidget';

function App() {
  const chatbotConfig = {
    webhookUrl: '/api/chatbot',
    botName: 'Trợ lý AI',
    botAvatar: '/bot-avatar.png',
    theme: {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      userBubbleColor: '#3b82f6',
      botBubbleColor: '#f3f4f6',
    }
  };

  return (
    <div>
      {/* Nội dung website */}
      <ChatWidget config={chatbotConfig} />
    </div>
  );
}
```

### Tích hợp vào Layout

Chatbot đã được tích hợp sẵn vào `src/app/layout.tsx`, chỉ cần cấu hình environment variables.

## API Integration

### Request format:

```json
{
  "message": "Xin chào, bạn có thể giúp tôi tìm việc làm được không?",
  "sessionId": "session_1712456789012_abc123def",
  "timestamp": "2024-04-07T10:30:00.000Z"
}
```

### Response format:

```json
{
  "reply": "Chào bạn! Tôi có thể giúp bạn tìm việc làm. Hãy cho tôi biết bạn quan tâm đến lĩnh vực nào và kinh nghiệm của bạn nhé."
}
```

## Customization

### Theme Configuration

```typescript
const theme = {
  primaryColor: "#your-color", // Màu chính cho button và hiệu ứng
  backgroundColor: "#your-bg-color", // Màu nền chat window
  userBubbleColor: "#your-user-color", // Màu bubble tin nhắn user
  botBubbleColor: "#your-bot-color", // Màu bubble tin nhắn bot
  userTextColor: "#your-user-text", // Màu text user
  botTextColor: "#your-bot-text", // Màu text bot
};
```

### Bot Configuration

```typescript
const config = {
  webhookUrl: "/api/chatbot", // URL API endpoint
  botName: "Tên Bot", // Tên hiển thị
  botAvatar: "/path/to/avatar.png", // Đường dẫn avatar
  theme: theme, // Theme configuration
};
```

## Gợi ý cải tiến trong tương lai

1. **Streaming Response**: Sử dụng Server-Sent Events (SSE) để hiển thị phản hồi theo từng phần
2. **Markdown Support**: Hỗ trợ định dạng markdown trong tin nhắn
3. **Chat History**: Lưu trữ lịch sử chat vào localStorage hoặc database
4. **Voice Input/Output**: Tích hợp Web Speech API
5. **Multi-language Support**: Hỗ trợ nhiều ngôn ngữ
6. **Rich Media**: Hỗ trợ hình ảnh, file đính kèm
7. **Analytics**: Theo dõi metrics: response time, user satisfaction

## Troubleshooting

### Lỗi API

- Kiểm tra `N8N_WEBHOOK_URL` có đúng không
- Đảm bảo n8n webhook đang hoạt động
- Kiểm tra console logs để biết chi tiết lỗi

### Lỗi styling

- Đảm bảo TailwindCSS đã được cấu hình đúng
- Kiểm tra các class CSS có tồn tại không

### Lỗi animation

- Đảm bảo `framer-motion` đã được cài đặt
- Kiểm tra browser có hỗ trợ CSS transforms không

## Contributing

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/chatbot-improvements`
3. Commit thay đổi: `git commit -m 'Add new feature'`
4. Push lên branch: `git push origin feature/chatbot-improvements`
5. Tạo Pull Request
