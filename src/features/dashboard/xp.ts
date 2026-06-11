export type DashboardStats = {
  totalQuizAttempts: number
  totalInterviews: number
  totalAnalyses: number
  averageQuizPercent: number | null
  bestQuizPercent: number | null
  perfectScoreCount: number
  streakDays: number
  activeDaysLast30: number
}

export const LEVELS = [
  { threshold: 0, label: "Career Starter" },
  { threshold: 200, label: "CV Builder" },
  { threshold: 500, label: "Quiz Apprentice" },
  { threshold: 1000, label: "Interview Prep" },
  { threshold: 2000, label: "Career Builder" },
  { threshold: 3500, label: "Top Candidate" },
  { threshold: 5500, label: "Interview Pro" },
  { threshold: 8000, label: "Career Expert" },
]

export function computeXP(stats: DashboardStats): number {
  return (
    stats.totalAnalyses * 80 +
    stats.totalQuizAttempts * 50 +
    stats.totalInterviews * 120 +
    stats.activeDaysLast30 * 10 +
    stats.perfectScoreCount * 200 +
    stats.streakDays * 15
  )
}

export function computeLevel(xp: number): { level: number; label: string } {
  let levelIdx = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].threshold) {
      levelIdx = i
    }
  }
  // Level is index + 1 (1-based level)
  return {
    level: levelIdx + 1,
    label: LEVELS[levelIdx].label
  }
}

export function getLevelProgress(xp: number): {
  progressPercent: number
  nextThreshold: number | null
  currentThreshold: number
} {
  let currentLevelIdx = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].threshold) {
      currentLevelIdx = i
    }
  }

  const currentThreshold = LEVELS[currentLevelIdx].threshold
  const nextLevel = LEVELS[currentLevelIdx + 1]

  if (!nextLevel) {
    return {
      progressPercent: 100,
      nextThreshold: null,
      currentThreshold,
    }
  }

  const nextThreshold = nextLevel.threshold
  const range = nextThreshold - currentThreshold
  const gained = xp - currentThreshold
  const progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)))

  return {
    progressPercent,
    nextThreshold,
    currentThreshold,
  }
}
