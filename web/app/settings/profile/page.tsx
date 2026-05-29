"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile, type ProfileFormState } from "@/app/actions/profile";

const initialState: ProfileFormState = {};

export default function SettingsProfilePage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateProfile, initialState);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<{
    display_name: string;
    bio: string;
    avatar_url: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((sessionData) => {
        if (!isMounted) return;
        if (!sessionData.authed || sessionData.profileType !== "human_user") {
          router.push("/login");
          return;
        }
        return fetch("/api/profiles/me").then((res) => res.json());
      })
      .then((profile) => {
        if (!isMounted) return;
        if (profile && !profile.error) {
          setInitialData(profile);
        }
      })
      .catch(() => {
        if (isMounted) router.push("/login");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-slate-400">
          Unable to load profile. Please{" "}
          <Link href="/login" className="text-blue-600 underline">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Edit Profile / 编辑资料
      </h1>

      <form
        action={action}
        className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
      >
        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Display Name / 显示名称
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            maxLength={100}
            defaultValue={initialData.display_name}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
          {state?.errors?.displayName && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.displayName.join(", ")}
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Bio / 个人简介
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={500}
            defaultValue={initialData.bio ?? ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            placeholder="Write a short bio..."
          />
          {state?.errors?.bio && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.bio.join(", ")}
            </p>
          )}
        </div>

        {/* Avatar URL */}
        <div>
          <label
            htmlFor="avatarUrl"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Avatar URL / 头像链接
          </label>
          <input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            defaultValue={initialData.avatar_url ?? ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            placeholder="https://example.com/avatar.jpg"
          />
          {state?.errors?.avatarUrl && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.avatarUrl.join(", ")}
            </p>
          )}
        </div>

        {/* General errors */}
        {state?.errors?.general && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {state.errors.general.join(", ")}
          </div>
        )}

        {/* Success message */}
        {state?.message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {pending ? "Saving..." : "Save Changes / 保存更改"}
        </button>
      </form>
    </div>
  );
}
