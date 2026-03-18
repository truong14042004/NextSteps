"use client"

import { type ComponentProps, type ReactNode, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { LoadingSwap } from "@/components/ui/loading-swap"
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function ActionButton({
  action,
  requireAreYouSure = false,
  areYouSureDescription = "This action cannot be undone.",
  successMessage,
  refreshOnSuccess = true,
  ...props
}: ComponentProps<typeof Button> & {
  action: () => Promise<{ error: boolean; message?: string }>
  requireAreYouSure?: boolean
  areYouSureDescription?: ReactNode
  successMessage?: string
  refreshOnSuccess?: boolean
}) {
  const [isLoading, startTransition] = useTransition()
  const router = useRouter()

  function performAction() {
    startTransition(async () => {
      try {
        const data = await action()
        if (data.error) {
          toast.error(data.message ?? "Error")
          return
        }

        if (successMessage) {
          toast.success(successMessage)
        }

        if (refreshOnSuccess) {
          router.refresh()
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Action failed. Please try again."
        )
      }
    })
  }

  if (requireAreYouSure) {
    return (
      <AlertDialog open={isLoading ? true : undefined}>
        <AlertDialogTrigger asChild>
          <Button {...props} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {areYouSureDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={performAction}>
              <LoadingSwap isLoading={isLoading}>Yes</LoadingSwap>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Button
      {...props}
      disabled={props.disabled ?? isLoading}
      onClick={e => {
        performAction()
        props.onClick?.(e)
      }}
    >
      <LoadingSwap
        isLoading={isLoading}
        className="inline-flex items-center gap-2"
      >
        {props.children}
      </LoadingSwap>
    </Button>
  )
}
