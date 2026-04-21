import * as React from "react"

import { cn } from "@/lib/utils"

export type ProgressProps = React.ComponentPropsWithoutRef<"div"> & {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const clampedValue =
      typeof value === "number" ? Math.min(100, Math.max(0, value)) : undefined

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedValue}
        data-value={clampedValue ?? ""}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
          className,
        )}
        {...props}
      >
        <div
          className="h-full origin-left bg-primary transition-transform"
          style={
            clampedValue == null
              ? { transform: "scaleX(0)" }
              : { transform: `scaleX(${clampedValue / 100})` }
          }
        />
      </div>
    )
  },
)

Progress.displayName = "Progress"

export { Progress }

