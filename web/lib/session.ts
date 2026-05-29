import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getSecret(): Uint8Array {
  const secret = process.env.COVIEW_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "COVIEW_SESSION_SECRET is not set. Please set it in your environment variables.",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  profileId: string;
  username: string;
}

const COOKIE_NAME = "coview_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(
  profileId: string,
  username: string,
): Promise<void> {
  const secret = getSecret();
  const expiresAt = new Date(Date.now() + MAX_AGE_MS);

  const token = await new SignJWT({ profileId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  let secret: Uint8Array;
  try {
    secret = getSecret();
  } catch {
    return null;
  }

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
