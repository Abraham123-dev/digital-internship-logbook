"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import type { CoordinatorProfileData } from "@/lib/api/auth";
import {
  LayoutDashboard, Users, Star, Calendar, ClipboardList, User,
  LogOut, Menu, X, ArrowUpRight, CheckCircle2, RotateCcw,
  Clock, ChevronRight, BookOpen, RefreshCw,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────── */
type NavItem = { label: string; href: string; icon: React.ReactNode; active?: boolean };
type SubStatus = "PENDING_REVIEW" | "APPROVED" | "RETURNED";
type Submission = {
  id: string; studentName: string; matricNo: string;
  weekNumber: number; dates: string; tasksSummary: string;
  status: SubStatus; submittedAt: string;
};

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
function Sidebar({ nav, open, onClose, initials, name, dept }: {
  nav: NavItem[]; open: boolean; onClose: () => void;
  initials: string; name: string; dept: string;
}) {
  const router = useRouter();
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-[#EDECE6] border-r border-[#D8D7CE] flex flex-col transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto ${open ? "translate-x-0" : "-translate-x-full"}`}>

        <div className="h-16 flex items-center justify-between px-5 border-b border-[#D8D7CE]">
          <Logo />
          <button onClick={onClose} className="lg:hidden text-[#7A7973] hover:text-[#141414]">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-[#D8D7CE]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#E8E7E1]">
            <div className="size-7 rounded-full bg-[#141414] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#141414] truncate">{name}</p>
              <p className="text-[10px] text-[#9A9990] truncate">Coordinator · {dept}</p>
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
          <button
            onClick={() => { authApi.logout?.(); router.replace("/login"); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#7A7973] hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Status badge ────────────────────────────────────────── */
function Badge({ status }: { status: SubStatus }) {
  if (status === "APPROVED") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
      <CheckCircle2 className="size-2.5" />Approved
    </span>
  );
  if (status === "RETURNED") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
      <RotateCcw className="size-2.5" />Returned
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#141414] bg-white px-2 py-0.5 rounded-full border border-[#D8D7CE]">
      <Clock className="size-2.5" />Awaiting review
    </span>
  );
}

/* ── Review panel ──────────────────────────────────────── */
function ReviewPanel({ sub, onClose, onAction }: {
  sub: Submission;
  onClose: () => void;
  onAction: (id: string, action: "approve" | "return", feedback: string) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px] px-4 py-6 sm:px-6">
      <div className="w-full max-w-[520px] bg-[#EDECE6] rounded-2xl border border-[#D8D7CE] shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#D8D7CE] flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-mono text-[#9A9990] mb-1">Week {sub.weekNumber} · {sub.dates}</p>
            <h2 className="text-[14px] font-bold text-[#141414]">{sub.studentName}</h2>
            <p className="text-[11px] text-[#9A9990]">{sub.matricNo}</p>
          </div>
          <button onClick={onClose} className="text-[#9A9990] hover:text-[#141414] mt-0.5">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[#D8D7CE]">
          <p className="text-[11px] font-semibold text-[#9A9990] uppercase tracking-wider mb-2">Student entry summary</p>
          <p className="text-[13px] text-[#3A3934] leading-relaxed">{sub.tasksSummary}</p>
        </div>

        <div className="px-6 py-4">
          <label htmlFor="review-feedback" className="text-[11px] font-semibold text-[#141414] uppercase tracking-wider mb-2 block">
            Feedback (optional)
          </label>
          <textarea
            id="review-feedback"
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Leave written comments for the student…"
            className="w-full px-4 py-3 rounded-xl border border-[#D8D7CE] bg-white text-[13px] text-[#141414] placeholder:text-[#C0BFB9] outline-none resize-none focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23] transition-all"
          />
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={() => startTransition(() => { onAction(sub.id, "approve", feedback); onClose(); })}
            disabled={isPending}
            className="flex-1 h-11 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] disabled:opacity-50 transition-all">
            {isPending ? "Saving…" : "Approve submission"}
          </button>
          <button
            onClick={() => startTransition(() => { onAction(sub.id, "return", feedback); onClose(); })}
            disabled={isPending}
            className="flex-1 h-11 rounded-full border border-[#D8D7CE] text-[#141414] text-[12px] font-semibold hover:bg-white disabled:opacity-50 transition-all">
            Return for revision
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────────── */
export default function CoordinatorDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CoordinatorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([
    { id: "sub-1", studentName: "Ada Okafor", matricNo: "CSC/2021/042", weekNumber: 4, dates: "Oct 21–25, 2024", tasksSummary: "Implemented JWT authentication and role-based access control with refresh token rotation.", status: "PENDING_REVIEW", submittedAt: "2 days ago" },
    { id: "sub-2", studentName: "Babatunde Adeleke", matricNo: "CSC/2021/089", weekNumber: 4, dates: "Oct 21–25, 2024", tasksSummary: "Configured PostgreSQL database migrations and Docker containerised development environment.", status: "PENDING_REVIEW", submittedAt: "Yesterday" },
    { id: "sub-3", studentName: "Chioma Eze", matricNo: "CSC/2021/115", weekNumber: 3, dates: "Oct 14–18, 2024", tasksSummary: "Created responsive user onboarding forms with client-side validation and error toast notifications.", status: "APPROVED", submittedAt: "1 week ago" },
    { id: "sub-4", studentName: "David Nwosu", matricNo: "CSC/2021/033", weekNumber: 4, dates: "Oct 21–25, 2024", tasksSummary: "Set up CI/CD pipeline with GitHub Actions and deployed to staging environment via Docker Compose.", status: "PENDING_REVIEW", submittedAt: "Today" },
  ]);

  useEffect(() => {
    authApi.coordinatorProfile().then((res) => {
      if (res.ok) setProfile(res.data.profile);
      else if (res.status === 401 || res.status === 403) router.replace("/login");
      setIsLoading(false);
    });
  }, [router]);

  function handleAction(id: string, action: "approve" | "return", feedback: string) {
    setSubmissions((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: action === "approve" ? "APPROVED" : "RETURNED" } : s)
    );
    setActionDone(action === "approve" ? "Submission approved." : "Submission returned for revision.");
    setTimeout(() => setActionDone(null), 4000);
  }

  const name = profile ? `${profile.account.first_name} ${profile.account.last_name}` : "Coordinator";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const dept = profile?.department?.name ?? "Dept.";

  const pending = submissions.filter((s) => s.status === "PENDING_REVIEW");
  const approved = submissions.filter((s) => s.status === "APPROVED");

  const nav: NavItem[] = [
    { label: "Dashboard", href: "/coordinator", icon: <LayoutDashboard className="size-4" />, active: true },
    { label: "Submissions", href: "/coordinator/review", icon: <Star className="size-4" /> },
    { label: "Students", href: "/coordinator/students", icon: <Users className="size-4" /> },
    { label: "Cohort", href: "/coordinator/cohort", icon: <ClipboardList className="size-4" /> },
    { label: "Attendance", href: "/coordinator/attendance", icon: <Calendar className="size-4" /> },
    { label: "Extensions", href: "/coordinator/extensions", icon: <RefreshCw className="size-4" /> },
    { label: "Profile", href: "/coordinator/profile", icon: <User className="size-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F4EF] flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-[13px] text-[#7A7973]">
          <span className="size-2 rounded-full bg-[#F04D23] animate-pulse" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4EF] flex font-sans selection:bg-[#F04D23] selection:text-white">
      <Sidebar nav={nav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} initials={initials} name={name} dept={dept} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-5 sm:px-8 bg-[#EDECE6] border-b border-[#D8D7CE] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#7A7973] hover:text-[#141414]">
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-[13px] font-semibold text-[#141414]">
                Good morning, {profile?.account?.first_name ?? "Coordinator"}
              </p>
              <p className="text-[11px] text-[#9A9990] font-mono">{dept} · SWEP Coordinator</p>
            </div>
          </div>
          <Link href="/coordinator/attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors">
            <Calendar className="size-3.5" />
            <span className="hidden sm:inline">Generate attendance code</span>
            <span className="sm:hidden">Code</span>
          </Link>
        </header>

        <main className="flex-1 px-5 sm:px-8 py-7 sm:py-8 space-y-6 max-w-[960px]">

          {/* Toast */}
          {actionDone && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <p className="text-[12px] text-emerald-700 font-medium">{actionDone}</p>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#141414] border border-[#141414] p-5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Pending Review</p>
              <p className="text-[2rem] font-extrabold tracking-[-0.04em] leading-none text-white">{pending.length}</p>
              <p className="text-[11px] text-white/40">submissions awaiting</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E8E7E1] p-5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9990]">Students</p>
              <p className="text-[2rem] font-extrabold tracking-[-0.04em] leading-none text-[#141414]">34</p>
              <p className="text-[11px] text-[#9A9990]">in active cohort</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E8E7E1] p-5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9990]">Approved</p>
              <p className="text-[2rem] font-extrabold tracking-[-0.04em] leading-none text-[#141414]">{approved.length}</p>
              <p className="text-[11px] text-[#9A9990]">this cycle</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E8E7E1] p-5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9990]">Week</p>
              <p className="text-[2rem] font-extrabold tracking-[-0.04em] leading-none text-[#141414]">4</p>
              <p className="text-[11px] text-[#9A9990]">of 12 programme weeks</p>
            </div>
          </div>

          {/* Submissions queue */}
          <div className="bg-white rounded-2xl border border-[#E8E7E1] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EFE9] flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-bold text-[#141414]">Submission queue</h2>
                <p className="text-[11px] text-[#9A9990]">{pending.length} awaiting your review</p>
              </div>
              <Link href="/coordinator/review" className="text-[11px] font-semibold text-[#141414] hover:opacity-70 flex items-center gap-0.5">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>

            <div className="divide-y divide-[#F5F4EF]">
              {submissions.map((sub) => (
                <div key={sub.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="size-8 rounded-full bg-[#F5F4EF] flex items-center justify-center text-[11px] font-bold text-[#141414] shrink-0 mt-0.5">
                    {sub.studentName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[13px] font-semibold text-[#141414]">{sub.studentName}</p>
                        <p className="text-[10px] font-mono text-[#9A9990]">{sub.matricNo} · Week {sub.weekNumber}</p>
                      </div>
                      <Badge status={sub.status} />
                    </div>
                    <p className="text-[12px] text-[#5A5954] mt-1.5 leading-snug line-clamp-2">{sub.tasksSummary}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-[#C0BFB9]">{sub.dates} · submitted {sub.submittedAt}</p>
                      {sub.status === "PENDING_REVIEW" && (
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="text-[11px] font-semibold text-[#141414] hover:opacity-70 flex items-center gap-0.5">
                          Review <ChevronRight className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5">
              <h2 className="text-[13px] font-bold text-[#141414] mb-4">Quick actions</h2>
              <div className="space-y-2">
                {[
                  { label: "Manage students", href: "/coordinator/students", icon: <Users className="size-3.5" /> },
                  { label: "Cohort settings", href: "/coordinator/cohort", icon: <ClipboardList className="size-3.5" /> },
                  { label: "Extension requests", href: "/coordinator/extensions", icon: <RefreshCw className="size-3.5" /> },
                  { label: "View logbook records", href: "/coordinator/review", icon: <BookOpen className="size-3.5" /> },
                ].map((a) => (
                  <Link key={a.href} href={a.href}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#F0EFE9] hover:border-[#D8D7CE] hover:bg-[#FAFAF8] transition-colors group">
                    <div className="flex items-center gap-2.5 text-[12px] font-medium text-[#3A3934]">
                      <span className="text-[#9A9990] group-hover:text-[#141414] transition-colors">{a.icon}</span>
                      {a.label}
                    </div>
                    <ChevronRight className="size-3.5 text-[#C0BFB9]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Programme info */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5">
              <h2 className="text-[13px] font-bold text-[#141414] mb-4">Current cohort</h2>
              <div className="space-y-3 text-[12px]">
                {[
                  { label: "Programme", value: "SWEP · 2024/2025" },
                  { label: "Cycle", value: "Cycle 1 · Week 4 of 12" },
                  { label: "Submission window", value: "Oct 25, 2024 at 23:59" },
                  { label: "Students enrolled", value: "34 active" },
                  { label: "Submissions received", value: `${submissions.length} of 34` },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-[#F5F4EF] last:border-0">
                    <p className="text-[#9A9990]">{r.label}</p>
                    <p className="font-semibold text-[#141414]">{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>

      {selectedSub && (
        <ReviewPanel
          sub={selectedSub}
          onClose={() => setSelectedSub(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
