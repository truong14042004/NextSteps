import { redirect } from "next/navigation"

export default async function NewQuizPage() {
  redirect("/app/quizzes")
}

