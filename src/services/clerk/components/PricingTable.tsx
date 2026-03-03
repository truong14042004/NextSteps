"use client"

import { PricingTable as ClerkPricingTable } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Component, ReactNode } from "react"

class PricingTableErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError && process.env.NODE_ENV === "development") {
      return (
        <div className="max-w-4xl mx-auto">
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Billing Not Enabled</AlertTitle>
            <AlertDescription>
              Clerk billing is disabled. To enable the pricing table, visit{" "}
              <a
                href="https://dashboard.clerk.com/last-active?path=billing/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Clerk Billing Settings
              </a>
              .
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Free Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-4">$0</p>
                <p className="text-muted-foreground">
                  Basic features for getting started
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pro Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-4">$XX</p>
                <p className="text-muted-foreground">
                  Advanced features (configure in Clerk)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function PricingTable() {
  return (
    <PricingTableErrorBoundary>
      <ClerkPricingTable newSubscriptionRedirectUrl="/app" />
    </PricingTableErrorBoundary>
  )
}
