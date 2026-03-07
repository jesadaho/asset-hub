"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users } from "lucide-react";

const PRIMARY = "#068e7b";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/users", label: "ผู้ใช้", icon: Users },
] as const;

export function AdminSideMenu() {
  const pathname = usePathname();

  return (
    <nav
      className="w-52 flex-shrink-0 border-r border-slate-200 bg-white py-6"
      aria-label="เมนู Admin"
    >
      <ul className="space-y-0.5 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                style={isActive ? { color: PRIMARY } : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
