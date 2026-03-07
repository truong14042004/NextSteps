import { NextRequest, NextResponse } from "next/server";

const DEFAULT_REPLY = "Xin loi, hien tai toi khong the tra loi. Vui long thu lai sau.";

function normalizeReply(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (payload == null) return DEFAULT_REPLY;

  if (typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const preferredKeys = ["reply", "text", "message", "response"];

    for (const key of preferredKeys) {
      const value = data[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }

    const firstValue = Object.values(data)[0];
    if (typeof firstValue === "string" && firstValue.trim().length > 0) {
      return firstValue;
    }

    return JSON.stringify(data);
  }

  return String(payload);
}

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();
    if (!webhookUrl) {
      console.error("[chatbot] Missing N8N_WEBHOOK_URL");
      return NextResponse.json({ reply: DEFAULT_REPLY }, { status: 500 });
    }

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "anonymous";

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
      body: JSON.stringify({
        message,
        sessionId,
        timestamp: new Date().toISOString(),
      }),
    });

    const rawBody = await n8nResponse.text();

    if (!n8nResponse.ok) {
      console.error(
        `[chatbot] n8n error ${n8nResponse.status}: ${rawBody.slice(0, 300)}`
      );
      return NextResponse.json({ reply: DEFAULT_REPLY }, { status: 502 });
    }

    let parsedPayload: unknown = rawBody;
    if (rawBody.trim().length > 0) {
      try {
        parsedPayload = JSON.parse(rawBody);
      } catch {
        parsedPayload = rawBody;
      }
    }

    return NextResponse.json({ reply: normalizeReply(parsedPayload) });
  } catch (error) {
    console.error("[chatbot] API error:", error);
    return NextResponse.json({ reply: DEFAULT_REPLY }, { status: 500 });
  }
}
