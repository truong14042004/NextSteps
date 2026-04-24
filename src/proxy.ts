import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const arcjetKey = process.env.ARCJET_KEY;

const aj =
  arcjetKey != null && arcjetKey !== "placeholder"
    ? arcjet({
        key: arcjetKey,
        rules: [
          shield({ mode: "LIVE" }),
          detectBot({
            mode: "LIVE",
            allow: [
              "CATEGORY:SEARCH_ENGINE",
              "CATEGORY:MONITOR",
              "CATEGORY:PREVIEW",
            ],
          }),
          slidingWindow({
            mode: "LIVE",
            interval: "1m",
            max: 100,
          }),
        ],
      })
    : null;

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (req.nextUrl.pathname === "/api/payments/payos/webhook") {
    return NextResponse.next();
  }

  if (aj == null) return NextResponse.next();

  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      return new Response(null, { status: 403 });
    }
  } catch (error) {
    console.error("Arcjet middleware failed, allowing request:", error);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/payments/payos/webhook|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/((?!api/payments/payos/webhook)(?:api|trpc)(?:.*))",
  ],
};
