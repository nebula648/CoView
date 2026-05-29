"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";
import {
  getUserByUsername,
  registerUser,
  countRecentEvents,
  recordRateLimitEvent,
} from "@/lib/repository";
import { hashIP } from "@/lib/dedup";

async function getClientIP(): Promise<string> {
  try {
    const hdrs = await headers();
    return (
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    );
  } catch {
    return "127.0.0.1";
  }
}

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const REGISTER_MAX_ATTEMPTS = 3;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export type AuthFormState = {
  errors?: {
    username?: string[];
    password?: string[];
    general?: string[];
  };
  message?: string;
};

export async function signup(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = (formData.get("username") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const confirmPassword = (formData.get("confirm_password") as string) ?? "";

  // Validation
  const errors: AuthFormState["errors"] = {};

  if (!username || username.length < 3) {
    errors.username = ["Username must be at least 3 characters."];
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.username = [
      "Username can only contain letters, numbers, hyphens, and underscores.",
    ];
  }
  if (password.length < 8) {
    errors.password = ["Password must be at least 8 characters."];
  }
  if (password !== confirmPassword) {
    errors.password = errors.password ?? [];
    errors.password.push("Passwords do not match.");
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Rate limit: check registration frequency by IP
  const ip = await getClientIP();
  const recentRegs = await countRecentEvents({
    eventType: "auth_register",
    ipHash: hashIP(ip),
    sinceMs: REGISTER_WINDOW_MS,
  });
  if (recentRegs >= REGISTER_MAX_ATTEMPTS) {
    return {
      errors: {
        general: [
          "Too many registrations from this IP. Please wait before trying again.",
        ],
      },
    };
  }

  // Check existing username
  const existingUsername = await getUserByUsername(username);
  if (existingUsername) {
    return { errors: { username: ["This username is already taken."] } };
  }

  // Hash password and create user
  const passwordHash = hashPassword(password);

  let profile: any;
  try {
    profile = await registerUser({
      username,
      displayName: username,
      passwordHash,
    });
  } catch (e: any) {
    return {
      errors: {
        general: [e?.message ?? "Failed to create account. Please try again."],
      },
    };
  }

  // Record registration event for rate limiting
  await recordRateLimitEvent({
    eventType: "auth_register",
    ipHash: hashIP(ip),
  }).catch(() => {});

  // Clear any stale session, then create new one
  await deleteSession();
  await createSession(profile.id, profile.username ?? profile.display_name);
  redirect("/");
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = (formData.get("username") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";

  if (!username || !password) {
    return {
      errors: { general: ["Please enter both username and password."] },
    };
  }

  // Rate limit
  const ip = await getClientIP();
  const recentFails = await countRecentEvents({
    eventType: "auth_login_failed",
    ipHash: hashIP(ip),
    sinceMs: LOGIN_WINDOW_MS,
  });
  if (recentFails >= LOGIN_MAX_ATTEMPTS) {
    return {
      errors: {
        general: [
          "Too many login attempts. Please wait 5 minutes before trying again.",
        ],
      },
    };
  }

  // Find user by username
  const user = await getUserByUsername(username);
  if (!user || !user.username) {
    // Record failed attempt
    await recordRateLimitEvent({
      eventType: "auth_login_failed",
      ipHash: hashIP(ip),
      extraFields: { username_hash: hashIP(username) },
    }).catch(() => {});
    return { errors: { general: ["Invalid username or password."] } };
  }

  // Verify password
  const valid = verifyPassword(password, user.password_hash ?? "");
  if (!valid) {
    await recordRateLimitEvent({
      eventType: "auth_login_failed",
      ipHash: hashIP(ip),
      extraFields: { username_hash: hashIP(username) },
    }).catch(() => {});
    return { errors: { general: ["Invalid username or password."] } };
  }

  // Clear any stale session, then create new one
  await deleteSession();
  await createSession(user.id, user.username ?? user.display_name);
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/");
}
