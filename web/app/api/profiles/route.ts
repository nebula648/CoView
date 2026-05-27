import { NextRequest, NextResponse } from "next/server";
import {
  createProfile,
  getProfileById,
  touchProfileLastSeen,
} from "@/lib/repository";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const existingProfileId =
    typeof body?.profile_id === "string" ? body.profile_id : null;

  if (existingProfileId) {
    const existing = await getProfileById(existingProfileId);
    if (existing) {
      await touchProfileLastSeen(existingProfileId);
      return NextResponse.json({
        profile_id: existing.id,
        display_name: existing.display_name,
        profile_type: existing.profile_type,
      });
    }
  }

  const profile = await createProfile();
  return NextResponse.json({
    profile_id: profile.id,
    display_name: profile.display_name,
    profile_type: profile.profile_type,
  });
}
