"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";
import { redirect } from "next/navigation";

export async function validateAccess(formData: FormData) {
  const code = (formData.get("code") as string)?.trim() ?? "";
  const redirectTo = (formData.get("redirect") as string) || "/admin";
  const expected = process.env.ADMIN_ACCESS_CODE;

  if (!expected) {
    redirect(
      `/admin/access?error=${encodeURIComponent("Admin access code is not configured on the server.")}&redirect=${encodeURIComponent(redirectTo)}`,
    );
  }

  if (!code || code !== expected) {
    redirect(
      `/admin/access?error=${encodeURIComponent("Invalid access code. Please try again.")}&redirect=${encodeURIComponent(redirectTo)}`,
    );
  }

  const token = createHash("sha256").update(code).digest("hex").slice(0, 32);
  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
    secure: process.env.NODE_ENV === "production",
  });

  redirect(redirectTo);
}
