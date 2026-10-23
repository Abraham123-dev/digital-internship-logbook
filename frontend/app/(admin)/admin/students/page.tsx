"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, Users, ChevronRight, AlertCircle,
  CheckCircle2, X, Shield, Filter, UserX
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";
import { Pagination } from "@/components/ui/Pagination";
import { adminApi, type AdminStudentItem } from "@/lib/api/admin";

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Deactivate modal state
  const [deactivateModal, setDeactivateModal] = useState<AdminStudentItem | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [actionDone, setActionDone] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await adminApi.getStudents({
        page,
        pageSize,
        search,
        status: statusFilter,
      });
      if (!mounted) return;
      if (res.ok) {
        setStudents(res.data.results);
        setTotalPages(res.data.totalPages);
        setTotalItems(res.data.total);
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [page, pageSize, search, statusFilter]);

  async function handleConfirmDeactivate() {
    if (!deactivateModal || !deactivateReason.trim()) return;
    await adminApi.updateStudent(deactivateModal.id, {
      status: "DEACTIVATED",
      reason: deactivateReason,
    });
    setActionDone(`Student ${deactivateModal.name} (${deactivateModal.matricNo}) has been deactivated.`);
    setStudents((prev) =>
      prev.map((s) => (s.id === deactivateModal.id ? { ...s, status: "DEACTIVATED" } : s))
    );
    setDeactivateModal(null);
    setDeactivateReason("");
  }

  return (
    <AdminShell
      title="Students"
      subtitle="Manage registered student accounts and programme status"
    >
      <div className="space-y-5">
        
        {actionDone && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{actionDone}</span>
            </div>
            <button onClick={() => setActionDone(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Search & Filter Header Strip */}
        <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-[#9A9990]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset pagination on search
              }}
              placeholder="Search by name or matric number…"
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#D8D7CE] bg-white text-[12.5px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/15 focus:border-[#F04D23]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {["ALL", "ACTIVE", "DEACTIVATED"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  statusFilter === s
                    ? "bg-[#141414] text-white"
                    : "border border-[#D8D7CE] text-[#5A5954] hover:bg-[#FAF9F5]"
                }`}
              >
                {s === "ALL" ? "All" : s === "ACTIVE" ? "Active" : "Deactivated"}
              </button>
            ))}
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <AdminTableSkeleton rows={5} />
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E7E1] p-12 text-center space-y-2">
            <Users className="size-8 text-[#9A9990] mx-auto" />
            <h3 className="text-[14px] font-bold text-[#141414]">No students found</h3>
            <p className="text-[12px] text-[#7A7973]">No students match your search or filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F0EFE9] flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-[#141414]">Registered Students</h2>
              <span className="text-[11px] font-mono text-[#7A7973]">{totalItems} total students</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#FAF9F5] border-b border-[#F0EFE9] text-[#7A7973] text-[10px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-4 py-3">Department & Programme</th>
                    <th className="px-4 py-3">Coordinator</th>
                    <th className="px-4 py-3">Logbook Progress</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFE9]">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#141414]">{student.name}</div>
                        <div className="text-[10.5px] text-[#7A7973] font-mono">{student.matricNo}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-[#3A3934] truncate max-w-[220px]">{student.department}</div>
                        <span className="inline-block text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 mt-0.5">
                          {student.programme}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-[#141414] font-medium">{student.coordinatorName}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-[#5A5954]">
                          {student.weeksSubmitted} / {student.totalWeeks} weeks
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${
                          student.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}>
                          {student.status === "ACTIVE" ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-2">
                        {student.status === "ACTIVE" ? (
                          <button
                            onClick={() => setDeactivateModal(student)}
                            className="text-[11px] font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#9A9990]">Deactivated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Server Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />

      </div>

      {/* Deactivate Student Confirmation Dialog */}
      {deactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8E7E1] max-w-[420px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EFE9]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-500" />
                <h3 className="text-[13px] font-bold text-[#141414]">Deactivate Student Account</h3>
              </div>
              <button onClick={() => setDeactivateModal(null)} className="p-1 text-[#7A7973] hover:text-[#141414] cursor-pointer">
                <X className="size-4" />
              </button>
            </div>

            <p className="text-[12px] text-[#5A5954] leading-relaxed">
              Deactivating <strong className="text-[#141414]">{deactivateModal.name}</strong> ({deactivateModal.matricNo}) prevents the student from signing in. Submitted logbooks remain saved.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                Reason for deactivation *
              </label>
              <textarea
                rows={3}
                required
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Explain the reason for deactivating this account…"
                className="w-full p-3 rounded-xl border border-[#D8D7CE] bg-white text-[12px] text-[#141414] outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeactivateModal(null)}
                className="flex-1 py-2 rounded-full border border-[#D8D7CE] text-[12px] font-semibold text-[#5A5954] hover:bg-[#FAF9F5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deactivateReason.trim()}
                onClick={handleConfirmDeactivate}
                className="flex-1 py-2 rounded-full bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700 shadow-xs disabled:opacity-40 cursor-pointer"
              >
                Deactivate account
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
