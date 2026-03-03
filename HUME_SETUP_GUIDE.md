# Hướng dẫn Setup Hume AI Voice Interview

## Vấn đề hiện tại
- Voice interview không kết nối được
- Không thấy UI hội thoại
- Hiện thông báo "Phỏng vấn chưa được bắt đầu"

## Nguyên nhân
Config ID `fab3a67d-dceb-4840-a6b0-e2c450588d36` có thể:
1. Không tồn tại trong Hume Dashboard
2. Chưa có System Prompt được cấu hình
3. Không có Voice ID được chọn

## Các bước Setup Hume AI Configuration

### 1. Truy cập Hume AI Dashboard
- Đăng nhập: https://platform.hume.ai
- Vào mục **"EVI Configurations"**

### 2. Tạo hoặc Update Configuration

#### A. Nếu tạo mới:
1. Click "Create Configuration"
2. Đặt tên: "Interview AI Assistant"

#### B. System Prompt (quan trọng!):
```
You are an experienced and professional job interviewer. Your role is to conduct a thorough and engaging technical interview based on the job requirements provided.

**Your responsibilities:**
- Ask relevant technical questions based on the candidate's experience level
- Follow up on interesting points in their answers
- Assess their problem-solving approach
- Create a comfortable yet professional atmosphere
- Ask behavioral questions when appropriate
- Conclude the interview professionally

**Interview Context:**
- Candidate Name: {userName}
- Position: {title}
- Experience Level: {experienceLevel}
- Job Requirements: {description}

**Interview Flow:**
1. Start with a brief introduction and make the candidate feel comfortable
2. Ask about their background and experience (2-3 minutes)
3. Technical questions relevant to the role (5-10 minutes)
4. Problem-solving scenarios or coding questions (if applicable)
5. Behavioral questions (1-2 questions)
6. Allow candidate to ask questions
7. Conclude and thank them for their time

**Important guidelines:**
- Be encouraging and supportive
- Ask one question at a time
- Listen actively to their responses
- Adapt your questions based on their answers
- Keep responses concise and clear
- Maintain a professional yet friendly tone
```

#### C. Voice Settings:
1. Chọn **Voice**: Recommended - "KORA" (professional, clear voice)
2. **Language**: English (US)
3. **Language Model**: Best available (GPT-4 hoặc tương đương)

#### D. Additional Settings:
- **Turn-taking**: Enabled (để AI biết khi nào nên dừng và lắng nghe)
- **Interruption**: Enabled (cho phép candidate ngắt lời nếu cần)
- **Idle Timeout**: 30 seconds
- **Max Duration**: 30 minutes

### 3. Lưu Configuration và Lấy Config ID

1. Click "Save Configuration"
2. Copy **Config ID** (sẽ có dạng UUID)
3. Update trong file `.env.local`:

```env
NEXT_PUBLIC_HUME_CONFIG_ID=<YOUR_NEW_CONFIG_ID>
```

### 4. Verify API Keys

Kiểm tra trong .env.local:
```env
HUME_API_KEY=<your-api-key>
HUME_SECRET_KEY=<your-secret-key>
NEXT_PUBLIC_HUME_CONFIG_ID=<your-config-id>
```

### 5. Test Configuration

1. Restart dev server:
```bash
npm run dev
```

2. Truy cập: http://localhost:3000/app/interview
3. Chọn "Phỏng vấn mới"
4. Điền thông tin và click "Bắt đầu phỏng vấn"
5. Cho phép microphone access
6. Nên thấy connection screen và sau đó voice interface

## Troubleshooting

### Vẫn không kết nối được:
1. **Check browser console** (F12):
   - Xem có lỗi WebSocket không
   - Xem có lỗi microphone permission không

2. **Check Hume Dashboard**:
   - Vào "Logs" xem có request nào đến không
   - Kiểm tra quota còn lại

3. **Test Hume API**:
```bash
# Test access token
curl -X POST https://api.hume.ai/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_API_KEY",
    "client_secret": "YOUR_SECRET_KEY"
  }'
```

### Microphone không hoạt động:
1. Kiểm tra browser settings cho phép microphone
2. Thử browser khác (Chrome recommend)
3. Kiểm tra microphone hardware

### Config ID không tìm thấy:
1. Verify config ID trong Hume Dashboard
2. Đảm bảo đã restart server sau khi update .env.local
3. Check console log xem có config ID nào được gửi

## Giải pháp tạm thời (Nếu không có Hume Account hoặc Quota)

Nếu không thể setup Hume AI ngay, có thể:
1. Tạm thời disable voice interview feature
2. Hoặc implement text-based mock interview thay thế
3. Hoặc sử dụng pre-recorded scenarios

## Contact Support
Nếu vẫn gặp vấn đề, liên hệ Hume support: support@hume.ai
