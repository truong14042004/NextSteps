import { redirect } from "next/navigation"

// Onboarding is deprecated - users go directly to /app after sign-up
export default function OnboardingPage() {
  redirect("/app")
}
