import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";

function expectedToken(): string | null {
  const code = process.env.ADMIN_ACCESS_CODE;
  if (!code) return null;
  return createHash("sha256").update(code).digest("hex").slice(0, 32);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes, excluding /admin/access itself.
  if (!pathname.startsWith("/admin") || pathname === "/admin/access") {
    return NextResponse.next();
  }

  const token = expectedToken();

  // No ADMIN_ACCESS_CODE configured.
  if (!token) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(
        "Admin access is not configured. Set ADMIN_ACCESS_CODE in environment variables.",
        { status: 503 },
      );
    }
    // In development, allow through so the developer can work without a code.
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get("admin_token")?.value;

  if (cookieValue !== token) {
    const accessUrl = new URL("/admin/access", request.url);
    accessUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(accessUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
