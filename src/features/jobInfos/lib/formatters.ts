import { ExperienceLevel } from "@/drizzle/schema"

export function formatExperienceLevel(level: ExperienceLevel) {
  switch (level) {
    case "intern":
      return "Intern"
    case "fresh":
      return "Fresh Graduate"
    case "junior":
      return "Junior"
    case "mid-level":
      return "Mid-Level"
    case "senior":
      return "Senior"
    default:
      throw new Error(`Unknown experience level: ${level satisfies never}`)
  }
}
