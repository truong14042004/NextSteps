# Hướng dẫn cấu hình Hume EVI để sửa lỗi WebSocket Connection

## ❌ Lỗi hiện tại
```
socket_connection_failure: Max retries (0) reached
```

Config ID `fab3a67d-dceb-4840-a6b0-e2c450588d36` đã tồn tại nhưng **chưa được cấu hình đầy đủ**.

---

## ✅ Các bước sửa lỗi

### 🗺️ Sơ đồ Navigation trong Hume Dashboard

```
Hume Platform Dashboard
└── Sidebar (trái)
    └── EVI (Empathic Voice Interface)
        └── Configurations
            └── Click vào config "3/1/2026, 03:36:45 PM"
                ├── Tab: "System Prompt" ← Paste prompt ở đây
                ├── Tab: "Voice" ← Chọn KORA
                └── Tab: "Conversation" hoặc "Advanced"
                    └── Section: "Turn-Taking" ← BẬT ở đây
```

---

### Bước 1: Đăng nhập Hume Dashboard
1. Truy cập: https://platform.hume.ai
2. Login bằng tài khoản của bạn

### Bước 2: Mở EVI Configuration

**Cách navigate trong Hume Dashboard:**

1. Sau khi login vào https://platform.hume.ai
2. **Sidebar bên trái** → Tìm và click **"EVI"** (Empathic Voice Interface)
3. Trong menu EVI → Click **"Configurations"**
4. Bạn sẽ thấy danh sách configs, tìm config: 
   - Tên: **"3/1/2026, 03:36:45 PM"** 
   - ID: `fab3a67d-dceb-4840-a6b0-e2c450588d36`
5. **Click vào config đó** để mở trang Edit

**Nếu không thấy config trong list:**
- Config có thể đã bị xóa → Tạo config mới (xem phần "Giải pháp thay thế" bên dưới)

### Bước 3: Kiểm tra System Prompt

Đảm bảo có **System Prompt** hoàn chỉnh. Nếu chưa có, copy paste prompt sau:

#### 🇻🇳 Phiên bản TIẾNG VIỆT (Khuyến nghị):

```
Bạn là một AI interviewer đang tiến hành phỏng vấn tuyển dụng chuyên nghiệp. Vai trò của bạn:

1. **Đặt câu hỏi phù hợp**: Dựa trên kinh nghiệm của ứng viên ({{experienceLevel}}) và vị trí họ ứng tuyển ({{title}}), đặt các câu hỏi kỹ thuật và hành vi phù hợp.

2. **Thông tin vị trí tuyển dụng**: Mô tả công việc đầy đủ là: {{description}}

3. **Thông tin ứng viên**:
   - Tên: {{userName}}
   - Vị trí ứng tuyển: {{title}}
   - Cấp độ kinh nghiệm: {{experienceLevel}}

4. **Luồng phỏng vấn**:
   - Bắt đầu bằng lời chào thân thiện, giới thiệu bạn là AI interviewer
   - Hỏi tổng cộng 5 câu hỏi, từ tổng quan đến chuyên sâu
   - Lắng nghe kỹ câu trả lời (bạn sẽ nhận được bản ghi âm chuyển thành text)
   - Đặt câu hỏi bổ sung nếu câu trả lời chưa rõ ràng hoặc chưa đầy đủ
   - Giữ giọng điệu chuyên nghiệp nhưng thân thiện

5. **Hướng dẫn đặt câu hỏi**:
   - Intern/Fresh: Tập trung vào khả năng học hỏi, động lực, kiến thức cơ bản
   - Junior: Hỏi về công nghệ cụ thể và kinh nghiệm dự án nhỏ
   - Mid-level/Senior: Câu hỏi kỹ thuật sâu, thiết kế hệ thống, khả năng lãnh đạo

6. **Phong cách giao tiếp**:
   - Giữ câu hỏi ngắn gọn (1-2 câu)
   - Một lần hỏi một câu
   - Cho ứng viên thời gian trả lời
   - Khuyến khích và hỗ trợ
   - Kết thúc bằng "Cảm ơn bạn đã dành thời gian. Buổi phỏng vấn đã hoàn tất."

**LƯU Ý QUAN TRỌNG**: 
- Nói TIẾNG VIỆT trong toàn bộ cuộc phỏng vấn
- Đánh giá cả kỹ năng chuyên môn và khả năng giao tiếp
- Giữ giọng điệu tự nhiên, không quá cứng nhắc
```

#### 🇬🇧 Phiên bản tiếng Anh (nếu cần):

```
You are an AI interviewer conducting a professional job interview. Your role is to:

1. **Ask Relevant Questions**: Based on the candidate's experience level ({{experienceLevel}}) and the position they're applying for ({{title}}), ask appropriate technical and behavioral questions.

2. **Job Description Context**: The full job description is: {{description}}

3. **Candidate Information**: 
   - Name: {{userName}}
   - Position: {{title}}
   - Experience Level: {{experienceLevel}}

4. **Interview Flow**:
   - Start with a warm greeting introducing yourself as the AI interviewer
   - Ask 5 questions total, progressing from general to specific
   - Listen carefully to answers (you'll receive speech-to-text transcriptions)
   - Ask follow-up questions when responses are vague or incomplete
   - Maintain a professional yet friendly tone

5. **Question Guidelines**:
   - For intern/fresh: Focus on learning ability, motivation, basic concepts
   - For junior: Ask about specific technologies and small project experience
   - For mid-level/senior: Deep technical questions, system design, leadership

6. **Conversation Style**:
   - Keep questions concise (1-2 sentences)
   - One question at a time
   - Allow time for candidate to respond
   - Be encouraging and supportive
   - End with "Thank you for your time. The interview is complete."

Remember: You're evaluating both technical skills and communication ability.
```

### Bước 4: Cấu hình Voice Settings
1. **Voice**: Chọn **KORA** (hoặc voice khác)
2. **Language**: **English** (hoặc Vietnamese nếu có)

### Bước 5: Cấu hình Turn-Taking (QUAN TRỌNG NHẤT!)

**Vị trí trong Hume Dashboard:**

Sau khi mở Config (Bước 2-3), trong trang Edit Configuration, bạn sẽ thấy các tabs/sections:

1. **Tìm tab "Conversation"** hoặc **"Advanced Settings"** (thường ở phía trên hoặc sidebar trái)

2. **Scroll xuống tìm section có tên một trong các tên sau:**
   - "Turn-Taking" 
   - "Conversation Control"
   - "Interruption Settings"
   - "Response Behavior"

3. **Trong section đó, BẬT các toggle switches:**
   - ✅ **"Enable turn-taking"** hoặc **"Turn-based conversation"**
   - ✅ **"Allow user interruption"** hoặc **"Interruptible"**
   - ✅ **"Auto-start"** (nếu có)

4. **Các settings bổ sung có thể có:**
   - **Timeout settings**: Để mặc định (thường ~3-5 giây)
   - **Response delay**: 0.5-1 giây là tốt
   - **End-of-turn detection**: BẬT

**📸 Gợi ý nếu không tìm thấy:**
- Nếu Dashboard hiển thị dạng form JSON, tìm key: `"turn_taking"` hoặc `"interruption"`
- Một số dashboard có thể gọi là **"Voice Activity Detection (VAD)"** - cũng cần BẬT cái này

**⚠️ LƯU Ý QUAN TRỌNG:**
Nếu KHÔNG tìm thấy Turn-Taking settings trong dashboard hiện tại, có thể:
- Config cũ không hỗ trợ tính năng này
- Cần nâng cấp plan Hume
- → **Giải pháp**: Tạo Config mới từ template "Voice Assistant" hoặc "Conversational AI" (xem Bước 7 dưới)

### Bước 6: Session Variables
Kiểm tra có các variables sau (thường tự động detect từ System Prompt):
- `userName`
- `title`
- `description`
- `experienceLevel`

### Bước 7: Save & Activate
1. Click **"Save"** hoặc **"Update Configuration"**
2. Đảm bảo config có status **"Active"** hoặc **"Published"**

---

## 🧪 Test lại

Sau khi cấu hình xong:

1. **Restart dev server**:
   ```powershell
   # Dừng server (Ctrl+C)
   npm run dev
   ```

2. **Refresh browser** (hard refresh: Ctrl+Shift+R)

3. **Thử bắt đầu phỏng vấn** và kiểm tra console logs:
   ```
   ✅ Nên thấy: "Voice state changed: CONNECTING" → "Voice state changed: OPEN"
   ❌ Nếu vẫn lỗi: Check lại System Prompt và Turn-Taking settings
   ```

---

## 🔧 Giải pháp thay thế: Tạo Config mới (NẾU KHÔNG TÌM THẤY TURN-TAKING)

Nếu config cũ không có Turn-Taking settings, tạo config hoàn toàn mới:

### Cách tạo Config mới:

1. **Dashboard** → **"EVI"** → **"Configurations"** → Click nút **"Create New"** hoặc **"+ New Configuration"**

2. **Chọn Template** (nếu có):
   - Tìm template: **"Voice Assistant"**, **"Conversational AI"**, hoặc **"Interview Assistant"**
   - Nếu không có template → Chọn "Blank" hoặc "Custom"

3. **Điền thông tin cơ bản**:
   - **Name**: `Interview AI Assistant`
   - **Description**: `AI interviewer for job candidates`

4. **Tab "System Prompt"**:
   - Paste prompt từ [Bước 3](#bước-3-kiểm-tra-system-prompt) ở trên

5. **Tab "Voice"**:
   - **Provider**: Hume AI (hoặc ElevenLabs nếu có)
   - **Voice**: **KORA** (giọng nữ tự nhiên)
   - **Language**: English

6. **Tab "Conversation" hoặc "Settings"**:
   - ✅ **Enable Turn-Taking** ← QUAN TRỌNG
   - ✅ **Allow Interruption**
   - Timeout: 3-5 giây
   - Response delay: 0.5 giây

7. **Tab "Variables"** (nếu có):
   - Thêm các variables:
     - `userName` (type: string)
     - `title` (type: string)  
     - `description` (type: string)
     - `experienceLevel` (type: string)

8. **Save Configuration**:
   - Click **"Save"** hoặc **"Create"**
   - **Copy Config ID** (dạng UUID, ví dụ: `abc123-def456-...`)

9. **Update `.env.local`**:
   ```env
   NEXT_PUBLIC_HUME_CONFIG_ID=<your-new-config-id>
   ```

5. **Restart server**

---

## 📞 Kiểm tra Microphone Permission

Trong Browser console, nếu thấy lỗi về microphone:

1. **Chrome**: Settings → Privacy and Security → Site Settings → Microphone
2. Đảm bảo `http://localhost:3000` được **Allow**
3. Refresh page và thử lại

---

## ⚠️ Common Issues

### Issue 1: "Max retries (0) reached"
**Nguyên nhân**: Config chưa có System Prompt hoặc chưa Active  
**Giải pháp**: Làm theo Bước 3-7 ở trên

### Issue 2: Voice state stuck at "CONNECTING"
**Nguyên nhân**: Turn-Taking chưa bật  
**Giải pháp**: Bật Turn-Taking trong Hume Dashboard (Bước 5)

### Issue 3: Config not found
**Nguyên nhân**: Config ID sai hoặc bị xóa  
**Giải pháp**: Tạo config mới (xem "Giải pháp thay thế")

---

## 📊 Expected Console Logs khi thành công:

```
🎤 Starting interview...
📋 Connection Details:
  - Config ID: fab3a67d-dceb-4840-a6b0-e2c450588d36
  - Access Token (first 20 chars): ...
✅ Interview created, ID: ...
🔌 Connecting to Hume...
✅ Connect function called successfully
🔄 Voice state changed: CONNECTING
🔄 Voice state changed: OPEN  ← Thấy dòng này = thành công!
```

Khi thấy **"Voice state changed: OPEN"**, UI sẽ hiển thị:
- ✅ AI Interviewer header
- ✅ Câu hỏi hiện tại
- ✅ Lịch sử trò chuyện
- ✅ Audio visualizer
- ✅ Nút Mute/Unmute và End Call
