"use client"

import { Mic } from "lucide-react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PreviousAnalysisOption } from "./_PreviousAnalysisOption"
import { QuickInterviewOption } from "./_QuickInterviewOption"
import { VapiInterviewCall } from "./_VapiInterviewCall"

export type InterviewJobInfo = {
  id: string
  title: string
  name: string
  experienceLevel: string
  description: string
  cvSummary?: string
}

export default function InterviewPage() {
  const [selectedJobInfo, setSelectedJobInfo] =
    useState<InterviewJobInfo | null>(null)

  if (selectedJobInfo) {
    return <VapiInterviewCall jobInfo={selectedJobInfo} onBack={() => setSelectedJobInfo(null)} />
  }

  return (
    <div className="container max-w-4xl py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mic className="size-8" />
          Phỏng vấn AI
        </h1>
        <p className="text-muted-foreground">
          Luyện tập phỏng vấn thử với AI thông minh. Chọn một trong hai cách để
          bắt đầu:
        </p>
      </div>

      <Tabs defaultValue="previous" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="previous">Sử dụng phân tích trước</TabsTrigger>
          <TabsTrigger value="new">Tạo phỏng vấn mới</TabsTrigger>
        </TabsList>
        
        <TabsContent value="previous" className="mt-6">
          <PreviousAnalysisOption onSelect={setSelectedJobInfo} />
        </TabsContent>
        
        <TabsContent value="new" className="mt-6">
          <QuickInterviewOption onSelect={setSelectedJobInfo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
