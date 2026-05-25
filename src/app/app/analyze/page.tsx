import CVJDAnalysisPage from "../_CVJDAnalysis"
import { getPublishedJobPostForAnalysis } from "@/features/explore/db"

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; postId?: string }>
}) {
  const params = await searchParams
  const explorePost =
    params.source === "explore" && params.postId
      ? await getPublishedJobPostForAnalysis(params.postId)
      : null

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
    />
  )
}
