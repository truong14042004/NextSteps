"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For trying out core interview prep features.",
    features: ["1 interview", "5 questions", "Basic resume analysis"],
    cta: "Start Free",
    href: "/sign-up",
  },
  {
    name: "Pro",
    price: "Contact us",
    description: "For power users who need unlimited preparation.",
    features: [
      "Unlimited interviews",
      "Unlimited questions",
      "Unlimited resume analysis",
    ],
    cta: "Upgrade",
    href: "/app/upgrade",
    highlight: true,
  },
]

export function PricingTable() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {plans.map(plan => (
        <Card key={plan.name} className={plan.highlight ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{plan.name}</CardTitle>
              {plan.highlight ? <Badge>Popular</Badge> : null}
            </div>
            <p className="text-3xl font-bold">{plan.price}</p>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {plan.features.map(feature => (
                <li key={feature}>- {feature}</li>
              ))}
            </ul>
            <Button asChild className="w-full">
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
