import Link from "next/link";

const ADMIN_NAV = [
  { href: "/admin", label: "Console" },
  { href: "/admin/contents", label: "Contents" },
  { href: "/admin/events", label: "Events" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl">
      {/* Demo warning */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 mb-6">
        <p className="text-xs text-amber-700 font-medium">
          Admin pages are currently public in this demo. Add authentication before
          production use.
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
