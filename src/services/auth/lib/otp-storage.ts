// Simple in-memory OTP storage (development)
// Trong production, dùng Redis hoặc database
type OtpData = {
  otp: string
  expiresAt: number
}

const globalForOtp = globalThis as unknown as {
  otpStorage: Map<string, OtpData>
}

export const otpStorage =
  globalForOtp.otpStorage ?? new Map<string, OtpData>()

if (!globalForOtp.otpStorage) {
  globalForOtp.otpStorage = otpStorage
}

export function storeOtp(email: string, otp: string) {
  otpStorage.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  })
}

export function getStoredOtp(email: string) {
  return otpStorage.get(email)
}

export function deleteOtp(email: string) {
  otpStorage.delete(email)
}

export function isOtpValid(email: string, otp: string): boolean {
  const stored = otpStorage.get(email)

  if (!stored) {
    return false
  }

  if (stored.expiresAt < Date.now()) {
    otpStorage.delete(email)
    return false
  }

  return stored.otp === otp
}
