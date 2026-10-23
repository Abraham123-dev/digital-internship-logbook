"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Mail, Settings, Shield,
  FileSpreadsheet, History, LogOut, Menu, X, ArrowUpRight
} from "lucide-react";
import { authApi } from "@/lib/api/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Overview",       href: "/admin",              icon: <LayoutDashboard className="size-4" /> },
    { label: "Students",       href: "/admin/students",     icon: <Users className="size-4" /> },
    { label: "Coordinators",   href: "/admin/coordinators", icon: <Shield className="size-4" /> },
    { label: "Invitations",    href: "/admin/invitations",  icon: <Mail className="size-4" /> },
    { label: "Cohorts",        href: "/admin/cohorts",      icon: <Settings className="size-4" /> },
    { label: "Reports",        href: "/admin/reports",      icon: <FileSpreadsheet className="size-4" /> },
    { label: "Audit Log",      href: "/admin/audit",        icon: <History className="size-4" /> },
  ];

  function handleLogout() {
    authApi.logout?.();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#F5F4EF] flex font-sans selection:bg-[#F04D23] selection:text-white text-[#141414]">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-[#EDECE6] border-r border-[#D8D7CE] flex flex-col transition-transform duration-250 ease-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0 shadow-lg lg:shadow-none" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#D8D7CE]">
          <Link href="/admin" className="flex items-center gap-2 group">
            <span className="size-2 rounded-full bg-[#F04D23] group-hover:scale-125 transition-transform shrink-0" />
            <span className="text-[16px] font-extrabold tracking-[-0.03em] text-[#141414]">Logr</span>
            <span className="text-[11px] text-[#7A7973] font-normal ml-0.5">/ Administration</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-[#7A7973] hover:text-[#141414] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Admin Identity Card */}
        <div className="p-4 border-b border-[#D8D7CE]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141414]">
            <div className="size-7 rounded-full bg-[#F04D23] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white truncate">System Admin</p>
              <p className="text-[10px] text-white/50 truncate font-mono">Institutional Governance</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[12.5px] font-medium transition-colors ${
                  active
                    ? "bg-[#141414] text-white"
                    : "text-[#5A5954] hover:text-[#141414] hover:bg-white/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`shrink-0 ${active ? "text-white" : "text-[#7A7973]"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge != null && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      active ? "bg-white text-[#141414]" : "bg-[#F04D23] text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-[#D8D7CE]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-[12px] font-medium text-[#7A7973] hover:text-red-600 hover:bg-red-50/70 transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-5 sm:px-8 bg-[#EDECE6] border-b border-[#D8D7CE] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-[#7A7973] hover:text-[#141414] hover:bg-white/60 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="text-[14px] sm:text-[15px] font-bold text-[#141414]">
                {title || "Institutional Administration"}
              </h1>
              <p className="text-[11px] text-[#7A7973] font-mono">
                {subtitle || "Obafemi Awolowo University &middot; Senate Internship Governance"}
              </p>
            </div>
          </div>

          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        <main className="flex-1 w-full max-w-[1180px] mx-auto px-5 sm:px-8 py-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
