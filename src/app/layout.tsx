import type { Metadata } from "next"
import { Be_Vietnam_Pro } from "next/font/google"
import "./globals.css"

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { ChatWidget } from "@/components/chatbot/ChatWidget"

const appSans = Be_Vietnam_Pro({
  variable: "--font-outfit-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})
 
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nextsteps1.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NextStep - Luyện phỏng vấn & chuẩn bị nghề nghiệp với AI",
    template: "%s | NextStep",
  },
  description:
    "NextStep giúp bạn luyện phỏng vấn với AI, tạo câu hỏi theo từng vị trí công việc, nhận phản hồi chi tiết và kết nối cơ hội nghề nghiệp.",
  keywords: [
    "NextStep",
    "luyện phỏng vấn",
    "phỏng vấn AI",
    "chuẩn bị phỏng vấn",
    "tìm việc làm",
    "AI tuyển dụng",
    "mock interview",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "NextStep",
    title: "NextStep - Luyện phỏng vấn & chuẩn bị nghề nghiệp với AI",
    description:
      "Luyện phỏng vấn với AI, tạo câu hỏi theo từng vị trí công việc và nhận phản hồi chi tiết để tự tin chinh phục nhà tuyển dụng.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NextStep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextStep - Luyện phỏng vấn & chuẩn bị nghề nghiệp với AI",
    description:
      "Luyện phỏng vấn với AI, tạo câu hỏi theo từng vị trí công việc và nhận phản hồi chi tiết.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}
 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const chatbotConfig = {
    // ✅ Endpoint đúng là /api/chat (prefix /api từ main.py)
    webhookUrl: `${process.env.NEXT_PUBLIC_CHATBOT_API_URL ?? "https://chatbot-ns2-pq3z.onrender.com"}/api/chat`,
    botName: "NextSteps AI",
    botAvatar: "/bot_avatar.jpg",
    theme: {
      primaryColor: "#3b82f6",
      backgroundColor: "#ffffff",
      userBubbleColor: "#3b82f6",
      botBubbleColor: "#f3f4f6",
    },
  }
 
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${appSans.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableColorScheme
          disableTransitionOnChange
        >
          {children}
          <ChatWidget config={chatbotConfig} />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
