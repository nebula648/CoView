"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { updateUserProfile, getUserProfileOwn } from "@/lib/repository";

export type ProfileFormState = {
  errors?: {
    displayName?: string[];
    bio?: string[];
    avatarUrl?: string[];
    general?: string[];
  };
  message?: string;
};

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session) {
    return { errors: { general: ["You must be signed in."] } };
  }

  const profile = await getUserProfileOwn(session.profileId);
  if (!profile || profile.profile_type !== "human_user") {
    return { errors: { general: ["Only registered users can edit their profile."] } };
  }

  const displayName = (formData.get("displayName") as string)?.trim() ?? "";
  const bio = (formData.get("bio") as string)?.trim() || null;
  const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;

  const errors: ProfileFormState["errors"] = {};
  if (!displayName || displayName.length < 1) {
    errors.displayName = ["Display name is required."];
  }
  if (displayName.length > 100) {
    errors.displayName = ["Display name must be 100 characters or fewer."];
  }
  if (bio && bio.length > 500) {
    errors.bio = ["Bio must be 500 characters or fewer."];
  }
  if (avatarUrl) {
    try {
      const url = new URL(avatarUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.avatarUrl = ["Avatar URL must use http or https."];
      }
    } catch {
      errors.avatarUrl = ["Please enter a valid URL."];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await updateUserProfile(session.profileId, {
      displayName,
      bio,
      avatarUrl,
    });
    revalidatePath(`/users/${profile.username}`);
    revalidatePath("/settings/profile");
    return { message: "Profile updated successfully." };
  } catch (e: any) {
    return { errors: { general: [e?.message ?? "Failed to update profile."] } };
  }
}
