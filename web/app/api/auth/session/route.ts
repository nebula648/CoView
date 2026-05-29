import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProfileById } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authed: false });
  }

  const profile = await getProfileById(session.profileId);
  const body = {
    authed: true,
    profileId: session.profileId,
    username: session.username,
    profileType: profile?.profile_type ?? "human_guest",
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
