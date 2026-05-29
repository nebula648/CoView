"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home / 首页" },
  { href: "/discover", label: "Discover / 发现" },
  { href: "/agents", label: "Agents / AI Agents" },
  { href: "/upload", label: "Upload / 上传" },
  { href: "/dashboard", label: "Dashboard / 数据看板" },
  { href: "/about", label: "About / 关于" },
];

interface SessionInfo {
  authed: boolean;
  username?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch(() => setSession({ authed: false }));
  }, []);

  // Re-fetch session on path change (handles redirect after login/register)
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch(() => setSession({ authed: false }));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({ authed: false });
      router.refresh();
    } catch {
      // Fallback: reload the page
      window.location.href = "/";
    }
  };

  return (
    <aside className="w-56 min-h-full border-r bg-[var(--sidebar-bg)] p-4 flex flex-col gap-1 shrink-0">
      <Link href="/" className="text-lg font-bold mb-4 hover:opacity-80">
        CoView 共览
      </Link>

      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              isActive
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t text-xs text-gray-400 flex flex-col gap-2">
        {session === null ? (
          <span className="text-gray-300">Loading...</span>
        ) : session.authed ? (
          <div className="flex flex-col gap-1">
            <span className="text-slate-600 font-medium truncate">
              {session.username ?? "User"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-left text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              Sign Out / 退出
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            Sign In / 登录
          </Link>
        )}
      </div>
    </aside>
  );
}
