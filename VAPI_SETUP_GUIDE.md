# 🚀 Hướng dẫn Setup Vapi AI cho Voice Interview

## Bước 1: Tạo tài khoản Vapi

1. Truy cập: https://vapi.ai
2. Sign up với email của bạn
3. Verify email

---

## Bước 2: Tạo Assistant trong Vapi Dashboard

1. **Login vào Vapi Dashboard**: https://dashboard.vapi.ai

2. **Navigate**: Sidebar trái → **"Assistants"** → Click **"Create Assistant"**

3. **Điền thông tin cơ bản**:
   - **Name**: `Interview AI Assistant`
   - **First Message**: `Xin chào! Tôi là AI Interviewer. Tôi sẽ hỏi bạn một vài câu hỏi về kinh nghiệm và kỹ năng. Bạn đã sẵn sàng chưa?`

4. **Tab "System Prompt"**:
   Paste prompt sau:

```
Bạn là một AI interviewer đang tiến hành phỏng vấn tuyển dụng chuyên nghiệp.

Thông tin ứng viên:
- Tên: {{userName}}
- Vị trí ứng tuyển: {{title}}
- Cấp độ kinh nghiệm: {{experienceLevel}}
- Mô tả công việc: {{description}}

Nhiệm vụ của bạn:
1. Hỏi 5 câu hỏi phỏng vấn phù hợp với vị trí và kinh nghiệm
2. Từ tổng quan đến chuyên sâu
3. Lắng nghe và đặt câu hỏi bổ sung nếu cần
4. Giữ giọng điệu chuyên nghiệp nhưng thân thiện
5. Câu hỏi ngắn gọn (1-2 câu), một lần hỏi một câu
6. Kết thúc bằng: "Cảm ơn bạn đã dành thời gian. Buổi phỏng vấn đã hoàn tất."

Hướng dẫn theo cấp độ:
- Intern/Fresh: Khả năng học hỏi, động lực, kiến thức cơ bản
- Junior: Công nghệ cụ thể, kinh nghiệm dự án nhỏ
- Mid-level/Senior: Kỹ thuật sâu, thiết kế hệ thống, lãnh đạo

Nói TIẾNG VIỆT trong toàn bộ cuộc phỏng vấn.
```

5. **Tab "Voice"**:
   - **Provider**: ElevenLabs (hoặc Azure)
   - **Voice**: Chọn giọng Vietnamese nữ (nếu có) hoặc "Rachel" (multilingual)
   - **Speed**: 1.0
   - **Stability**: 0.5

6. **Tab "Model"**:
   - **Model**: GPT-4 hoặc GPT-3.5-turbo
   - **Temperature**: 0.7
   - **Max Tokens**: 150

7. **Tab "Advanced"**:
   - **End Call Message**: "Cảm ơn bạn đã tham gia phỏng vấn."
   - **Enable Recording**: ✅ BẬT (để có transcript)
   - **Enable Background Sound**: ❌ TẮT

8. **Click "Create Assistant"**

9. **QUAN TRỌNG - Copy thông tin sau**:
   - **Assistant ID**: Dạng `asst_xxxxx...` (hiển thị ở đầu trang)
   - **Public Key**: Settings → API Keys → Copy Public Key
   - **Private Key**: Settings → API Keys → Copy Private Key (giữ bí mật!)

---

## Bước 3: Thêm Environment Variables

Mở file `.env.local` và thêm:

```env
# Vapi AI
NEXT_PUBLIC_VAPI_PUBLIC_KEY=pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPI_PRIVATE_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_VAPI_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Lưu ý**: 
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY`: Public key (an toàn, có thể public)
- `VAPI_PRIVATE_KEY`: Private key (BÍ MẬT, chỉ dùng server-side)
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID`: Assistant ID vừa tạo

---

## Bước 4: Verify Setup

Sau khi tôi update code xong, bạn sẽ:

1. Restart dev server: `npm run dev`
2. Vào trang Interview
3. Click "Bắt đầu phỏng vấn"
4. Cho phép microphone
5. Nghe AI chào bằng tiếng Việt

---

## 📊 Free Tier của Vapi

- ✅ **30 phút voice/tháng** (nhiều hơn Hume)
- ✅ Unlimited assistants
- ✅ Full transcript
- ✅ Recording
- ✅ All features

**Đủ để test và demo!**

---

## 🔧 Troubleshooting

### Lỗi "Invalid API Key"
- Kiểm tra đã copy đúng Public/Private Key chưa
- Refresh Vapi Dashboard và copy lại

### Không nghe thấy giọng
- Kiểm tra Voice provider (ElevenLabs hoặc Azure)
- Thử đổi voice khác trong dashboard

### Giọng không phải tiếng Việt
- GPT-4 sẽ tự detect từ system prompt
- Hoặc thử voice provider Azure (có Vietnamese native)

---

**Sau khi setup xong trong Vapi Dashboard, báo tôi để tôi update code!**
