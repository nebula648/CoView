"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signup, initialState);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm">
        <div className="px-6 py-8">
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            Create Account / 创建账号
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Register a CoView human user account.
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
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="At least 8 characters"
              />
              {state?.errors?.password && (
                <p className="mt-1 text-xs text-red-600">
                  {state.errors.password.join(", ")}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Confirm Password / 确认密码
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="Repeat your password"
              />
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
              {pending ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400 text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-slate-700 underline hover:text-slate-900"
            >
              Sign in / 登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
