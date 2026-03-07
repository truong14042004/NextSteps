import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    // Gửi request đến n8n webhook
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n error: ${n8nResponse.status}`);
    }

    const n8nData = await n8nResponse.json();
    
    console.log('N8N Response:', n8nData);
    console.log('N8N Response Type:', typeof n8nData);
    console.log('N8N Response Keys:', Object.keys(n8nData));

    // Xử lý response từ N8N - có thể là text plain hoặc object
    let replyText = "Xin lỗi, tôi không thể xử lý yêu cầu này.";
    
    if (typeof n8nData === 'string') {
      // Nếu response là text plain
      replyText = n8nData;
    } else if (typeof n8nData === 'object' && n8nData !== null) {
      // Nếu response là object
      if (n8nData.reply) {
        replyText = n8nData.reply;
      } else if (n8nData.text) {
        replyText = n8nData.text;
      } else if (n8nData.message) {
        replyText = n8nData.message;
      } else {
        // Lấy giá trị đầu tiên nếu không có key chuẩn
        const firstValue = Object.values(n8nData)[0];
        replyText = typeof firstValue === 'string' ? firstValue : JSON.stringify(n8nData);
      }
    }

    return NextResponse.json({
      reply: replyText,
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { reply: "Xin lỗi, hiện tại tôi không thể trả lời. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}