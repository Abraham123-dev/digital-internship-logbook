"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail, Plus, Clock, RefreshCw, XCircle, CheckCircle2,
  AlertCircle, Send, X, ArrowLeft, Shield
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";
import { Pagination } from "@/components/ui/Pagination";
import { authApi, type Department, type InvitationItem } from "@/lib/api/auth";

export default function AdminInvitationsPage() {
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // New Invite form
  const [email, setEmail] = useState("");
  const [deptId, setDeptId] = useState<number>(1);
  const [programme, setProgramme] = useState<"SWEP" | "SIWES">("SWEP");
  const [level, setLevel] = useState(300);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const [invRes, deptsRes] = await Promise.all([
      authApi.listInvitations(),
      authApi.getDepartments(),
    ]);

    if (invRes.ok) {
      const items = Array.isArray(invRes.data)
        ? (invRes.data as unknown as InvitationItem[])
        : (invRes.data?.results ?? []);
      setInvitations(items);
    } else {
      setInvitations([]);
    }

    if (deptsRes.ok && Array.isArray(deptsRes.data) && deptsRes.data.length > 0) {
      setDepartments(deptsRes.data);
      setDeptId(deptsRes.data[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email.trim()) return;

    setSubmitting(true);
    const res = await authApi.createInvitation({
      email,
      department_id: deptId,
      programme,
      level: programme === "SWEP" ? 200 : level,
    });
    setSubmitting(false);

    if (res.ok) {
      setSuccessMsg(`Invitation sent to ${email}. Link valid for 72 hours.`);
      setEmail("");
      loadData();
    } else {
      setErrorMsg(res.message || "Failed to create invitation.");
    }
  }

  async function handleResend(id: number, targetEmail: string) {
    const res = await authApi.resendInvitation(id);
    if (res.ok) {
      setSuccessMsg(`Resent invitation to ${targetEmail}.`);
      loadData();
    } else {
      setErrorMsg(res.message || "Could not resend invitation.");
    }
  }

  async function handleRevoke(id: number) {
    const res = await authApi.revokeInvitation(id);
    if (res.ok) {
      setSuccessMsg(`Revoked invitation #${id}.`);
      loadData();
    } else {
      setErrorMsg(res.message || "Could not revoke invitation.");
    }
  }

  // Client-side slice for invitations list
  const totalItems = invitations.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedInvites = invitations.slice((page - 1) * pageSize, page * pageSize);

  const inputCls = "w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] placeholder:text-[#9A9990] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs";

  return (
    <AdminShell
      title="Coordinator Invitations"
      subtitle="Send and manage invitation links for department coordinators"
    >
      <div className="space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7A7973] hover:text-[#141414] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Overview</span>
          </Link>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-medium flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
              <X className="size-4" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-[12px] font-medium flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900 cursor-pointer">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Issue Invitation Form Card */}
        <div className="bg-white rounded-lg border border-[#E2E1DA] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F0EFE9]">
            <Mail className="size-4 text-[#141414]" />
            <h2 className="text-[14px] font-semibold text-[#141414]">Send Coordinator Invitation</h2>
          </div>

          <form onSubmit={handleCreateInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            <div className="sm:col-span-5 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#2E2D29]">
                Staff Institutional Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty.name@oauife.edu.ng"
                className={inputCls}
              />
            </div>

            <div className="sm:col-span-4 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#2E2D29]">
                Department *
              </label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(parseInt(e.target.value, 10))}
                className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[12.5px] text-[#141414] font-medium outline-none cursor-pointer focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#2E2D29]">
                Programme *
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value as "SWEP" | "SIWES")}
                  className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[12.5px] text-[#141414] font-medium outline-none cursor-pointer focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                >
                  <option value="SWEP">SWEP</option>
                  <option value="SIWES">SIWES</option>
                </select>
                {programme === "SIWES" && (
                  <select aria-label="SIWES level" value={level} onChange={(e) => setLevel(Number(e.target.value))}
                    className="h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[12.5px]">
                    <option value={300}>300L</option>
                    <option value={400}>400L</option>
                  </select>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 h-9.5 rounded-md bg-[#141414] text-white text-[12px] font-medium hover:bg-[#282828] transition-colors shadow-xs disabled:opacity-40 shrink-0 cursor-pointer"
                >
                  {submitting ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Existing Invitations List */}
        {loading ? (
          <AdminTableSkeleton rows={4} />
        ) : invitations.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E2E1DA] p-10 text-center space-y-2 shadow-2xs">
            <Mail className="size-8 text-[#9A9990] mx-auto" />
            <h3 className="text-[13px] font-bold text-[#141414]">No invitations sent yet</h3>
            <p className="text-[11.5px] text-[#7A7973]">Use the form above to invite department coordinators.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E2E1DA] shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F0EFE9] flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-[#141414]">Sent Invitations</h2>
              <span className="text-[11px] font-mono text-[#7A7973]">{totalItems} total invitations</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#FAF9F6] border-b border-[#F0EFE9] text-[#7A7973] text-[10px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Programme</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFE9]">
                  {paginatedInvites.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-[#141414]">
                        {inv.email}
                      </td>

                      <td className="px-4 py-3.5 text-[#3A3934]">
                        {inv.department || (inv as unknown as { department_name?: string }).department_name}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {inv.programme}{inv.level ? ` - ${inv.level}L` : ""}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[9.5px] font-medium px-2 py-0.5 rounded border ${
                          inv.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : inv.status === "ACCEPTED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}>
                          {inv.status === "PENDING" ? "Pending" : inv.status === "ACCEPTED" ? "Accepted" : "Expired"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-[#7A7973] font-mono text-[11px]">
                        {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : "72 hrs"}
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-2">
                        {inv.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleResend(inv.id, inv.email)}
                              className="text-[11px] font-semibold text-[#141414] hover:underline cursor-pointer"
                            >
                              Resend
                            </button>
                            <button
                              onClick={() => handleRevoke(inv.id)}
                              className="text-[11px] font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />

      </div>
    </AdminShell>
  );
}
