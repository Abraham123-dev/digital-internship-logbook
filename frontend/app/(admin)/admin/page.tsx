"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import type { Department, InvitationItem, CreateInvitationPayload } from "@/lib/api/auth";
import {
  LayoutDashboard, Users, Mail, Settings, Shield,
  LogOut, Menu, X, ArrowUpRight, CheckCircle2,
  Clock, ChevronRight, Plus, RefreshCw, AlertCircle,
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
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#141414]">
            <div className="size-7 rounded-full bg-[#F04D23] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              SA
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">System Admin</p>
              <p className="text-[10px] text-white/40 truncate">Superuser · OAU</p>
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
            onClick={() => router.replace("/admin/login")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#7A7973] hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Invite modal ────────────────────────────────────────── */
function InviteModal({ departments, onClose, onSubmit, isPending, error }: {
  departments: Department[];
  onClose: () => void;
  onSubmit: (form: CreateInvitationPayload) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<CreateInvitationPayload>({
    email: "", department_id: departments[0]?.id ?? 1, programme: "SWEP",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px] px-4 py-6 sm:px-6">
      <div className="w-full max-w-[460px] bg-[#EDECE6] rounded-2xl border border-[#D8D7CE] shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#D8D7CE] flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-[#141414]">Invite Coordinator</h2>
            <p className="text-[11px] text-[#9A9990]">Send an invitation link to a departmental coordinator.</p>
          </div>
          <button onClick={onClose} className="text-[#9A9990] hover:text-[#141414]">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="inv-email" className="text-[11px] font-semibold text-[#141414] uppercase tracking-wider">Email address</label>
            <input
              id="inv-email" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="coordinator@oauife.edu.ng"
              className="w-full h-11 px-4 rounded-xl border border-[#D8D7CE] bg-white text-[14px] text-[#141414] placeholder:text-[#C0BFB9] outline-none focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23] transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inv-dept" className="text-[11px] font-semibold text-[#141414] uppercase tracking-wider">Department</label>
              <select id="inv-dept" value={form.department_id}
                onChange={(e) => setForm((f) => ({ ...f, department_id: Number(e.target.value) }))}
                className="w-full h-11 px-4 rounded-xl border border-[#D8D7CE] bg-white text-[13px] text-[#141414] outline-none appearance-none focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23] transition-all">
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inv-prog" className="text-[11px] font-semibold text-[#141414] uppercase tracking-wider">Programme</label>
              <select id="inv-prog" value={form.programme}
                onChange={(e) => setForm((f) => ({ ...f, programme: e.target.value as "SWEP" | "SIWES" }))}
                className="w-full h-11 px-4 rounded-xl border border-[#D8D7CE] bg-white text-[13px] text-[#141414] outline-none appearance-none focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23] transition-all">
                <option value="SWEP">SWEP</option>
                <option value="SIWES">SIWES</option>
              </select>
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-600">{error}</p>
            </div>
          )}
          <button
            onClick={() => onSubmit(form)} disabled={isPending}
            className="w-full h-11 rounded-full bg-[#141414] text-white text-[13px] font-semibold hover:bg-[#282828] disabled:opacity-50 transition-all">
            {isPending ? "Sending invitation…" : "Send invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Status badge ────────────────────────────────────────── */
function InvBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "accepted") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
      <CheckCircle2 className="size-2.5" />Accepted
    </span>
  );
  if (s === "expired") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
      <AlertCircle className="size-2.5" />Expired
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#141414] bg-white px-2 py-0.5 rounded-full border border-[#D8D7CE]">
      <Clock className="size-2.5" />Pending
    </span>
  );
}

/* ── Main Dashboard ─────────────────────────────────────── */
export default function AdminOverviewPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function loadData() {
    setIsLoading(true);
    const [invRes, deptRes] = await Promise.all([authApi.listInvitations(), authApi.departments()]);
    if (invRes.ok) setInvitations(invRes.data.results ?? []);
    else if (invRes.status === 401 || invRes.status === 403) { router.replace("/admin/login"); return; }
    else setError(invRes.message);
    if (deptRes.ok) setDepartments(deptRes.data);
    setIsLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function handleCreateInvitation(form: CreateInvitationPayload) {
    setInviteErr(null);
    if (!form.email.includes("@")) { setInviteErr("Enter a valid email address."); return; }
    startTransition(async () => {
      const res = await authApi.createInvitation(form);
      if (!res.ok) { setInviteErr(res.message); return; }
      setSuccessMsg(`Invitation sent to ${form.email}.`);
      setShowInviteModal(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadData();
    });
  }

  function handleResend(id: number, email: string) {
    startTransition(async () => {
      const res = await authApi.resendInvitation(id);
      if (res.ok) { setSuccessMsg(`Invitation resent to ${email}.`); setTimeout(() => setSuccessMsg(null), 4000); }
    });
  }

  const nav: NavItem[] = [
    { label: "Overview", href: "/admin", icon: <LayoutDashboard className="size-4" />, active: true },
    { label: "Coordinators", href: "/admin/coordinators", icon: <Users className="size-4" /> },
    { label: "Invitations", href: "/admin/invitations", icon: <Mail className="size-4" /> },
    { label: "Departments", href: "/admin/departments", icon: <Settings className="size-4" /> },
    { label: "Audit Log", href: "/admin/audit", icon: <Shield className="size-4" /> },
  ];

  const pending = invitations.filter((i) => i.status.toLowerCase() === "pending").length;
  const accepted = invitations.filter((i) => i.status.toLowerCase() === "accepted").length;

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
      <Sidebar nav={nav} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-5 sm:px-8 bg-[#EDECE6] border-b border-[#D8D7CE] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#7A7973] hover:text-[#141414]">
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-[13px] font-semibold text-[#141414]">System Administration</p>
              <p className="text-[11px] text-[#9A9990] font-mono">Obafemi Awolowo University · OAU</p>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Invite coordinator</span>
            <span className="sm:hidden">Invite</span>
          </button>
        </header>

        <main className="flex-1 px-5 sm:px-8 py-7 sm:py-8 space-y-6 max-w-[960px]">

          {/* Toast */}
          {successMsg && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <p className="text-[12px] text-emerald-700 font-medium">{successMsg}</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="size-4 text-red-500 shrink-0" />
              <p className="text-[12px] text-red-600">{error}</p>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#141414] border border-[#141414] p-5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Pending</p>
              <p className="text-[2rem] font-extrabold tracking-[-0.04em] leading-none text-white">{pending}</p>
              <p className="text-[11px] text-white/40">invitations awaiting</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E8E7E1] p-5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9990]">Coordinators</p>
              <p className="text-[2rem] font-extrabold tracking-[-0.04em] leading-none text-[#141414]">{accepted}</p>
              <p className="text-[11px] text-[#9A9990]">accounts active</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E8E7E1] p-5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9990]">Departments</p>
              <p className="text-[2rem] font-extrabold tracking-[-0.04em] leading-none text-[#141414]">{departments.length || "—"}</p>
              <p className="text-[11px] text-[#9A9990]">configured</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E8E7E1] p-5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9990]">Total sent</p>
              <p className="text-[2rem] font-extrabold tracking-[-0.04em] leading-none text-[#141414]">{invitations.length}</p>
              <p className="text-[11px] text-[#9A9990]">invitations dispatched</p>
            </div>
          </div>

          {/* Invitations table */}
          <div className="bg-white rounded-2xl border border-[#E8E7E1] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EFE9] flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-bold text-[#141414]">Coordinator invitations</h2>
                <p className="text-[11px] text-[#9A9990]">{invitations.length} total · {pending} pending</p>
              </div>
              <button onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#141414] hover:opacity-70 transition-opacity">
                <Plus className="size-3.5" /> New
              </button>
            </div>

            {invitations.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Mail className="size-8 text-[#D8D7CE] mx-auto mb-3" />
                <p className="text-[13px] font-semibold text-[#141414] mb-1">No invitations yet</p>
                <p className="text-[12px] text-[#9A9990]">Invite your first departmental coordinator to get started.</p>
                <button onClick={() => setShowInviteModal(true)}
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors">
                  <Plus className="size-3.5" /> Invite coordinator
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#F5F4EF]">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="size-8 rounded-full bg-[#F5F4EF] flex items-center justify-center shrink-0">
                      <Mail className="size-3.5 text-[#9A9990]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#141414] truncate">{inv.email}</p>
                      <p className="text-[10px] font-mono text-[#9A9990]">{inv.department} · {inv.programme}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <InvBadge status={inv.status} />
                      {(inv.status.toLowerCase() === "pending" || inv.status.toLowerCase() === "expired") && (
                        <button onClick={() => handleResend(inv.id, inv.email)}
                          className="text-[11px] font-semibold text-[#7A7973] hover:text-[#141414] flex items-center gap-0.5 transition-colors">
                          <RefreshCw className="size-3" /> Resend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Departments */}
          <div className="bg-white rounded-2xl border border-[#E8E7E1] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EFE9] flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-[#141414]">Departments</h2>
              <Link href="/admin/departments" className="text-[11px] font-semibold text-[#141414] hover:opacity-70 flex items-center gap-0.5">
                Manage <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {departments.length === 0 ? (
              <div className="px-5 py-8 text-center text-[12px] text-[#9A9990]">No departments configured yet.</div>
            ) : (
              <div className="divide-y divide-[#F5F4EF]">
                {departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
                    <p className="text-[13px] font-medium text-[#3A3934]">{d.name}</p>
                    <ChevronRight className="size-3.5 text-[#C0BFB9]" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

      {showInviteModal && (
        <InviteModal
          departments={departments}
          onClose={() => { setShowInviteModal(false); setInviteErr(null); }}
          onSubmit={handleCreateInvitation}
          isPending={isPending}
          error={inviteErr}
        />
      )}
    </div>
  );
}
