import CVJDAnalysisPage from "../_CVJDAnalysis"
import { getPublishedJobPostForAnalysis } from "@/features/explore/db"
import { getJobInfo } from "@/features/jobInfos/actions"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; postId?: string; jobId?: string }>
}) {
  const params = await searchParams
  const explorePost =
    params.source === "explore" && params.postId
      ? await getPublishedJobPostForAnalysis(params.postId)
      : null

  let jobDraft = null;
  if (params.jobId) {
    const { userId } = await getCurrentUser()
    if (userId) {
      const jobInfo = await getJobInfo(params.jobId, userId)
      if (jobInfo) {
         jobDraft = {
           id: jobInfo.id,
           jobTitle: jobInfo.title ?? jobInfo.name,
           experienceLevel: jobInfo.experienceLevel,
           jobDescription: jobInfo.description
         }
      }
    }
  }

  return (
    <CVJDAnalysisPage
      exploreDraft={
        explorePost
          ? {
              postId: explorePost.id,
              jobTitle: explorePost.positionTitle ?? explorePost.title,
              companyName: explorePost.companyName,
              jobDescription: [
                explorePost.content,
                explorePost.skills ? `\nKỹ năng: ${explorePost.skills}` : "",
                explorePost.location ? `\nĐịa điểm: ${explorePost.location}` : "",
                explorePost.salaryRange ? `\nMức lương: ${explorePost.salaryRange}` : "",
              ].join(""),
            }
          : null
      }
      jobDraft={jobDraft}
    />
  )
}
