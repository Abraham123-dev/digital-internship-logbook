"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen, Calendar, CheckCircle2, ArrowUpRight,
  LayoutDashboard, Star, User, LogOut, ChevronRight,
  PenLine, AlertCircle, Menu, X, Lock, FileText,
  Clock, Award
} from "lucide-react";
import { studentApi, type StudentDashboardData, type DayStatus, type WeekStatus } from "@/lib/api/student";
import { authApi } from "@/lib/api/auth";

/* ── Types ────────────────────────────────────────────────────────── */
type NavItem = { label: string; href: string; icon: React.ReactNode; active?: boolean };

/* ── Logo ─────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <span className="size-2 rounded-full bg-[#F04D23] group-hover:scale-125 transition-transform shrink-0" />
      <span className="text-[16px] font-extrabold tracking-[-0.03em] text-[#141414]">Logr</span>
      <span className="text-[11px] text-[#7A7973] font-normal ml-0.5">/ OAU</span>
    </Link>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────── */
function Sidebar({
  nav,
  open,
  onClose,
  studentName,
  matricNo,
  programme,
  onSignOut,
}: {
  nav: NavItem[];
  open: boolean;
  onClose: () => void;
  studentName: string;
  matricNo: string;
  programme: string;
  onSignOut: () => void;
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[230px] bg-[#EDECE6] border-r border-[#D8D7CE] flex flex-col transition-transform duration-250 ease-out lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0 shadow-lg lg:shadow-none" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#D8D7CE]">
          <Logo />
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-[#7A7973] hover:text-[#141414] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Student Profile Identity Card */}
        <div className="p-4 border-b border-[#D8D7CE]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E8E7E1]">
            <div className="size-8 rounded-full bg-[#141414] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
              {studentName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-[#141414] truncate">{studentName}</p>
              <p className="text-[10px] text-[#7A7973] font-mono truncate">{matricNo} &middot; {programme}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12.5px] font-medium transition-colors ${
                item.active
                  ? "bg-[#141414] text-white"
                  : "text-[#5A5954] hover:text-[#141414] hover:bg-white/70"
              }`}
            >
              <span className={`shrink-0 ${item.active ? "text-white" : "text-[#7A7973]"}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom sign out */}
        <div className="p-3 border-t border-[#D8D7CE]">
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-[12px] font-medium text-[#7A7973] hover:text-red-600 hover:bg-red-50/70 transition-colors cursor-pointer"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Status Chips ─────────────────────────────────────────────────── */
function DayChip({ status }: { status: DayStatus }) {
  const map: Record<DayStatus, { label: string; cls: string; icon?: React.ReactNode }> = {
    ready:     { label: "Ready",       cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <CheckCircle2 className="size-2.5" /> },
    draft:     { label: "Draft",       cls: "bg-[#F5F4EF] text-[#7A7973] border-[#E8E7E1]", icon: <Clock className="size-2.5" /> },
    empty:     { label: "Empty",       cls: "bg-[#F5F4EF] text-[#9A9990] border-[#E8E7E1]" },
    submitted: { label: "Submitted",   cls: "bg-[#F5F4EF] text-[#5A5954] border-[#E8E7E1]", icon: <Lock className="size-2.5" /> },
    reviewed:  { label: "Reviewed",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Star className="size-2.5" /> },
    returned:  { label: "Returned",    cls: "bg-orange-50 text-orange-700 border-orange-200", icon: <AlertCircle className="size-2.5" /> },
    future:    { label: "Upcoming",    cls: "text-[#C0BFB9] border-transparent bg-transparent" },
    holiday:   { label: "Holiday",     cls: "text-[#C0BFB9] border-transparent bg-transparent" },
  };
  const { label, cls, icon } = map[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${cls}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}

function WeekChip({ status }: { status: WeekStatus }) {
  const map: Record<WeekStatus, { label: string; cls: string }> = {
    in_progress: { label: "In progress", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    submitted:   { label: "Submitted",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
    reviewed:    { label: "Reviewed",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    returned:    { label: "Returned",    cls: "bg-orange-50 text-orange-700 border-orange-200" },
    overdue:     { label: "Overdue",     cls: "bg-red-50 text-red-600 border-red-200" },
    missed:      { label: "Missed",      cls: "bg-[#F5F4EF] text-[#7A7973] border-[#E8E7E1]" },
  };
  const { label, cls } = map[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

/* ── Day Card ─────────────────────────────────────────────────────── */
interface DayTileProps {
  dayShort: string;
  date: string;
  status: DayStatus;
  href?: string;
  rating?: number;
}

function DayTile({ dayShort, date, status, href, rating }: DayTileProps) {
  const clickable = !["future", "holiday"].includes(status);
  const bg =
    status === "returned"  ? "bg-orange-50/60 border-orange-200" :
    status === "reviewed"  ? "bg-emerald-50/50 border-emerald-200" :
    status === "ready"     ? "bg-amber-50/60 border-amber-200" :
    ["future", "holiday"].includes(status) ? "bg-transparent border-[#F0EFE9] opacity-60" :
    "bg-white border-[#E8E7E1] hover:border-[#D8D7CE]";

  const content = (
    <div className={`p-3.5 rounded-xl border flex flex-col justify-between min-h-[96px] transition-all ${bg} ${clickable ? "hover:shadow-xs cursor-pointer" : "cursor-default"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">{dayShort}</span>
        {rating != null && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
            {rating}/5
          </span>
        )}
      </div>
      <div className="my-1.5">
        <span className="text-[13px] font-bold text-[#141414] leading-tight">{date}</span>
      </div>
      <div>
        <DayChip status={status} />
      </div>
    </div>
  );

  if (clickable && href) {
    return <Link href={href} className="flex-1 min-w-[110px]">{content}</Link>;
  }
  return <div className="flex-1 min-w-[110px]">{content}</div>;
}

/* ── Dashboard Page ───────────────────────────────────────────────── */
export default function StudentDashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const res = await studentApi.getDashboard();
      if (res.ok && res.data) {
        setDashboard(res.data);
      }
      setLoading(false);
    }
    loadDashboard();
  }, []);

  async function handleSignOut() {
    await authApi.logout();
    router.replace("/login");
  }

  const nav: NavItem[] = [
    { label: "Dashboard",   href: "/student",            icon: <LayoutDashboard className="size-4" />, active: true },
    { label: "Logbook",     href: `/student/week/${dashboard?.metrics.currentWeek || 4}`, icon: <BookOpen className="size-4" /> },
    { label: "Attendance",  href: "/student/attendance", icon: <Calendar className="size-4" /> },
    { label: "Reviews",     href: "/student/reviews",    icon: <Star className="size-4" /> },
    { label: "Profile",     href: "/student/profile",    icon: <User className="size-4" /> },
  ];

  const days: DayTileProps[] = [
    { dayShort: "Mon", date: "21 Oct", status: "reviewed", href: "/student/day/2024-10-21", rating: 4 },
    { dayShort: "Tue", date: "22 Oct", status: "reviewed", href: "/student/day/2024-10-22", rating: 5 },
    { dayShort: "Wed", date: "23 Oct", status: "ready",    href: "/student/day/2024-10-23" },
    { dayShort: "Thu", date: "24 Oct", status: "empty",    href: "/student/day/2024-10-24" },
    { dayShort: "Fri", date: "25 Oct", status: "future" },
  ];

  const prevWeeks = [
    { n: 3, range: "14 – 20 Oct", status: "reviewed" as WeekStatus, grade: "4.5/5" },
    { n: 2, range: "07 – 13 Oct", status: "reviewed" as WeekStatus, grade: "4.0/5" },
    { n: 1, range: "30 Sep – 06 Oct", status: "reviewed" as WeekStatus, grade: "4.2/5" },
  ];

  const feedback = [
    {
      week: "Week 3",
      date: "Oct 15",
      supervisor: "Dr. Babatunde (Coordinator)",
      text: "Good detail on the database schema and migration steps. Add the reason behind each table design choice, not just the technical steps.",
      rating: 4.5,
    },
    {
      week: "Week 2",
      date: "Oct 8",
      supervisor: "Dr. Babatunde (Coordinator)",
      text: "Tuesday entry was too brief. Say more about the CORS issue — what exactly failed in the header exchange and what configuration fixed it.",
      rating: 4.0,
    },
  ];

  const studentName = dashboard?.student.name || "Ada Okafor";
  const matricNo = dashboard?.student.matricNo || "CSC/2021/042";
  const programme = dashboard?.student.programme || "SWEP";

  const filledCount = days.filter(d => ["ready", "reviewed", "submitted"].includes(d.status)).length;
  const workingDays = 5;
  const canSubmit = filledCount >= 5;

  return (
    <div className="min-h-screen bg-[#F5F4EF] flex font-sans selection:bg-[#F04D23] selection:text-white text-[#141414]">
      {/* Sidebar */}
      <Sidebar
        nav={nav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        studentName={studentName}
        matricNo={matricNo}
        programme={programme}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar */}
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
              <h1 className="text-[14px] sm:text-[15px] font-bold text-[#141414]">Good morning, {studentName.split(" ")[0]}</h1>
              <p className="text-[11px] text-[#7A7973] font-mono">
                Week {dashboard?.metrics.currentWeek || 4} of {dashboard?.metrics.totalWeeks || 12} &middot; SWEP 2024/2025
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/day/2024-10-23"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors shadow-xs"
            >
              <PenLine className="size-3.5" />
              <span>Write today&apos;s log</span>
            </Link>
          </div>
        </header>

        {/* Centered Dashboard Content */}
        <main className="flex-1 w-full max-w-[1180px] mx-auto px-5 sm:px-8 py-6 space-y-6">
          
          {/* Active Attendance Alert Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-white border border-[#E8E7E1] shadow-xs">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-[#F04D23] animate-pulse shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#141414]">Attendance code is active for today</p>
                <p className="text-[11px] text-[#7A7973]">Your coordinator opened today&apos;s check-in. Enter the 6-character code before 4:00 PM.</p>
              </div>
            </div>
            <Link
              href="/student/attendance"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141414] text-white text-[11px] font-semibold hover:bg-[#282828] transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>Enter code</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* Balanced Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs">
              <p className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">Programme Period</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[1.5rem] font-extrabold tracking-[-0.035em] text-[#141414]">Week {dashboard?.metrics.currentWeek || 4}</span>
                <span className="text-[11px] text-[#7A7973]">/ {dashboard?.metrics.totalWeeks || 12} total</span>
              </div>
              <p className="text-[10.5px] text-[#7A7973] mt-0.5">8 weeks left in cycle</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs">
              <p className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">Days Logged</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[1.5rem] font-extrabold tracking-[-0.035em] text-[#141414]">18</span>
                <span className="text-[11px] text-[#7A7973]">/ 60 target</span>
              </div>
              <p className="text-[10.5px] text-[#7A7973] mt-0.5">30% requirement completed</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs">
              <p className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">Attendance Rate</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[1.5rem] font-extrabold tracking-[-0.035em] text-[#141414]">{dashboard?.metrics.attendanceRate || 92}%</span>
                <span className="text-[11px] text-[#7A7973]">verified</span>
              </div>
              <p className="text-[10.5px] text-emerald-700 font-medium mt-0.5">22 of 24 days recorded</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs">
              <p className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">Average Score</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[1.5rem] font-extrabold tracking-[-0.035em] text-[#141414]">4.3</span>
                <span className="text-[11px] text-[#7A7973]">/ 5.0</span>
              </div>
              <p className="text-[10.5px] text-[#7A7973] mt-0.5">Across 3 reviewed weeks</p>
            </div>
          </div>

          {/* Active Week Card */}
          <div className="bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EFE9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[14px] font-bold text-[#141414]">Current Week &middot; Week 4</h2>
                  <WeekChip status="in_progress" />
                </div>
                <p className="text-[11px] text-[#7A7973] mt-0.5">21 &ndash; 25 October 2024 &middot; Due Saturday at 11:59 PM</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11.5px] text-[#5A5954]">
                  <strong className="text-[#141414]">{filledCount} of {workingDays}</strong> days filled
                </span>
                <div className="w-20 h-1.5 rounded-full bg-[#F0EFE9] overflow-hidden">
                  <div
                    className="h-full bg-[#141414] rounded-full transition-all duration-300"
                    style={{ width: `${(filledCount / workingDays) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Daily Tiles Row */}
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {days.map((d) => (
                  <DayTile key={d.dayShort} {...d} />
                ))}
              </div>
            </div>

            {/* Submit Action Footer */}
            <div className="px-5 py-3.5 bg-[#FAF9F5] border-t border-[#F0EFE9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-[11px] text-[#7A7973]">
                {canSubmit
                  ? "All daily entries for Week 4 are completed and ready for submission."
                  : "Fill Thursday and Friday entries to unlock week submission."}
              </p>
              <Link
                href="/student/week/4"
                className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-all ${
                  canSubmit
                    ? "bg-[#141414] text-white hover:bg-[#282828] shadow-xs cursor-pointer"
                    : "bg-[#E8E7E1] text-[#7A7973]"
                }`}
              >
                Open Week 4 logbook
              </Link>
            </div>
          </div>

          {/* Balanced Two-Column Lower Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (7 cols): Previous Weeks */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-[#F0EFE9] flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-bold text-[#141414]">Previous Weeks</h3>
                  <p className="text-[11px] text-[#7A7973]">Graded submissions and archived logbooks</p>
                </div>
                <Link href="/student/week/3" className="text-[11px] font-semibold text-[#141414] hover:underline flex items-center gap-1">
                  <span>View all</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[#F0EFE9] flex-1">
                {prevWeeks.map((w) => (
                  <Link
                    key={w.n}
                    href={`/student/week/${w.n}`}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-[#FAF9F5] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-7 rounded-lg bg-[#F5F4EF] text-[#141414] text-[11px] font-mono font-bold flex items-center justify-center shrink-0 group-hover:bg-[#141414] group-hover:text-white transition-colors">
                        W{w.n}
                      </span>
                      <div>
                        <p className="text-[12.5px] font-semibold text-[#141414]">Week {w.n} Logbook</p>
                        <p className="text-[10.5px] text-[#7A7973]">{w.range}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {w.grade}
                      </span>
                      <WeekChip status={w.status} />
                      <ChevronRight className="size-3.5 text-[#9A9990] group-hover:text-[#141414] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Column (5 cols): Coordinator Feedback */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-[#F0EFE9] flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-bold text-[#141414]">Coordinator Feedback</h3>
                  <p className="text-[11px] text-[#7A7973]">Recent review comments</p>
                </div>
                <Link href="/student/reviews" className="text-[11px] font-semibold text-[#141414] hover:underline flex items-center gap-1">
                  <span>History</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              <div className="p-4 space-y-3 flex-1">
                {feedback.map((f, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E7E1] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#141414] bg-white border border-[#E8E7E1] px-2 py-0.5 rounded">
                        {f.week}
                      </span>
                      <span className="text-[10px] text-[#9A9990]">{f.date}</span>
                    </div>
                    <p className="text-[12px] text-[#5A5954] leading-relaxed">
                      &ldquo;{f.text}&rdquo;
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#E8E7E1] text-[10.5px]">
                      <span className="text-[#7A7973]">{f.supervisor}</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <Star className="size-3 fill-emerald-600 text-emerald-600" /> {f.rating}/5.0
                      </span>
                    </div>
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
