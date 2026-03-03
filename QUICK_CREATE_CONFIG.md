# 🚀 Hướng dẫn TẠO CONFIG MỚI cho Hume AI (5 phút)

## Tại sao cần tạo mới?
Config cũ `fab3a67d-dceb-4840-a6b0-e2c450588d36` có thể:
- Chưa có template Voice Assistant
- Thiếu Turn-Taking settings
- Chưa được activate đúng cách

→ **Tạo config mới từ template sẽ nhanh và chắc chắn hơn!**

---

## 📋 BƯỚC 1: Tạo Config trong Hume Dashboard

1. **Vào Hume**: https://platform.hume.ai

2. **Navigate**: 
   - Sidebar trái → **EVI** → **Configurations**
   - Click nút **"+ Create"** hoặc **"New Configuration"**

3. **Chọn Template** (QUAN TRỌNG):
   - Nếu có sẵn template: Chọn **"Voice Assistant"** hoặc **"Conversational AI"**
   - Template này đã có Turn-Taking mặc định!
   - Nếu không có template → Chọn "Blank"

4. **Điền thông tin**:
   - **Name**: `Interview AI - Vietnamese`
   - **Description**: `Vietnamese AI Interviewer`

---

## 📋 BƯỚC 2: Cấu hình System Prompt

Trong tab **"System Prompt"** hoặc **"Prompt"**, paste:

```
Bạn là một AI interviewer đang tiến hành phỏng vấn tuyển dụng chuyên nghiệp. Vai trò của bạn:

1. Đặt câu hỏi phù hợp dựa trên kinh nghiệm của ứng viên ({{experienceLevel}}) và vị trí họ ứng tuyển ({{title}}).

2. Thông tin vị trí: {{description}}

3. Thông tin ứng viên:
   - Tên: {{userName}}
   - Vị trí: {{title}}
   - Kinh nghiệm: {{experienceLevel}}

4. Luồng phỏng vấn:
   - Chào hỏi thân thiện, giới thiệu bạn là AI interviewer
   - Hỏi 5 câu hỏi, từ tổng quan đến chuyên sâu
   - Lắng nghe và đặt câu hỏi bổ sung nếu cần
   - Giữ giọng điệu chuyên nghiệp nhưng thân thiện
   - Kết thúc: "Cảm ơn bạn đã dành thời gian. Buổi phỏng vấn đã hoàn tất."

5. Hướng dẫn câu hỏi:
   - Intern/Fresh: Tập trung học hỏi, động lực, kiến thức cơ bản
   - Junior: Công nghệ cụ thể, kinh nghiệm dự án nhỏ
   - Mid-level/Senior: Kỹ thuật sâu, thiết kế hệ thống, lãnh đạo

6. Phong cách:
   - Câu hỏi ngắn gọn (1-2 câu)
   - Một lần hỏi một câu
   - Cho thời gian trả lời
   - Khuyến khích và hỗ trợ

NÓI TIẾNG VIỆT trong toàn bộ cuộc phỏng vấn. Giữ giọng điệu tự nhiên.
```

---

## 📋 BƯỚC 3: Cấu hình Voice

Tab **"Voice"**:
- **Voice Provider**: Hume AI
- **Voice**: **Kora** (giọng nữ, tự nhiên)
- **Language**: English (Kora sẽ tự detect tiếng Việt từ prompt)

---

## 📋 BƯỚC 4: Cấu hình Initial Message

Tab **"Conversation"** hoặc **"Conversation Settings"**:

Tìm phần **"EVI starts conversation"**:
- ✅ **BẬT** toggle
- **Initial message**:
  ```
  Xin chào! Tôi là AI Interviewer. Tôi sẽ hỏi bạn một vài câu hỏi về kinh nghiệm và kỹ năng. Bạn đã sẵn sàng chưa?
  ```

---

## 📋 BƯỚC 5: Kiểm tra Settings khác

### Trong tab **"Conversation Settings"**:

1. **Inactivity timeout**: 
   - Duration: 120 giây (mặc định OK)

2. **Maximum duration**:
   - Duration: 1800 giây (30 phút - mặc định OK)

3. **Nudges**: Có thể disable (không cần thiết)

### Nếu có tab **"Advanced"** hoặc **"Turn-Taking"**:
- ✅ Đảm bảo **Enable Turn-Taking** được BẬT
- ✅ **Allow Interruption**: BẬT

---

## 📋 BƯỚC 6: SAVE & COPY Config ID

1. Click **"Save"** hoặc **"Create Configuration"**

2. Nếu có nút **"Deploy"** hoặc **"Publish"** → Bấm vào!

3. **COPY Config ID** (UUID dài, ví dụ: `abc12345-def6-7890...`)
   - Thường hiển thị ở đầu trang hoặc trong URL
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## 📋 BƯỚC 7: Update Code

Mở file `.env.local` và thay Config ID cũ:

```env
# Thay dòng này:
NEXT_PUBLIC_HUME_CONFIG_ID=fab3a67d-dceb-4840-a6b0-e2c450588d36

# Bằng Config ID mới:
NEXT_PUBLIC_HUME_CONFIG_ID=<paste-config-id-mới-ở-đây>
```

**Ví dụ**:
```env
NEXT_PUBLIC_HUME_CONFIG_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## 📋 BƯỚC 8: TEST

1. **Restart dev server**:
   ```powershell
   npm run dev
   ```

2. **Hard refresh browser**: Ctrl + Shift + R

3. **Vào trang Interview** và bấm "Bắt đầu phỏng vấn"

4. **Kiểm tra Console logs**:
   ```
   ✅ Phải thấy:
   🔄 Voice state changed: CONNECTING
   🔄 Voice state changed: OPEN  ← Dòng này = thành công!
   ```

5. **Nếu thành công**:
   - UI hiển thị "AI Interviewer"
   - Bạn nghe thấy AI chào bằng tiếng Việt
   - Có audio visualizer (thanh sóng nhảy)
   - Có nút Mute và End Call

---

## ⚠️ Nếu vẫn lỗi

### Check lại:

1. **Config ID trong `.env.local`** có đúng không? (copy lại lần nữa)

2. **Restart server** đúng cách chưa?
   - Dừng hẳn (Ctrl+C)
   - Chạy lại: `npm run dev`

3. **Browser cache**: Hard refresh (Ctrl+Shift+R)

4. **Microphone permission**: 
   - Browser có hỏi quyền microphone không?
   - Vào Settings → Allow microphone cho `localhost:3000`

5. **Console logs có gì bất thường?**
   - Copy paste logs lên để tôi xem

---

## 🎯 Expected Result

Khi thành công, bạn sẽ thấy:

**Browser UI:**
```
┌──────────────────────────────────────┐
│  🤖 AI Interviewer                   │
│  Câu hỏi 1/5                        │
├──────────────────────────────────────┤
│  Câu hỏi hiện tại:                  │
│  "Xin chào! Tôi là AI Interviewer..."│
├──────────────────────────────────────┤
│  Lịch sử trò chuyện                 │
│  [Empty hoặc có transcript]          │
├──────────────────────────────────────┤
│  [Audio Visualizer - sóng nhảy]     │
├──────────────────────────────────────┤
│    [🎤 Mute]    [📞 End Call]       │
└──────────────────────────────────────┘
```

**Console logs:**
```
✅ Interview created, ID: xxx
🔌 Connecting to Hume...
🔄 Voice state changed: CONNECTING
🔄 Voice state changed: OPEN
```

**Âm thanh:**
- Nghe thấy giọng nữ (Kora) nói tiếng Việt
- "Xin chào! Tôi là AI Interviewer..."

---

## 💡 Tips

1. **Template mới tốt hơn config cũ**: Tránh lỗi cấu hình
2. **Initial message quan trọng**: Giúp AI bắt đầu cuộc hội thoại
3. **Kora voice hỗ trợ multilingual**: Tự detect tiếng Việt từ prompt
4. **Turn-Taking mặc định trong template Voice Assistant**: Không cần config thủ công

Chúc thành công! 🚀
