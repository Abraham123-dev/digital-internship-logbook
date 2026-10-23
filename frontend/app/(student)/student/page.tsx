"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Calendar, CheckCircle2, Clock, ArrowUpRight,
  LayoutDashboard, FileText, Star, User, LogOut, ChevronRight,
  PenLine, AlertCircle, Menu, X,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────── */
type NavItem = { label: string; href: string; icon: React.ReactNode; active?: boolean };

/* ── Logo ───────────────────────────────────────────────── */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <span className="size-2 rounded-full bg-[#F04D23] group-hover:scale-125 transition-transform shrink-0" />
      <span className="text-[16px] font-extrabold tracking-[-0.03em] text-[#141414]">Logr</span>
      <span className="text-[10px] text-[#9A9990] font-normal ml-0.5">/ OAU</span>
    </Link>
  );
}

/* ── Sidebar ─────────────────────────────────────────────── */
function Sidebar({ nav, open, onClose }: { nav: NavItem[]; open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-[#EDECE6] border-r border-[#D8D7CE] flex flex-col transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto ${open ? "translate-x-0" : "-translate-x-full"}`}>

        <div className="h-16 flex items-center justify-between px-5 border-b border-[#D8D7CE]">
          <Logo />
          <button onClick={onClose} className="lg:hidden text-[#7A7973] hover:text-[#141414]">
            <X className="size-4" />
          </button>
        </div>

        {/* Profile pill */}
        <div className="px-4 py-4 border-b border-[#D8D7CE]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#E8E7E1]">
            <div className="size-7 rounded-full bg-[#F04D23] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              AO
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#141414] truncate">Ada Okafor</p>
              <p className="text-[10px] text-[#9A9990] font-mono truncate">CSC/2021/042 · SWEP</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors
                ${item.active
                  ? "bg-[#141414] text-white"
                  : "text-[#5A5954] hover:text-[#141414] hover:bg-white/70"}`}>
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-5 border-t border-[#D8D7CE] pt-3">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#7A7973] hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Stat card ─────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-2 ${accent ? "bg-[#141414] border-[#141414]" : "bg-white border-[#E8E7E1]"}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${accent ? "text-white/50" : "text-[#9A9990]"}`}>{label}</p>
      <p className={`text-[2rem] font-extrabold tracking-[-0.04em] leading-none ${accent ? "text-white" : "text-[#141414]"}`}>{value}</p>
      <p className={`text-[11px] ${accent ? "text-white/40" : "text-[#9A9990]"}`}>{sub}</p>
    </div>
  );
}

/* ── Entry row ──────────────────────────────────────────── */
function EntryRow({ day, tasks, status }: { day: string; tasks: string; status: "done" | "pending" | "missed" }) {
  const badges = {
    done: <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><CheckCircle2 className="size-2.5" />Logged</span>,
    pending: <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"><Clock className="size-2.5" />Pending</span>,
    missed: <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200"><AlertCircle className="size-2.5" />Missed</span>,
  };
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[#F0EFE9] last:border-0">
      <div className="w-16 shrink-0">
        <p className="text-[11px] font-mono font-medium text-[#9A9990]">{day}</p>
      </div>
      <p className="flex-1 text-[12px] text-[#3A3934] leading-snug line-clamp-1">{tasks}</p>
      <div className="shrink-0">{badges[status]}</div>
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────────────── */
export default function StudentDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav: NavItem[] = [
    { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="size-4" />, active: true },
    { label: "Logbook", href: "/student/week", icon: <BookOpen className="size-4" /> },
    { label: "Daily Entry", href: "/student/day", icon: <PenLine className="size-4" /> },
    { label: "Attendance", href: "/student/attendance", icon: <Calendar className="size-4" /> },
    { label: "Reviews", href: "/student/reviews", icon: <Star className="size-4" /> },
    { label: "Profile", href: "/student/profile", icon: <User className="size-4" /> },
  ];

  const weekEntries = [
    { day: "Mon", tasks: "Implemented JWT authentication with refresh token rotation and role-based guards.", status: "done" as const },
    { day: "Tue", tasks: "Configured PostgreSQL migrations and set up Docker environment for local dev.", status: "done" as const },
    { day: "Wed", tasks: "Built responsive onboarding form with client-side validation and error toasts.", status: "done" as const },
    { day: "Thu", tasks: "Integrated REST API endpoints and debugged CORS middleware configuration.", status: "pending" as const },
    { day: "Fri", tasks: "No entry yet for today.", status: "pending" as const },
  ];

  const feedbackItems = [
    { week: "Week 3", comment: "Good detail on the database migration. Please describe the business reason for each table, not only the technical steps.", reviewer: "Dr. Adeyemi", date: "Oct 15" },
    { week: "Week 2", comment: "Entry for Tuesday was too brief. Expand on the challenge you faced with the CORS headers.", reviewer: "Dr. Adeyemi", date: "Oct 8" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4EF] flex font-sans selection:bg-[#F04D23] selection:text-white">
      <Sidebar nav={nav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-5 sm:px-8 bg-[#EDECE6] border-b border-[#D8D7CE] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#7A7973] hover:text-[#141414]">
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-[13px] font-semibold text-[#141414]">Good morning, Ada</p>
              <p className="text-[11px] text-[#9A9990] font-mono">Week 4 · SWEP · Dept. of Computer Science</p>
            </div>
          </div>
          <Link href="/student/day"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors">
            <PenLine className="size-3.5" />
            <span className="hidden sm:inline">Write today&apos;s entry</span>
            <span className="sm:hidden">Write</span>
          </Link>
        </header>

        <main className="flex-1 px-5 sm:px-8 py-7 sm:py-8 space-y-6 max-w-[900px]">

          {/* ── Attendance banner (SWEP only) ─────────── */}
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-2xl bg-white border border-[#E8E7E1]">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-[#F04D23] animate-pulse shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-[#141414]">SWEP attendance code active</p>
                <p className="text-[11px] text-[#9A9990]">Today&apos;s code expires at 10:00 AM. Check in with your coordinator.</p>
              </div>
            </div>
            <Link href="/student/attendance"
              className="shrink-0 text-[11px] font-semibold text-[#141414] hover:opacity-70 flex items-center gap-0.5">
              Mark <ChevronRight className="size-3" />
            </Link>
          </div>

          {/* ── Stat cards ────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Week" value="4" sub="of 12 total" accent />
            <StatCard label="Entries" value="17" sub="3 pending this week" />
            <StatCard label="Attendance" value="92%" sub="22 of 24 days" />
            <StatCard label="Reviews" value="3" sub="2 approved · 1 returned" />
          </div>

          {/* ── This week's entries ───────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E8E7E1] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EFE9] flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-bold text-[#141414]">This week&apos;s entries</h2>
                <p className="text-[11px] text-[#9A9990]">Oct 21 – Oct 25, 2024</p>
              </div>
              <Link href="/student/week"
                className="text-[11px] font-semibold text-[#141414] hover:opacity-70 flex items-center gap-0.5">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="px-5">
              {weekEntries.map((e) => (
                <EntryRow key={e.day} {...e} />
              ))}
            </div>
          </div>

          {/* ── Bottom two-col ────────────────────────── */}
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Submission status */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-bold text-[#141414]">Submission status</h2>
                <FileText className="size-4 text-[#C0BFB9]" />
              </div>
              <div className="space-y-3">
                {[
                  { week: "Week 3", status: "Approved", color: "emerald" },
                  { week: "Week 2", status: "Approved", color: "emerald" },
                  { week: "Week 1", status: "Approved", color: "emerald" },
                ].map((s) => (
                  <div key={s.week} className="flex items-center justify-between py-2 border-b border-[#F5F4EF] last:border-0">
                    <p className="text-[12px] font-medium text-[#3A3934]">{s.week}</p>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {s.status}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2">
                  <p className="text-[12px] font-medium text-[#3A3934]">Week 4 (current)</p>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    In progress
                  </span>
                </div>
              </div>
            </div>

            {/* Coordinator feedback */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-bold text-[#141414]">Coordinator feedback</h2>
                <Star className="size-4 text-[#C0BFB9]" />
              </div>
              <div className="space-y-4">
                {feedbackItems.map((f) => (
                  <div key={f.week} className="border-b border-[#F5F4EF] last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-mono font-medium text-[#9A9990]">{f.week}</p>
                      <p className="text-[10px] text-[#C0BFB9]">{f.date}</p>
                    </div>
                    <p className="text-[12px] text-[#5A5954] leading-relaxed">{f.comment}</p>
                    <p className="text-[10px] text-[#9A9990] mt-1.5">— {f.reviewer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
