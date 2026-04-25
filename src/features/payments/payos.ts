import "server-only"

import { PayOS } from "@payos/node"
import { and, eq, ne } from "drizzle-orm"

import { env } from "@/data/env/server"
import { db } from "@/drizzle/db"
import {
  AdminPlanTable,
  PaymentTransactionTable,
  type PaymentStatus,
} from "@/drizzle/schema"
import { activateSubscriptionFromPayment } from "@/features/plans/entitlements"

const PAID_STATUSES = new Set(["PAID", "paid"])
const CANCELLED_STATUSES = new Set(["CANCELLED", "cancelled"])
const EXPIRED_STATUSES = new Set(["EXPIRED", "expired"])
const FAILED_STATUSES = new Set(["FAILED", "UNDERPAID", "failed"])

function isConfigured(value: string) {
  return value.length > 0 && value !== "placeholder"
}

function getPayOSClient() {
  if (
    !isConfigured(env.PAYOS_CLIENT_ID) ||
    !isConfigured(env.PAYOS_API_KEY) ||
    !isConfigured(env.PAYOS_CHECKSUM_KEY)
  ) {
    throw new Error("PAYOS_NOT_CONFIGURED")
  }

  return new PayOS({
    clientId: env.PAYOS_CLIENT_ID,
    apiKey: env.PAYOS_API_KEY,
    checksumKey: env.PAYOS_CHECKSUM_KEY,
    timeout: 15_000,
    maxRetries: 1,
    logLevel: "warn",
  })
}

function createOrderCode() {
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")

  return Number(`${Date.now()}${randomSuffix}`)
}

function mapPayOSStatus(status: string): PaymentStatus {
  if (PAID_STATUSES.has(status)) return "paid"
  if (CANCELLED_STATUSES.has(status)) return "cancelled"
  if (EXPIRED_STATUSES.has(status)) return "expired"
  if (FAILED_STATUSES.has(status)) return "failed"
  return "pending"
}

async function markTransactionStatus(
  orderCode: number,
  status: PaymentStatus,
  providerPayload: unknown
) {
  const existing = await db.query.PaymentTransactionTable.findFirst({
    where: eq(PaymentTransactionTable.orderCode, orderCode),
    columns: {
      id: true,
      userId: true,
      planId: true,
      planKey: true,
      status: true,
    },
  })

  if (existing == null) return null

  const paidAt = status === "paid" ? new Date() : undefined
  const where =
    status === "paid"
      ? and(
          eq(PaymentTransactionTable.orderCode, orderCode),
          ne(PaymentTransactionTable.status, "paid")
        )
      : eq(PaymentTransactionTable.orderCode, orderCode)

  const [transaction] = await db
    .update(PaymentTransactionTable)
    .set({
      status,
      providerPayload,
      ...(paidAt != null ? { paidAt } : {}),
    })
    .where(where)
    .returning()

  if (status === "paid" && transaction != null) {
    await activateSubscriptionFromPayment({
      userId: existing.userId,
      planId: existing.planId,
      planKey: existing.planKey,
      paymentTransactionId: existing.id,
    })
  }

  return transaction ?? null
}

export async function createPayOSPaymentLink({
  userId,
  planKey,
  buyerEmail,
  origin,
}: {
  userId: string
  planKey: string
  buyerEmail?: string
  origin: string
}) {
  const plan = await db.query.AdminPlanTable.findFirst({
    where: and(eq(AdminPlanTable.key, planKey), eq(AdminPlanTable.isActive, true)),
  })

  if (plan == null) {
    return { ok: false as const, status: 404, message: "Goi khong ton tai hoac dang tat." }
  }

  if (plan.monthlyPrice <= 0) {
    return {
      ok: false as const,
      status: 400,
      message: "Goi mien phi khong can thanh toan.",
    }
  }

  const orderCode = createOrderCode()
  const description = `NextSteps ${plan.key}`.slice(0, 25)

  await db.insert(PaymentTransactionTable).values({
    userId,
    planId: plan.id,
    planKey: plan.key,
    orderCode,
    amount: plan.monthlyPrice,
    currency: "VND",
    status: "pending",
  })

  try {
    const payOS = getPayOSClient()
    const successUrl = new URL("/checkout/success", origin)
    successUrl.searchParams.set("orderCode", String(orderCode))
    const cancelUrl = new URL("/checkout/cancel", origin)
    cancelUrl.searchParams.set("orderCode", String(orderCode))

    const paymentLink = await payOS.paymentRequests.create({
      orderCode,
      amount: plan.monthlyPrice,
      description,
      returnUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      buyerEmail,
      items: [
        {
          name: plan.name,
          quantity: 1,
          price: plan.monthlyPrice,
        },
      ],
    })

    const [transaction] = await db
      .update(PaymentTransactionTable)
      .set({
        paymentLinkId: paymentLink.paymentLinkId,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
        providerPayload: paymentLink,
      })
      .where(eq(PaymentTransactionTable.orderCode, orderCode))
      .returning()

    return {
      ok: true as const,
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode,
      transaction,
    }
  } catch (error) {
    await db
      .update(PaymentTransactionTable)
      .set({
        status: "failed",
        providerPayload: {
          message: error instanceof Error ? error.message : "Unknown payOS error",
        },
      })
      .where(eq(PaymentTransactionTable.orderCode, orderCode))

    if (error instanceof Error && error.message === "PAYOS_NOT_CONFIGURED") {
      return {
        ok: false as const,
        status: 500,
        message: "Chua cau hinh PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY.",
      }
    }

    return {
      ok: false as const,
      status: 502,
      message: "Khong tao duoc link thanh toan payOS.",
    }
  }
}

export async function syncPayOSTransaction(orderCode: number, userId?: string) {
  const transaction = await db.query.PaymentTransactionTable.findFirst({
    where:
      userId == null
        ? eq(PaymentTransactionTable.orderCode, orderCode)
        : and(
            eq(PaymentTransactionTable.orderCode, orderCode),
            eq(PaymentTransactionTable.userId, userId)
          ),
  })

  if (transaction == null) {
    return { ok: false as const, status: 404, message: "Khong tim thay giao dich." }
  }

  if (transaction.status === "paid") {
    return { ok: true as const, transaction }
  }

  try {
    const payOS = getPayOSClient()
    const paymentLink = await payOS.paymentRequests.get(orderCode)
    const status = mapPayOSStatus(paymentLink.status)
    const updated = await markTransactionStatus(orderCode, status, paymentLink)

    return { ok: true as const, transaction: updated ?? transaction }
  } catch {
    return { ok: true as const, transaction }
  }
}

export async function verifyPayOSWebhook(payload: unknown) {
  const payOS = getPayOSClient()
  const data = await payOS.webhooks.verify(payload as Parameters<typeof payOS.webhooks.verify>[0])
  const status = data.code === "00" ? "paid" : mapPayOSStatus(data.code)
  const transaction = await markTransactionStatus(data.orderCode, status, data)

  return { data, transaction }
}
