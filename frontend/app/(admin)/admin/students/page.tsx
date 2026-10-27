"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, Users, ChevronRight, AlertCircle,
  CheckCircle2, X, Shield, Filter, UserX, Building2,
  GraduationCap, RotateCcw
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";
import { Pagination } from "@/components/ui/Pagination";
import { adminApi, type AdminStudentItem } from "@/lib/api/admin";
import { authApi, type Faculty } from "@/lib/api/auth";

function AdminStudentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlFaculty = searchParams.get("faculty") || "ALL";
  const urlDept = searchParams.get("department") || "ALL";

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>(urlFaculty);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(urlDept);

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Deactivate modal state
  const [deactivateModal, setDeactivateModal] = useState<AdminStudentItem | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [actionDone, setActionDone] = useState<string | null>(null);

  // Load available faculties and constituent departments
  useEffect(() => {
    let mounted = true;
    async function loadFaculties() {
      const res = await authApi.faculties();
      if (!mounted) return;
      if (res.ok && res.data) {
        setFaculties(res.data);
      }
    }
    loadFaculties();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync state if URL search params change
  useEffect(() => {
    const f = searchParams.get("faculty");
    const d = searchParams.get("department");
    if (f) setSelectedFaculty(f);
    if (d) setSelectedDepartment(d);
  }, [searchParams]);

  // Load students based on selected faculty, department, status, and search query
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await adminApi.getStudents({
        page,
        pageSize,
        search,
        status: statusFilter,
        facultyId: selectedFaculty,
        departmentId: selectedDepartment,
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
  }, [page, pageSize, search, statusFilter, selectedFaculty, selectedDepartment]);

  // Compute available departments based on active faculty selection
  const activeFacultyObj = faculties.find((f) => String(f.id) === String(selectedFaculty));
  const availableDepartments = activeFacultyObj
    ? activeFacultyObj.departments
    : faculties.flatMap((f) => f.departments);

  function handleFacultyChange(facId: string) {
    setSelectedFaculty(facId);
    setSelectedDepartment("ALL");
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    if (facId === "ALL") {
      params.delete("faculty");
    } else {
      params.set("faculty", facId);
    }
    params.delete("department");
    const qs = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(qs);
  }

  function handleDepartmentChange(deptId: string) {
    setSelectedDepartment(deptId);
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    if (deptId === "ALL") {
      params.delete("department");
    } else {
      params.set("department", deptId);
    }
    const qs = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(qs);
  }

  function handleResetFilters() {
    setSelectedFaculty("ALL");
    setSelectedDepartment("ALL");
    setStatusFilter("ALL");
    setSearch("");
    setPage(1);
    router.replace(window.location.pathname);
  }

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

  const isFiltered =
    selectedFaculty !== "ALL" ||
    selectedDepartment !== "ALL" ||
    statusFilter !== "ALL" ||
    Boolean(search.trim());

  return (
    <AdminShell
      title="Students"
      subtitle="Manage registered student accounts organized by faculty and department"
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

        {/* Faculty Selector Navigation Strip */}
        <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EFE9] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-[#7A7973]" />
              <h3 className="text-[13px] font-bold text-[#141414]">Filter by University Faculty</h3>
            </div>
            <span className="text-[11px] font-mono text-[#7A7973]">
              Organized department-by-department
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleFacultyChange("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all cursor-pointer ${
                selectedFaculty === "ALL"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-[#FAF9F5] border border-[#E8E7E1] text-[#5A5954] hover:border-[#D0CFCA] hover:bg-white"
              }`}
            >
              All Faculties
            </button>

            {faculties.map((fac) => {
              const isSelected = String(selectedFaculty) === String(fac.id);
              const isFcse = fac.code === "FCSE";
              return (
                <button
                  key={fac.id}
                  onClick={() => handleFacultyChange(String(fac.id))}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#141414] text-white shadow-xs"
                      : "bg-white border border-[#E8E7E1] text-[#3A3934] hover:border-[#141414] hover:bg-[#FAF9F5]"
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : isFcse
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {fac.code}
                  </span>
                  <span>{fac.name}</span>
                </button>
              );
            })}
          </div>

          {/* Department Dropdown & Search & Status Bar */}
          <div className="pt-2 border-t border-[#F0EFE9] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              
              {/* Department Dropdown (Specific to active faculty) */}
              <div className="relative min-w-[240px]">
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 rounded-xl border border-[#D8D7CE] bg-[#FAF9F5] text-[12px] text-[#141414] font-medium outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/15 focus:border-[#F04D23] cursor-pointer"
                >
                  <option value="ALL">
                    {activeFacultyObj
                      ? `All ${activeFacultyObj.code} Departments (${activeFacultyObj.departments.length})`
                      : "All Departments (All Faculties)"}
                  </option>
                  {availableDepartments.map((dept) => (
                    <option key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-[#9A9990]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by student name or matric number…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#D8D7CE] bg-white text-[12.5px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/15 focus:border-[#F04D23]"
                />
              </div>
            </div>

            {/* Status pills + Reset filters */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1">
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

              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  title="Reset all filters"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#D8D7CE] bg-white text-[11px] font-medium text-[#7A7973] hover:text-[#141414] hover:border-[#141414] transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <AdminTableSkeleton rows={5} />
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E7E1] p-12 text-center space-y-3">
            <Users className="size-9 text-[#9A9990] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-[14px] font-bold text-[#141414]">No students found</h3>
              <p className="text-[12px] text-[#7A7973] max-w-sm mx-auto">
                {activeFacultyObj
                  ? `There are currently no registered students in ${activeFacultyObj.name} matching your criteria.`
                  : "No students match your current search or filter criteria."}
              </p>
            </div>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141414] text-white text-[11.5px] font-semibold hover:bg-[#282828] transition-colors"
              >
                <RotateCcw className="size-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F0EFE9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-bold text-[#141414]">Registered Students</h2>
                {activeFacultyObj && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FAF9F5] border border-[#E8E7E1] text-[#3A3934]">
                    {activeFacultyObj.code}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-[#7A7973]">{totalItems} total students</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#FAF9F5] border-b border-[#F0EFE9] text-[#7A7973] text-[10px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-4 py-3">Faculty &amp; Department</th>
                    <th className="px-4 py-3">Coordinator</th>
                    <th className="px-4 py-3">Logbook Progress</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFE9]">
                  {students.map((student) => {
                    const isFcse = student.facultyCode === "FCSE";
                    return (
                      <tr key={student.id} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[#141414]">{student.name}</div>
                          <div className="text-[10.5px] text-[#7A7973] font-mono">{student.matricNo}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            {student.facultyCode ? (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold border ${
                                  isFcse
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                              >
                                {student.facultyCode}
                              </span>
                            ) : null}
                            <span className="inline-block text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {student.programme}
                            </span>
                          </div>
                          <div className="text-[#3A3934] truncate max-w-[220px] font-medium">
                            {student.department}
                          </div>
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
                          <span
                            className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${
                              student.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            }`}
                          >
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
                    );
                  })}
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

export default function AdminStudentsPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton rows={5} />}>
      <AdminStudentsContent />
    </Suspense>
  );
}
