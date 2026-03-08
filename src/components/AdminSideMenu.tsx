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

type AdminSideMenuProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function AdminSideMenu({ mobileOpen = false, onClose }: AdminSideMenuProps) {
  const pathname = usePathname();

  const linkContent = (href: string, label: string, isActive: boolean, Icon: typeof LayoutDashboard) => (
    <>
      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden />
      {label}
    </>
  );

  const navContent = (
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
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              style={isActive ? { color: PRIMARY } : undefined}
            >
              {linkContent(href, label, isActive, Icon)}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Desktop: static sidebar */}
      <nav
        className="hidden w-52 flex-shrink-0 border-r border-slate-200 bg-white py-6 sm:block"
        aria-label="เมนู Admin"
      >
        {navContent}
      </nav>

      {/* Mobile: overlay when open */}
      {mobileOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          aria-label="ปิดเมนู"
        />
      )}

      {/* Mobile: drawer panel */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white py-6 shadow-lg transition-transform duration-200 ease-out sm:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="เมนู Admin"
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between px-4 pb-4">
          <span className="text-sm font-medium text-slate-700">เมนู Admin</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="ปิดเมนู"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {navContent}
      </nav>
    </>
  );
}
