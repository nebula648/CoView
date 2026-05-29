import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const body = session
    ? { authed: true, profileId: session.profileId, username: session.username }
    : { authed: false };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
