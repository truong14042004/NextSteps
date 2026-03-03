"use client"

import { useEffect, useState } from "react"
import { getUserJobInfosBasic } from "@/features/jobInfos/actions"
import { getInterviewsForJobInfo } from "@/features/interviews/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { Loader2Icon, BriefcaseIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, CheckCircleIcon } from "lucide-react"
import { InterviewJobInfo } from "./page"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

type JobInfoData = Awaited<ReturnType<typeof getUserJobInfosBasic>>[number]
type InterviewData = Awaited<ReturnType<typeof getInterviewsForJobInfo>>

export function PreviousAnalysisOption({
  onSelect,
}: {
  onSelect: (jobInfo: InterviewJobInfo) => void
}) {
  const [jobInfos, setJobInfos] = useState<JobInfoData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  const [interviews, setInterviews] = useState<Record<string, InterviewData>>({})
  const [loadingInterviews, setLoadingInterviews] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getUserJobInfosBasic(10).then(data => {
      setJobInfos(data)
      setLoading(false)
    })
  }, [])

  async function toggleHistory(jobInfoId: string) {
    if (expandedJobId === jobInfoId) {
      setExpandedJobId(null)
      return
    }
    setExpandedJobId(jobInfoId)
    if (interviews[jobInfoId] != null) return

    setLoadingInterviews(prev => ({ ...prev, [jobInfoId]: true }))
    const data = await getInterviewsForJobInfo(jobInfoId)
    setInterviews(prev => ({ ...prev, [jobInfoId]: data }))
    setLoadingInterviews(prev => ({ ...prev, [jobInfoId]: false }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2Icon className="animate-spin size-8" />
      </div>
    )
  }

  if (jobInfos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chưa có phân tích nào</CardTitle>
          <CardDescription>
            Bạn chưa có phân tích CV/JD nào. Hãy tạo phân tích mới hoặc chuyển sang tab
            "Phỏng vấn mới" để bắt đầu.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Chọn một phân tích CV/JD trước đó để bắt đầu phỏng vấn dựa trên thông tin đó:
      </div>
      
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {jobInfos.map(jobInfo => (
            <Card key={jobInfo.id} className="hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BriefcaseIcon className="size-4" />
                      {jobInfo.title || "Không có tiêu đề"}
                    </CardTitle>
                    <CardDescription>
                      <span className="font-medium">{jobInfo.name}</span>
                      {" • "}
                      {formatExperienceLevel(jobInfo.experienceLevel)}
                    </CardDescription>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(jobInfo.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleHistory(jobInfo.id)}
                      className="gap-1"
                    >
                      <ClockIcon className="size-3.5" />
                      Lịch sử
                      {expandedJobId === jobInfo.id
                        ? <ChevronUpIcon className="size-3.5" />
                        : <ChevronDownIcon className="size-3.5" />
                      }
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        onSelect({
                          id: jobInfo.id,
                          title: jobInfo.title || "",
                          name: jobInfo.name,
                          experienceLevel: jobInfo.experienceLevel,
                          description: jobInfo.description,
                        })
                      }
                    >
                      Phỏng vấn
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {jobInfo.description && expandedJobId !== jobInfo.id && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {jobInfo.description}
                  </p>
                </CardContent>
              )}

              {/* Interview history section */}
              {expandedJobId === jobInfo.id && (
                <CardContent className="pt-0 border-t mt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 mt-3">
                    Lịch sử phỏng vấn
                  </p>
                  {loadingInterviews[jobInfo.id] ? (
                    <div className="flex justify-center py-4">
                      <Loader2Icon className="animate-spin size-5" />
                    </div>
                  ) : interviews[jobInfo.id]?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      Chưa có lần phỏng vấn nào
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {interviews[jobInfo.id]?.map(interview => (
                        <Link
                          key={interview.id}
                          href={`/app/interview/${interview.id}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ClockIcon className="size-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">
                                {formatDistanceToNow(new Date(interview.createdAt), {
                                  addSuffix: true,
                                  locale: vi,
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Thời lượng: {interview.duration}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {interview.feedback != null ? (
                              <Badge variant="default" className="gap-1 text-xs">
                                <CheckCircleIcon className="size-3" />
                                Có đánh giá
                              </Badge>
                            ) : (interview.vapiTranscript != null || interview.humeChatId != null) ? (
                              <Badge variant="secondary" className="text-xs">
                                Chưa đánh giá
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Chưa hoàn thành
                              </Badge>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
