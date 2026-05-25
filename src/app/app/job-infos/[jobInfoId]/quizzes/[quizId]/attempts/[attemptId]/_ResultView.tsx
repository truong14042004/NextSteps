import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { QuizAnswer, QuizAttemptStatus } from "@/drizzle/schema"
import { formatQuizAttemptStatus } from "@/features/quizzes/formatters"
import { cn } from "@/lib/utils"

type ResultQuestion = {
  id: string
  order: number
  text: string
  options: string[]
  correctIndex: number
  explanation: string
}

export function ResultView({
  score,
  total,
  status,
  answers,
  questions,
}: {
  score: number
  total: number
  status: QuizAttemptStatus
  answers: QuizAnswer[]
  questions: ResultQuestion[]
}) {
  const selectedByQuestion = new Map(
    answers.map(a => [a.questionId, a.selectedIndex])
  )
  const percent = total === 0 ? 0 : Math.round((score / total) * 100)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold">Kết quả</h2>
            <p className="text-muted-foreground text-sm">
              Trạng thái: {formatQuizAttemptStatus(status)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {score}
              <span className="text-base text-muted-foreground">
                {" "}
                / {total}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">{percent}%</div>
          </div>
        </CardContent>
      </Card>

      <ol className="space-y-3 list-none">
        {questions.map(q => {
          const selected = selectedByQuestion.get(q.id) ?? null
          const isCorrect = selected != null && selected === q.correctIndex
          return (
            <li key={q.id}>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-baseline gap-2 justify-between">
                    <span className="text-sm text-muted-foreground font-mono">
                      Câu {q.order + 1}
                    </span>
                    {selected == null ? (
                      <Badge variant="outline">Bỏ qua</Badge>
                    ) : isCorrect ? (
                      <Badge>Đúng</Badge>
                    ) : (
                      <Badge variant="destructive">Sai</Badge>
                    )}
                  </div>
                  <MarkdownRenderer>{q.text}</MarkdownRenderer>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, idx) => {
                      const isThisCorrect = idx === q.correctIndex
                      const isThisSelected = idx === selected
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "border rounded-md p-3 text-sm flex items-start gap-2",
                            isThisCorrect &&
                              "border-green-500 bg-green-500/10",
                            isThisSelected &&
                              !isThisCorrect &&
                              "border-destructive bg-destructive/10"
                          )}
                        >
                          <span>
                            <strong className="mr-1">
                              {String.fromCharCode(65 + idx)}.
                            </strong>
                            {opt}
                          </span>
                          {isThisCorrect && (
                            <Badge className="ml-auto" variant="secondary">
                              Đáp án đúng
                            </Badge>
                          )}
                          {isThisSelected && !isThisCorrect && (
                            <Badge className="ml-auto" variant="outline">
                              Bạn chọn
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-sm bg-muted/40 rounded-md p-3">
                    <span className="font-medium">Giải thích: </span>
                    {q.explanation}
                  </div>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
