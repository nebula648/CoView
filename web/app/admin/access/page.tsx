import { validateAccess } from "./actions";
import { SubmitButton } from "./submit-button";

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const { error, redirect: redirectTo } = await searchParams;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm">
        <div className="px-6 py-8">
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            Admin Access / 管理后台访问
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Enter the admin access code to continue.
          </p>

          <form action={validateAccess} className="space-y-4">
            <input
              type="hidden"
              name="redirect"
              value={redirectTo ?? "/admin"}
            />

            <div>
              <label
                htmlFor="code"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Admin Access Code
              </label>
              <input
                id="code"
                name="code"
                type="password"
                autoComplete="off"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="Enter access code"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <SubmitButton />
          </form>

          <p className="mt-6 text-xs text-slate-400 leading-relaxed">
            This is a lightweight demo access gate, not a formal login system.
            If you do not have the access code, please return to the public
            pages.
          </p>
        </div>
      </div>
    </div>
  );
}
