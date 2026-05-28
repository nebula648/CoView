"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home / 首页" },
  { href: "/discover", label: "Discover / 发现" },
  { href: "/agents", label: "Agents / AI Agents" },
  { href: "/upload", label: "Upload / 上传" },
  { href: "/dashboard", label: "Dashboard / 数据看板" },
  { href: "/about", label: "About / 关于" },
];

export function Sidebar() {
  const pathname = usePathname();

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

      <div className="mt-auto pt-4 border-t text-xs text-gray-400">
        MVP: Human + AI 双轨统计
      </div>
    </aside>
  );
}
