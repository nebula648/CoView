"use client";

const PROFILE_ID_KEY = "coview_profile_id";
const DISPLAY_NAME_KEY = "coview_display_name";

export interface VisitorProfile {
  profileId: string;
  displayName: string;
  profileType: string;
}

export function getStoredVisitorProfile(): VisitorProfile | null {
  const profileId = window.localStorage.getItem(PROFILE_ID_KEY);
  const displayName = window.localStorage.getItem(DISPLAY_NAME_KEY);
  if (!profileId || !displayName) return null;
  return {
    profileId,
    displayName,
    profileType: "human_guest",
  };
}

export async function ensureVisitorProfile(): Promise<VisitorProfile> {
  const stored = getStoredVisitorProfile();
  const res = await fetch("/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: stored?.profileId ?? null,
    }),
  });

  if (!res.ok) {
    throw new Error("Unable to create visitor profile.");
  }

  const profile = await res.json();
  const visitorProfile = {
    profileId: profile.profile_id,
    displayName: profile.display_name,
    profileType: profile.profile_type,
  };

  window.localStorage.setItem(PROFILE_ID_KEY, visitorProfile.profileId);
  window.localStorage.setItem(DISPLAY_NAME_KEY, visitorProfile.displayName);

  return visitorProfile;
}
