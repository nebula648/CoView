"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm">
        <div className="px-6 py-8">
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            Sign In / 登录
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Sign in to your CoView account.
          </p>

          <form action={action} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Username / 用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="your_username"
              />
              {state?.errors?.username && (
                <p className="mt-1 text-xs text-red-600">
                  {state.errors.username.join(", ")}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password / 密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="Enter password"
              />
              {state?.errors?.password && (
                <p className="mt-1 text-xs text-red-600">
                  {state.errors.password.join(", ")}
                </p>
              )}
            </div>

            {state?.errors?.general && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {state.errors.general.join(", ")}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {pending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400 text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-slate-700 underline hover:text-slate-900"
            >
              Create one / 创建账号
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
