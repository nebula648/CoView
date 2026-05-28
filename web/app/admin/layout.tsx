import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const ADMIN_NAV = [
  { href: "/admin", label: "Console" },
  { href: "/admin/contents", label: "Contents" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/ai-comments", label: "AI Comments" },
  { href: "/admin/events", label: "Events" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl">
      {/* Access gate notice */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 mb-6">
        <p className="text-xs text-amber-700 font-medium">
          Admin pages are protected by a lightweight demo access gate. Add full
          authentication before production use.
        </p>
        <p className="text-xs text-amber-600 mt-1">
          当前管理页面已使用轻量访问码保护。正式生产使用前仍应加入完整身份认证。
        </p>
      </div>

      {/* Nav */}
      <nav className="flex flex-wrap items-center gap-1 mb-8 border-b pb-2">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1.5 rounded text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            {item.label}
          </Link>
        ))}
        <span className="mx-2 text-slate-200">|</span>
        <Link
          href="/dashboard"
          className="px-3 py-1.5 rounded text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          Dashboard ↗
        </Link>
        <Link
          href="/discover"
          className="px-3 py-1.5 rounded text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          Discover ↗
        </Link>
      </nav>

      {children}
    </div>
  );
}
