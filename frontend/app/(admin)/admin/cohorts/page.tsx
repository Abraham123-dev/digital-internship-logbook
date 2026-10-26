"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Settings, Clock, Calendar, CheckCircle2,
  Users, Building, Plus, ArrowLeft, X, AlertCircle, Sparkles
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";
import {
  adminApi,
  type AdminCohortItem,
  type AdminCoordinatorItem,
  type PendingStudentItem,
  type CreateCohortPayload
} from "@/lib/api/admin";
import { authApi, type Department } from "@/lib/api/auth";

export default function AdminCohortsPage() {
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState<AdminCohortItem[]>([]);
  const [pendingStudents, setPendingStudents] = useState<PendingStudentItem[]>([]);
  const [coordinators, setCoordinators] = useState<AdminCoordinatorItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    department_id: number | "";
    coordinator_id: number | "";
    session: string;
    programme: "SWEP" | "SIWES";
    start_date: string;
    end_date: string;
    total_weeks: number;
  }>({
    department_id: "",
    coordinator_id: "",
    session: "2024/2025",
    programme: "SWEP",
    start_date: "",
    end_date: "",
    total_weeks: 12,
  });

  async function loadData() {
    setLoading(true);
    const [cohortsRes, pendingRes, coordsRes, deptsRes] = await Promise.all([
      adminApi.getCohorts(),
      adminApi.getPendingStudents(),
      adminApi.getCoordinators({ pageSize: 50 }),
      authApi.departments(),
    ]);

    if (cohortsRes.ok) setCohorts(cohortsRes.data);
    if (pendingRes.ok) setPendingStudents(pendingRes.data.results || []);
    if (coordsRes.ok) setCoordinators(coordsRes.data.results || []);
    if (deptsRes.ok) setDepartments(deptsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter coordinators eligible for the selected department & programme
  const selectedDeptObj = departments.find((d) => d.id === formData.department_id);
  const eligibleCoordinators = coordinators.filter((c) => {
    const matchesDept = selectedDeptObj ? c.department.toLowerCase().includes(selectedDeptObj.name.toLowerCase()) || selectedDeptObj.name.toLowerCase().includes(c.department.toLowerCase()) : true;
    const matchesProg = c.programme === formData.programme;
    return matchesDept && matchesProg;
  });

  const isFcse = (d: Department) =>
    d.faculty_code === "FCSE" ||
    (d.faculty && d.faculty.toLowerCase().includes("computer")) ||
    d.name.toLowerCase().includes("computer") ||
    d.name.toLowerCase().includes("software") ||
    d.name.toLowerCase().includes("information");

  const fcseDepts = departments.filter(isFcse);
  const techDepts = departments.filter((d) => !isFcse(d));

  function handleOpenCreateModal(prefillDeptId?: number, prefillProgramme?: "SWEP" | "SIWES") {
    setFormError(null);
    setFormData((prev) => ({
      ...prev,
      department_id: prefillDeptId ?? prev.department_id,
      programme: prefillProgramme ?? prev.programme,
    }));
    setIsModalOpen(true);
  }

  function handleCreateCohort(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.department_id) {
      setFormError("Please select a department.");
      return;
    }
    if (!formData.coordinator_id) {
      setFormError("Please assign a coordinator to this cohort.");
      return;
    }
    if (!formData.session.trim()) {
      setFormError("Academic session is required (e.g. 2024/2025).");
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      setFormError("Start and end dates are required.");
      return;
    }
    if (formData.start_date >= formData.end_date) {
      setFormError("End date must be after the start date.");
      return;
    }

    startTransition(async () => {
      const payload: CreateCohortPayload = {
        department_id: Number(formData.department_id),
        coordinator_id: Number(formData.coordinator_id),
        session: formData.session.trim(),
        programme: formData.programme,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_weeks: formData.total_weeks || 12,
      };

      const res = await adminApi.createCohort(payload);
      if (!res.ok) {
        setFormError(res.message || "Failed to create cohort.");
        return;
      }

      setSuccessMsg("Cohort created successfully. Matching students have been enrolled!");
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    });
  }

  return (
    <AdminShell
      title="Cohorts"
      subtitle="Active SWEP and SIWES programme cycles and coordinator assignments"
    >
      <div className="space-y-6">

        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7A7973] hover:text-[#141414] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Overview</span>
          </Link>

          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#141414] text-white text-[12px] font-medium hover:bg-[#282828] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Create Cohort</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-medium flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Pending Students Section if any exist */}
        {pendingStudents.length > 0 && (
          <div className="p-4 sm:p-5 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-6 rounded-md bg-amber-500/20 text-amber-900 items-center justify-center text-[11px] font-bold">
                  {pendingStudents.length}
                </span>
                <div>
                  <h3 className="text-[13px] font-bold text-amber-900">
                    Students Awaiting Cohort Assignment
                  </h3>
                  <p className="text-[11.5px] text-amber-800/80">
                    These students have registered and verified their email. Creating a matching cohort will automatically enrol them.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCreateModal()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-900 text-white text-[11.5px] font-medium hover:bg-amber-950 transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                <Plus className="size-3" />
                <span>Create Matching Cohort</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-48 divide-y divide-amber-200/50 rounded-md border border-amber-200/60 bg-white/70">
              {pendingStudents.slice(0, 10).map((st) => (
                <div key={st.id} className="flex items-center justify-between px-3.5 py-2 text-[11.5px]">
                  <div>
                    <span className="font-semibold text-[#141414]">{st.name}</span>
                    <span className="text-[#7A7973] font-mono ml-2">({st.matric_no})</span>
                    <span className="text-[#9A9990] ml-2">&middot; {st.department}</span>
                    {st.degree_programme && (
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-medium">
                        {st.degree_programme}
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10.5px] font-medium">
                    {st.programme}
                  </span>
                </div>
              ))}
              {pendingStudents.length > 10 && (
                <div className="px-3 py-2 text-[11px] text-amber-800 text-center font-medium">
                  + {pendingStudents.length - 10} more students
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cohort Cards */}
        {loading ? (
          <AdminTableSkeleton rows={2} />
        ) : cohorts.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E2E1DA] p-10 text-center space-y-3">
            <Calendar className="size-8 text-[#B0AFA9] mx-auto" />
            <h3 className="text-[14px] font-bold text-[#141414]">No Cohorts Created Yet</h3>
            <p className="text-[12px] text-[#7A7973] max-w-sm mx-auto">
              Cohorts define the internship cycle (SWEP or SIWES) for a department and academic session.
            </p>
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#141414] text-white text-[12px] font-medium hover:bg-[#282828] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Create First Cohort</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="bg-white rounded-lg border border-[#E2E1DA] p-5 shadow-2xs space-y-3.5 hover:border-[#D0CEBF] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10.5px] font-mono text-[#7A7973] uppercase tracking-wide">
                      Academic Session {cohort.academicYear}
                    </span>
                    <h3 className="text-[14px] font-bold text-[#141414] mt-0.5">{cohort.name}</h3>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="size-2.5" /> {cohort.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-[#FAF9F6] border border-[#E8E7E1] text-[11.5px]">
                  <div>
                    <span className="text-[#7A7973] block text-[10px] uppercase font-mono tracking-wider">Programme</span>
                    <span className="font-semibold text-[#141414]">{cohort.programme}</span>
                  </div>
                  <div>
                    <span className="text-[#7A7973] block text-[10px] uppercase font-mono tracking-wider">Enrolled Students</span>
                    <span className="font-semibold text-[#141414]">{cohort.studentsCount} students</span>
                  </div>
                  <div>
                    <span className="text-[#7A7973] block text-[10px] uppercase font-mono tracking-wider">Assigned Coordinator</span>
                    <span className="font-semibold text-[#141414]">
                      {cohort.coordinator?.name || "Assigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A7973] block text-[10px] uppercase font-mono tracking-wider">Duration</span>
                    <span className="font-semibold text-[#141414]">{cohort.startDate} – {cohort.endDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#7A7973]">Submission deadline: Saturday 11:59 PM</span>
                  <span className="font-semibold text-[#141414]">{cohort.total_weeks || 12} Weeks</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Cohort Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <div className="bg-white rounded-lg border border-[#D5D4CD] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E7E1] bg-[#FAF9F6]">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#141414] tracking-tight">Create Academic Cohort</h3>
                  <p className="text-[12px] text-[#6E6D67] mt-0.5">
                    Define the internship programme cycle and assign its coordinator.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-md text-[#7A7973] hover:text-[#141414] hover:bg-[#EAE8E0] transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCohort} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Academic Session + Programme */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      Academic Session *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2024/2025"
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] placeholder:text-[#9A9990] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      Programme *
                    </label>
                    <select
                      value={formData.programme}
                      onChange={(e) => setFormData({ ...formData, programme: e.target.value as "SWEP" | "SIWES" })}
                      className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                    >
                      <option value="SWEP">SWEP (200L / 300L)</option>
                      <option value="SIWES">SIWES (400L)</option>
                    </select>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#2E2D29]">
                    Department *
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) || "" })}
                    className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                  >
                    <option value="">Select department…</option>
                    <optgroup label="Faculty of Computer Science & Engineering">
                      {fcseDepts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Faculty of Technology">
                      {techDepts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Coordinator Assignment */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#2E2D29]">
                    Assign Coordinator *
                  </label>
                  <select
                    value={formData.coordinator_id}
                    onChange={(e) => setFormData({ ...formData, coordinator_id: Number(e.target.value) || "" })}
                    className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                  >
                    <option value="">Select coordinator for this department & programme…</option>
                    {eligibleCoordinators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.department} &middot; {c.programme})
                      </option>
                    ))}
                    {eligibleCoordinators.length === 0 && (
                      <option disabled value="">No coordinator matching this department and programme yet</option>
                    )}
                  </select>
                  {eligibleCoordinators.length === 0 && (
                    <p className="text-[11.5px] text-[#7A7973] pt-0.5">
                      Tip: Invite a coordinator for this department under the Coordinators tab first.
                    </p>
                  )}
                </div>

                {/* Dates & Weeks */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full h-9.5 px-2.5 rounded-md border border-[#D5D4CE] bg-white text-[12.5px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full h-9.5 px-2.5 rounded-md border border-[#D5D4CE] bg-white text-[12.5px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      Total Weeks *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      value={formData.total_weeks}
                      onChange={(e) => setFormData({ ...formData, total_weeks: Number(e.target.value) || 12 })}
                      className="w-full h-9.5 px-2.5 rounded-md border border-[#D5D4CE] bg-white text-[12.5px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 -mx-6 -mb-6 px-6 py-3.5 bg-[#FAF9F6] border-t border-[#E8E7E1] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-md border border-[#D5D4CE] bg-white text-[12.5px] font-medium text-[#4A4944] hover:bg-[#F3F2EE] hover:text-[#141414] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4.5 py-2 rounded-md bg-[#141414] text-white text-[12.5px] font-medium hover:bg-[#282828] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isPending ? "Creating cohort…" : "Create & Auto-Enrol"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
}
