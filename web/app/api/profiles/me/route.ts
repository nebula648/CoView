import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserProfileOwn } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const profile = await getUserProfileOwn(session.profileId);
  if (!profile || profile.profile_type !== "human_user") {
    return NextResponse.json({ error: "Not a registered user" }, { status: 403 });
  }
  return NextResponse.json(profile, {
    headers: { "Cache-Control": "no-store" },
  });
}
