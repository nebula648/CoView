import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;
// N=16384 (2^14) is the OWASP minimum recommendation.
// Using this instead of 2^17 (131072) because Node.js on Windows
// hits memory limits at higher values.  Adjust upward for production.
const N = 16384;
const R = 8;
const P = 1;
const FORMAT_MARKER = "scrypt";

export function hashPassword(password: string): string {
  const salt = randomBytes(32).toString("base64url");
  const derived = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  const hash = derived.toString("base64url");
  return [FORMAT_MARKER, N, R, P, salt, hash].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || typeof stored !== "string") return false;

  const parts = stored.split("$");
  if (parts.length !== 6) return false;
  if (parts[0] !== FORMAT_MARKER) return false;

  const [, nStr, rStr, pStr, salt, expectedB64] = parts;
  const n = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);

  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (n <= 0 || r <= 0 || p <= 0) return false;
  if (!salt) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(expectedB64, "base64url");
  } catch {
    return false;
  }

  let derived: Buffer;
  try {
    derived = scryptSync(password, salt, KEYLEN, { N: n, r, p });
  } catch {
    return false;
  }

  if (derived.length !== expected.length) return false;

  return timingSafeEqual(derived, expected);
}
