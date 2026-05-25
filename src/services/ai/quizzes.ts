import { JobInfoTable } from "@/drizzle/schema"
import { generateObject } from "ai"
import { z } from "zod"
import { google } from "./models/google"

export const QUIZ_QUESTION_COUNT = 30
export const QUIZ_DURATION_SECONDS = 45 * 60
export const QUIZ_MAX_ATTEMPTS = 5

const quizQuestionSchema = z.object({
  text: z
    .string()
    .min(8)
    .describe("The question text. Markdown is allowed for code snippets."),
  options: z
    .array(z.string().min(1))
    .length(4)
    .describe("Exactly four answer options."),
  correctIndex: z
    .number()
    .int()
    .min(0)
    .max(3)
    .describe("Zero-based index of the correct answer in options."),
  explanation: z
    .string()
    .min(8)
    .describe("Short explanation of why the correct answer is correct."),
})

export const quizSchema = z.object({
  questions: z.array(quizQuestionSchema).length(QUIZ_QUESTION_COUNT),
})

export type GeneratedQuiz = z.infer<typeof quizSchema>
export type GeneratedQuizQuestion = z.infer<typeof quizQuestionSchema>

export async function generateAiQuiz({
  jobInfo,
}: {
  jobInfo: Pick<
    typeof JobInfoTable.$inferSelect,
    "title" | "description" | "experienceLevel"
  >
}): Promise<GeneratedQuiz> {
  const result = await generateObject({
    model: google("gemini-3.1-flash"),
    schema: quizSchema,
    system: `You generate technical multiple-choice quizzes tailored to a candidate's target role.

Job context:
- Description: \`${jobInfo.description}\`
- Experience level: \`${jobInfo.experienceLevel}\`
${jobInfo.title ? `- Title: \`${jobInfo.title}\`\n` : ""}

Hard rules:
- Produce EXACTLY ${QUIZ_QUESTION_COUNT} questions. No more, no less.
- Each question has EXACTLY 4 distinct options.
- Exactly one option per question is correct; set "correctIndex" (0-3) accordingly.
- Vary the correctIndex across questions (do NOT default to 0 every time).
- Cover a mix of topics drawn from the job description (frameworks, languages, system design, debugging, best practices) rather than only one topic.
- Calibrate difficulty to the experience level. Avoid trivia; prefer realistic, applied scenarios.
- Provide a concise but informative "explanation" for each question (1-3 sentences).
- Keep each question self-contained — do not reference other questions.
- Return strictly valid JSON matching the schema; no preamble.`,
    prompt: `Generate the quiz now.`,
  })

  return result.object
}
