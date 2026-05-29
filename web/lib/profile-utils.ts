export interface PublicProfile {
  id: string;
  display_number: number;
  display_name: string;
  profile_type: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  last_seen_at: string;
}

export interface OwnProfile extends PublicProfile {
  email: string | null;
}

export function toPublicProfile(internal: Record<string, unknown>): PublicProfile {
  const safe = { ...internal };
  delete safe.email;
  delete safe.password_hash;
  return safe as unknown as PublicProfile;
}
