import "server-only"

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)
const SALT_BYTES = 16
const KEY_BYTES = 64

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString("hex")
  const key = (await scrypt(password, salt, KEY_BYTES)) as Buffer
  return `${salt}:${key.toString("hex")}`
}

export async function verifyPassword({
  password,
  passwordHash,
}: {
  password: string
  passwordHash: string
}) {
  const [salt, expectedHash] = passwordHash.split(":")
  if (salt == null || expectedHash == null) return false

  const derivedKey = (await scrypt(password, salt, KEY_BYTES)) as Buffer
  const expectedKey = Buffer.from(expectedHash, "hex")
  if (expectedKey.length !== derivedKey.length) return false

  return timingSafeEqual(expectedKey, derivedKey)
}
