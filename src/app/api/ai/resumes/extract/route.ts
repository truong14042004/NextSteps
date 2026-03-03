import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { generateText } from "ai"
import { google } from "@/services/ai/models/google"

export async function POST(req: Request) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return new Response("You are not logged in", { status: 401 })
  }

  const formData = await req.formData()
  const resumeFile = formData.get("resumeFile") as File

  if (!resumeFile) {
    return new Response("Missing resume file", { status: 400 })
  }

  if (resumeFile.size > 10 * 1024 * 1024) {
    return new Response("File size exceeds 10MB limit", { status: 400 })
  }

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]

  if (!allowedTypes.includes(resumeFile.type)) {
    return new Response("Please upload a PDF, Word document, or text file", {
      status: 400,
    })
  }

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: await resumeFile.arrayBuffer(),
            mimeType: resumeFile.type,
          },
        ],
      },
    ],
    system: `Extract and summarize the key information from this CV/resume into a concise plain text summary. Include:
- Full name
- Years of experience
- Key technical skills and technologies
- Notable projects or achievements
- Education background
- Previous job titles and companies

Keep it under 500 words. Return only the summary, no extra formatting.`,
  })

  return new Response(JSON.stringify({ summary: text }), {
    headers: { "Content-Type": "application/json" },
  })
}
