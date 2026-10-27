"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Users,
  Building,
  Plus,
  ArrowLeft,
  X,
  AlertCircle,
  ShieldAlert,
  UserCheck,
  Mail,
  Send,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";
import {
  adminApi,
  type AdminCohortItem,
  type AdminCohortDepartment,
  type AdminCoordinatorItem,
  type PendingStudentItem,
  type CreateCohortPayload,
} from "@/lib/api/admin";
import {
  authApi,
  type Department,
  type Faculty,
  type InvitationItem,
} from "@/lib/api/auth";

export default function AdminCohortsPage() {
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState<AdminCohortItem[]>([]);
  const [pendingStudents, setPendingStudents] = useState<PendingStudentItem[]>([]);
  const [coordinators, setCoordinators] = useState<AdminCoordinatorItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Modals & form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    cohort: AdminCohortItem | null;
    department: AdminCohortDepartment | null;
    tab: "assign" | "invite";
    selectedCoordinatorId: number | "";
    inviteEmail: string;
  }>({
    open: false,
    cohort: null,
    department: null,
    tab: "assign",
    selectedCoordinatorId: "",
    inviteEmail: "",
  });

  const [expandedCohortIds, setExpandedCohortIds] = useState<Record<number, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Cohort Form state
  const [formData, setFormData] = useState<{
    name: string;
    faculty_id: number | "";
    department_ids: number[];
    session: string;
    programme: "SWEP" | "SIWES";
    start_date: string;
    end_date: string;
    total_weeks: number;
  }>({
    name: "",
    faculty_id: 1, // default FCSE
    department_ids: [],
    session: "2026/2027",
    programme: "SWEP",
    start_date: "",
    end_date: "",
    total_weeks: 12,
  });

  function updateCohortDate(field: "start_date" | "end_date", value: string) {
    setFormData((previous) => {
      const next = { ...previous, [field]: value };
      const start = Date.parse(`${next.start_date}T00:00:00Z`);
      const end = Date.parse(`${next.end_date}T00:00:00Z`);
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        // Match the backend's Monday-based calendar weeks, including partial weeks.
        const startWeekday = (new Date(start).getUTCDay() + 6) % 7;
        next.total_weeks = Math.floor(((end - start) / 86_400_000 + startWeekday) / 7) + 1;
      }
      return next;
    });
  }

  async function loadData() {
    setLoading(true);
    const [cohortsRes, pendingRes, coordsRes, facRes, deptsRes, invitesRes] =
      await Promise.all([
        adminApi.getCohorts(),
        adminApi.getPendingStudents(),
        adminApi.getCoordinators({ pageSize: 100 }),
        authApi.faculties(),
        authApi.departments(),
        authApi.listInvitations(),
      ]);

    if (cohortsRes.ok) {
      setCohorts(cohortsRes.data);
      // Auto-expand all cohorts by default for easy viewing
      const expanded: Record<number, boolean> = {};
      cohortsRes.data.forEach((c) => {
        expanded[c.id] = true;
      });
      setExpandedCohortIds(expanded);
    }
    if (pendingRes.ok) setPendingStudents(pendingRes.data.results || []);
    if (coordsRes.ok) setCoordinators(coordsRes.data.results || []);
    if (invitesRes.ok) setInvitations(invitesRes.data.results || []);
    if (facRes.ok) {
      setFaculties(facRes.data);
      if (facRes.data.length > 0 && formData.faculty_id === "") {
        const first = facRes.data[0];
        setFormData((prev) => ({
          ...prev,
          faculty_id: first.id,
          department_ids: first.departments.map((d) => d.id),
        }));
      }
    }
    if (deptsRes.ok) setDepartments(deptsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Selected faculty object in the create form
  const selectedFaculty = faculties.find((f) => f.id === formData.faculty_id);
  const facultyDepartments = selectedFaculty ? selectedFaculty.departments : [];

  function handleFacultyChange(facultyId: number) {
    const fac = faculties.find((f) => f.id === facultyId);
    setFormData((prev) => ({
      ...prev,
      faculty_id: facultyId,
      department_ids: fac ? fac.departments.map((d) => d.id) : [],
    }));
  }

  function toggleDepartment(deptId: number) {
    setFormData((prev) => {
      const exists = prev.department_ids.includes(deptId);
      return {
        ...prev,
        department_ids: exists
          ? prev.department_ids.filter((id) => id !== deptId)
          : [...prev.department_ids, deptId],
      };
    });
  }

  function handleSelectAllDepartments() {
    if (!selectedFaculty) return;
    setFormData((prev) => ({
      ...prev,
      department_ids: selectedFaculty.departments.map((d) => d.id),
    }));
  }

  function handleDeselectAllDepartments() {
    setFormData((prev) => ({
      ...prev,
      department_ids: [],
    }));
  }

  function handleOpenCreateModal() {
    setFormError(null);
    const initialFac = faculties[0];
    setFormData({
      name: "",
      faculty_id: initialFac ? initialFac.id : 1,
      department_ids: initialFac ? initialFac.departments.map((d) => d.id) : [],
      session: "2026/2027",
      programme: "SWEP",
      start_date: "",
      end_date: "",
      total_weeks: 12,
    });
    setIsCreateModalOpen(true);
  }

  function handleCreateCohort(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.faculty_id) {
      setFormError("Please select a faculty.");
      return;
    }
    if (formData.department_ids.length === 0) {
      setFormError("Select at least one participating department.");
      return;
    }
    if (!formData.session.trim()) {
      setFormError("Academic session is required (e.g. 2026/2027).");
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
        name: formData.name.trim() || undefined,
        faculty_id: Number(formData.faculty_id),
        department_ids: formData.department_ids,
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

      setSuccessMsg(
        `Cohort "${res.data?.name || "Faculty Cohort"}" created successfully. Verified students in participating departments have been enrolled!`
      );
      setIsCreateModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 6000);
    });
  }

  // Open assign / invite coordinator modal
  function handleOpenAssignModal(
    cohort: AdminCohortItem,
    dept: AdminCohortDepartment,
    preferInvite = false
  ) {
    setAssignError(null);
    const eligible = coordinators.filter((c) => c.programme === cohort.programme);
    // If no eligible coordinators exist, or if explicitly requested, default to the invite tab
    const defaultTab = preferInvite || eligible.length === 0 ? "invite" : "assign";

    setAssignModal({
      open: true,
      cohort,
      department: dept,
      tab: defaultTab,
      selectedCoordinatorId: dept.coordinator?.id ?? "",
      inviteEmail: "",
    });
  }

  // Assign existing coordinator
  function handleSaveCoordinatorAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!assignModal.cohort || !assignModal.department) return;
    setAssignError(null);

    const cohortId = assignModal.cohort.id;
    const departmentId = assignModal.department.id;
    const coordId =
      assignModal.selectedCoordinatorId === ""
        ? null
        : Number(assignModal.selectedCoordinatorId);

    startTransition(async () => {
      const res = await adminApi.assignCohortDepartmentCoordinator(
        cohortId,
        departmentId,
        coordId
      );
      if (!res.ok) {
        setAssignError(res.message || "Failed to update coordinator assignment.");
        return;
      }

      setSuccessMsg(
        coordId
          ? `Coordinator assigned to ${assignModal.department?.name}. Department students updated!`
          : `Coordinator unassigned from ${assignModal.department?.name}.`
      );
      setAssignModal({
        open: false,
        cohort: null,
        department: null,
        tab: "assign",
        selectedCoordinatorId: "",
        inviteEmail: "",
      });
      loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    });
  }

  // Send new coordinator invite from modal
  function handleSendCoordinatorInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!assignModal.cohort || !assignModal.department) return;
    const email = assignModal.inviteEmail.trim();
    if (!email) {
      setAssignError("Please enter a valid work email address.");
      return;
    }
    setAssignError(null);

    startTransition(async () => {
      const res = await authApi.createInvitation({
        email,
        department_id: assignModal.department!.id,
        programme: assignModal.cohort!.programme as "SWEP" | "SIWES",
      });

      if (!res.ok) {
        setAssignError(res.message || "Failed to send invitation.");
        return;
      }

      setSuccessMsg(
        `Invitation sent to ${email}. Once they complete signup, they will be automatically assigned to ${assignModal.department!.name}.`
      );
      setAssignModal({
        open: false,
        cohort: null,
        department: null,
        tab: "assign",
        selectedCoordinatorId: "",
        inviteEmail: "",
      });
      loadData();
      setTimeout(() => setSuccessMsg(null), 6000);
    });
  }

  // Resend invitation
  async function handleResendInvite(inviteId: number, targetEmail: string) {
    startTransition(async () => {
      const res = await authApi.resendInvitation(inviteId);
      if (res.ok) {
        setSuccessMsg(`Resent invitation to ${targetEmail}.`);
        loadData();
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setFormError(res.message || "Failed to resend invitation.");
      }
    });
  }

  function toggleCohortExpand(cohortId: number) {
    setExpandedCohortIds((prev) => ({
      ...prev,
      [cohortId]: !prev[cohortId],
    }));
  }

  // Find pending invitation for a department & programme
  function getPendingInvite(deptName: string, programme: string) {
    return invitations.find(
      (inv) =>
        inv.status === "PENDING" &&
        inv.programme === programme &&
        (inv.department.toLowerCase().includes(deptName.toLowerCase()) ||
          deptName.toLowerCase().includes(inv.department.toLowerCase()))
    );
  }

  // Coordinators eligible for the modal's cohort programme
  const eligibleCoordinators = coordinators.filter(
    (c) => !assignModal.cohort || c.programme === assignModal.cohort.programme
  );

  return (
    <AdminShell
      title="Cohorts"
      subtitle="Faculty-wide SWEP and SIWES programme cycles and department coordinators"
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
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#141414] text-white text-[12px] font-medium hover:bg-[#282828] active:scale-[0.99] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Create Faculty Cohort</span>
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
                    These students have registered and verified their email. Creating a cohort for their faculty will automatically enrol them.
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-900 text-white text-[11.5px] font-medium hover:bg-amber-950 transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                <Plus className="size-3" />
                <span>Create Matching Cohort</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-48 divide-y divide-amber-200/50 rounded-md border border-amber-200/60 bg-white/70">
              {pendingStudents.slice(0, 8).map((st) => (
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
              {pendingStudents.length > 8 && (
                <div className="px-3 py-2 text-[11px] text-amber-800 text-center font-medium">
                  + {pendingStudents.length - 8} more students
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cohort Cards */}
        {loading ? (
          <AdminTableSkeleton rows={2} />
        ) : cohorts.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E2E1DA] p-12 text-center space-y-3">
            <Calendar className="size-8 text-[#B0AFA9] mx-auto" />
            <h3 className="text-[14px] font-bold text-[#141414]">No Cohorts Created Yet</h3>
            <p className="text-[12px] text-[#7A7973] max-w-sm mx-auto">
              Create a faculty-wide cohort for SWEP or SIWES, select participating departments, and assign or invite coordinators.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#141414] text-white text-[12px] font-medium hover:bg-[#282828] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Create First Cohort</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cohorts.map((cohort) => {
              const isExpanded = expandedCohortIds[cohort.id] ?? true;
              const unassignedCount = cohort.departments.filter(
                (d) => !d.coordinator && !getPendingInvite(d.name, cohort.programme)
              ).length;
              const pendingInviteCount = cohort.departments.filter(
                (d) => !d.coordinator && getPendingInvite(d.name, cohort.programme)
              ).length;

              return (
                <div
                  key={cohort.id}
                  className="bg-white rounded-lg border border-[#E2E1DA] shadow-2xs overflow-hidden transition-all hover:border-[#D0CEBF]"
                >
                  {/* Cohort Card Header */}
                  <div className="p-5 border-b border-[#EAE9E4] bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-[#141414] text-white text-[10px] font-semibold tracking-wider uppercase font-mono">
                            {cohort.programme}
                          </span>
                          {cohort.faculty && (
                            <span className="px-2 py-0.5 rounded bg-[#F0EFEA] text-[#4A4944] text-[10.5px] font-medium border border-[#E2E1DA]">
                              {cohort.faculty.code || cohort.faculty.name}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-[#7A7973]">
                            Session {cohort.academicYear || cohort.session}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="size-2.5" /> {cohort.status}
                          </span>
                          {unassignedCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <ShieldAlert className="size-2.5 text-amber-600" />
                              {unassignedCount} dept{unassignedCount > 1 ? "s" : ""} need coordinator
                            </span>
                          )}
                          {pendingInviteCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <Mail className="size-2.5 text-blue-600" />
                              {pendingInviteCount} invite{pendingInviteCount > 1 ? "s" : ""} pending
                            </span>
                          )}
                        </div>
                        <h3 className="text-[15px] font-bold text-[#141414] mt-1.5">
                          {cohort.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => toggleCohortExpand(cohort.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E2E1DA] bg-[#FAF9F6] text-[#4A4944] text-[11.5px] font-medium hover:bg-[#F2F1EC] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <span>{isExpanded ? "Hide Departments" : "View Departments"}</span>
                        {isExpanded ? (
                          <ChevronUp className="size-3.5 text-[#7A7973]" />
                        ) : (
                          <ChevronDown className="size-3.5 text-[#7A7973]" />
                        )}
                      </button>
                    </div>

                    {/* Metadata summary grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-3 rounded-md bg-[#FAF9F6] border border-[#EAE9E4] text-[11.5px]">
                      <div>
                        <span className="text-[#7A7973] block text-[10px] uppercase font-mono tracking-wider">
                          Departments
                        </span>
                        <span className="font-semibold text-[#141414] flex items-center gap-1.5 mt-0.5">
                          <Building className="size-3.5 text-[#7A7973]" />
                          {cohort.departments.length} participating
                        </span>
                      </div>
                      <div>
                        <span className="text-[#7A7973] block text-[10px] uppercase font-mono tracking-wider">
                          Enrolled Students
                        </span>
                        <span className="font-semibold text-[#141414] flex items-center gap-1.5 mt-0.5">
                          <Users className="size-3.5 text-[#7A7973]" />
                          {cohort.studentsCount} students
                        </span>
                      </div>
                      <div>
                        <span className="text-[#7A7973] block text-[10px] uppercase font-mono tracking-wider">
                          Duration
                        </span>
                        <span className="font-semibold text-[#141414] flex items-center gap-1.5 mt-0.5">
                          <Calendar className="size-3.5 text-[#7A7973]" />
                          {cohort.startDate} &ndash; {cohort.endDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#7A7973] block text-[10px] uppercase font-mono tracking-wider">
                          Total Weeks
                        </span>
                        <span className="font-semibold text-[#141414] mt-0.5 block">
                          {cohort.total_weeks || 12} Weeks (Saturday deadlines)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Participating Departments Section */}
                  {isExpanded && (
                    <div className="p-5 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[12px] font-bold text-[#141414] uppercase tracking-wider font-mono">
                          Participating Departments & Coordinators
                        </h4>
                        <span className="text-[11px] text-[#7A7973]">
                          {cohort.departments.length} department{cohort.departments.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      {cohort.departments.length === 0 ? (
                        <p className="text-[12px] text-[#7A7973] italic py-2">
                          No departments currently linked to this cohort.
                        </p>
                      ) : (
                        <div className="divide-y divide-[#EAE9E4] rounded-md border border-[#EAE9E4] overflow-hidden bg-white">
                          {cohort.departments.map((dept) => {
                            const hasCoordinator = Boolean(dept.coordinator);
                            const pendingInvite = !hasCoordinator
                              ? getPendingInvite(dept.name, cohort.programme)
                              : null;

                            return (
                              <div
                                key={dept.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 hover:bg-[#FAF9F6] transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[13px] font-semibold text-[#141414]">
                                      {dept.name}
                                    </span>
                                    {!hasCoordinator && !pendingInvite && (
                                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                                        Unassigned &ndash; action required
                                      </span>
                                    )}
                                    {pendingInvite && (
                                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200 inline-flex items-center gap-1">
                                        <Mail className="size-2.5 text-blue-600" />
                                        Invite Sent &ndash; Pending Signup
                                      </span>
                                    )}
                                  </div>

                                  {hasCoordinator ? (
                                    <div className="flex items-center gap-2 text-[11.5px] text-[#4A4944]">
                                      <UserCheck className="size-3.5 text-emerald-600 shrink-0" />
                                      <span className="font-medium text-[#141414]">
                                        {dept.coordinator?.name}
                                      </span>
                                      <span className="text-[#7A7973]">
                                        ({dept.coordinator?.email})
                                      </span>
                                    </div>
                                  ) : pendingInvite ? (
                                    <div className="flex items-center gap-2 text-[11.5px] text-[#5A5954]">
                                      <span>
                                        Invitation dispatched to{" "}
                                        <strong className="text-[#141414] font-medium">
                                          {pendingInvite.email}
                                        </strong>
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleResendInvite(pendingInvite.id, pendingInvite.email)
                                        }
                                        className="text-[#141414] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <RefreshCw className="size-2.5" />
                                        Resend
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-[#9A9990]">
                                      No coordinator assigned yet. Student logbook sign-offs and assessments will remain pending.
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {hasCoordinator ? (
                                    <button
                                      onClick={() => handleOpenAssignModal(cohort, dept)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium border border-[#D5D4CD] bg-white text-[#4A4944] hover:bg-[#F2F1EC] hover:text-[#141414] transition-all cursor-pointer"
                                    >
                                      <span>Change Coordinator</span>
                                    </button>
                                  ) : pendingInvite ? (
                                    <button
                                      onClick={() => handleOpenAssignModal(cohort, dept)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium border border-[#D5D4CD] bg-white text-[#4A4944] hover:bg-[#F2F1EC] hover:text-[#141414] transition-all cursor-pointer"
                                    >
                                      <span>Assign Someone Else</span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleOpenAssignModal(cohort, dept, false)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium bg-[#141414] text-white hover:bg-[#282828] transition-all shadow-xs cursor-pointer"
                                      >
                                        <Plus className="size-3" />
                                        <span>Assign Coordinator</span>
                                      </button>
                                      <button
                                        onClick={() => handleOpenAssignModal(cohort, dept, true)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11.5px] font-medium border border-[#D5D4CD] bg-white text-[#4A4944] hover:bg-[#F2F1EC] hover:text-[#141414] transition-all cursor-pointer"
                                        title="Invite a new lecturer via email"
                                      >
                                        <Mail className="size-3 text-[#7A7973]" />
                                        <span>Invite</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CREATE FACULTY COHORT MODAL ── */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <div className="bg-white rounded-lg border border-[#D5D4CD] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E7E1] bg-[#FAF9F6] shrink-0">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#141414] tracking-tight">
                    Create Faculty-Wide Cohort
                  </h3>
                  <p className="text-[12px] text-[#6E6D67] mt-0.5">
                    Define the training cycle and choose participating departments within the faculty.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-md text-[#7A7973] hover:text-[#141414] hover:bg-[#EAE8E0] transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateCohort} className="p-6 space-y-4.5 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Faculty Selection */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#2E2D29]">
                    Faculty *
                  </label>
                  <select
                    value={formData.faculty_id}
                    onChange={(e) => handleFacultyChange(Number(e.target.value))}
                    className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                  >
                    {faculties.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} ({fac.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Programme & Academic Session */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      Training Programme *
                    </label>
                    <select
                      value={formData.programme}
                      onChange={(e) =>
                        setFormData({ ...formData, programme: e.target.value as "SWEP" | "SIWES" })
                      }
                      className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                    >
                      <option value="SWEP">SWEP (200L On-Campus)</option>
                      <option value="SIWES">SIWES (300L / 400L Industry Internship)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      Academic Session *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2026/2027"
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] placeholder:text-[#9A9990] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                    />
                  </div>
                </div>

                {/* Custom Cohort Name (Optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      Cohort Name <span className="text-[#7A7973] font-normal">(Optional)</span>
                    </label>
                    <span className="text-[11px] text-[#7A7973]">
                      Auto-generated if left blank
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={`e.g. ${formData.programme} ${formData.session || '2026/2027'} - ${selectedFaculty?.code || 'FAC'}`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-9.5 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] placeholder:text-[#9A9990] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                  />
                </div>

                {/* Participating Departments Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      Participating Departments * ({formData.department_ids.length} selected)
                    </label>
                    <div className="flex items-center gap-2 text-[11.5px]">
                      <button
                        type="button"
                        onClick={handleSelectAllDepartments}
                        className="text-[#141414] hover:underline font-medium cursor-pointer"
                      >
                        Select all
                      </button>
                      <span className="text-[#B0AFA9]">&bull;</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllDepartments}
                        className="text-[#7A7973] hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="rounded-md border border-[#E2E1DA] p-3 max-h-48 overflow-y-auto space-y-2 bg-[#FAF9F6]/50">
                    {facultyDepartments.map((dept) => {
                      const isChecked = formData.department_ids.includes(dept.id);
                      return (
                        <label
                          key={dept.id}
                          className="flex items-center gap-2.5 text-[12.5px] text-[#141414] cursor-pointer hover:text-black select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDepartment(dept.id)}
                            className="rounded border-[#C5C4BD] text-[#141414] focus:ring-[#141414] size-4 cursor-pointer"
                          />
                          <span>{dept.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[#7A7973]">
                    Only departments selected here will be included in the cohort. You can assign or invite coordinators to each department after creation.
                  </p>
                </div>

                {/* Duration & Weeks */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#2E2D29]">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => updateCohortDate("start_date", e.target.value)}
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
                      onChange={(e) => updateCohortDate("end_date", e.target.value)}
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
                      onChange={(e) =>
                        setFormData({ ...formData, total_weeks: Number(e.target.value) || 12 })
                      }
                      className="w-full h-9.5 px-2.5 rounded-md border border-[#D5D4CE] bg-white text-[12.5px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 -mx-6 -mb-6 px-6 py-3.5 bg-[#FAF9F6] border-t border-[#E8E7E1] flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
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

        {/* ── UNIFIED ASSIGN OR INVITE COORDINATOR MODAL ── */}
        {assignModal.open && assignModal.cohort && assignModal.department && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <div className="bg-white rounded-lg border border-[#D5D4CD] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E7E1] bg-[#FAF9F6]">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#141414] tracking-tight">
                    Coordinator Allocation
                  </h3>
                  <p className="text-[12px] text-[#6E6D67] mt-0.5">
                    {assignModal.cohort.name} &bull; {assignModal.department.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAssignModal({
                      open: false,
                      cohort: null,
                      department: null,
                      tab: "assign",
                      selectedCoordinatorId: "",
                      inviteEmail: "",
                    })
                  }
                  className="p-1.5 rounded-md text-[#7A7973] hover:text-[#141414] hover:bg-[#EAE8E0] transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Segmented Control Tabs */}
              <div className="p-3 bg-[#FAF9F6] border-b border-[#E8E7E1] flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setAssignModal((prev) => ({ ...prev, tab: "assign" }))}
                  className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                    assignModal.tab === "assign"
                      ? "bg-white text-[#141414] shadow-2xs border border-[#D5D4CD]"
                      : "text-[#7A7973] hover:text-[#141414] hover:bg-white/50"
                  }`}
                >
                  Choose Existing ({eligibleCoordinators.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAssignModal((prev) => ({ ...prev, tab: "invite" }))}
                  className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    assignModal.tab === "invite"
                      ? "bg-white text-[#141414] shadow-2xs border border-[#D5D4CD]"
                      : "text-[#7A7973] hover:text-[#141414] hover:bg-white/50"
                  }`}
                >
                  <Plus className="size-3" />
                  <span>Invite New Coordinator</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {assignError && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{assignError}</span>
                  </div>
                )}

                {/* TAB 1: Assign Existing Coordinator */}
                {assignModal.tab === "assign" && (
                  <form onSubmit={handleSaveCoordinatorAssignment} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-[#2E2D29]">
                        Select Registered Coordinator ({assignModal.cohort.programme})
                      </label>
                      <select
                        value={assignModal.selectedCoordinatorId}
                        onChange={(e) =>
                          setAssignModal((prev) => ({
                            ...prev,
                            selectedCoordinatorId:
                              e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        className="w-full h-10 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                      >
                        <option value="">&mdash; Leave Unassigned &mdash;</option>
                        {eligibleCoordinators.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email}) &bull; {c.department}
                          </option>
                        ))}
                      </select>

                      {eligibleCoordinators.length === 0 ? (
                        <div className="p-3 mt-2 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11.5px] space-y-1">
                          <p className="font-semibold">No registered coordinators found for {assignModal.cohort.programme}.</p>
                          <p className="text-amber-800">
                            You can invite a lecturer or faculty member directly below.
                          </p>
                          <button
                            type="button"
                            onClick={() => setAssignModal((prev) => ({ ...prev, tab: "invite" }))}
                            className="inline-flex items-center gap-1 font-semibold text-[#141414] underline pt-1 cursor-pointer"
                          >
                            <span>Switch to Invite Coordinator &rarr;</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#7A7973] pt-1">
                          Don&apos;t see who you need?{" "}
                          <button
                            type="button"
                            onClick={() => setAssignModal((prev) => ({ ...prev, tab: "invite" }))}
                            className="text-[#141414] font-medium underline cursor-pointer"
                          >
                            Invite a new coordinator via email
                          </button>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 -mx-6 -mb-6 px-6 py-3.5 bg-[#FAF9F6] border-t border-[#E8E7E1] flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setAssignModal({
                            open: false,
                            cohort: null,
                            department: null,
                            tab: "assign",
                            selectedCoordinatorId: "",
                            inviteEmail: "",
                          })
                        }
                        className="px-3.5 py-2 rounded-md border border-[#D5D4CE] bg-white text-[12.5px] font-medium text-[#4A4944] hover:bg-[#F3F2EE] hover:text-[#141414] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="px-4.5 py-2 rounded-md bg-[#141414] text-white text-[12.5px] font-medium hover:bg-[#282828] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isPending ? "Saving assignment…" : "Save Assignment"}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: Invite New Coordinator */}
                {assignModal.tab === "invite" && (
                  <form onSubmit={handleSendCoordinatorInvite} className="space-y-4">
                    {/* Pre-filled info pill */}
                    <div className="p-3 rounded-md bg-[#FAF9F6] border border-[#E8E7E1] space-y-1 text-[11.5px]">
                      <div className="flex justify-between">
                        <span className="text-[#7A7973]">Department:</span>
                        <span className="font-semibold text-[#141414]">{assignModal.department.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A7973]">Programme:</span>
                        <span className="font-semibold text-[#141414]">{assignModal.cohort.programme}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-[#2E2D29]">
                        Lecturer / Coordinator Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. coordinator@oauife.edu.ng"
                        value={assignModal.inviteEmail}
                        onChange={(e) =>
                          setAssignModal((prev) => ({ ...prev, inviteEmail: e.target.value }))
                        }
                        className="w-full h-10 px-3 rounded-md border border-[#D5D4CE] bg-white text-[13px] text-[#141414] placeholder:text-[#9A9990] outline-none transition-all focus:border-[#141414] focus:ring-1 focus:ring-[#141414] hover:border-[#BFBEB5] shadow-2xs"
                      />
                      <p className="text-[11px] text-[#7A7973] leading-relaxed pt-0.5">
                        An official sign-up invitation will be sent to this email (valid for 72 hours). When they register, they will automatically be assigned to manage {assignModal.department.name} in this cohort.
                      </p>
                    </div>

                    <div className="pt-3 -mx-6 -mb-6 px-6 py-3.5 bg-[#FAF9F6] border-t border-[#E8E7E1] flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setAssignModal({
                            open: false,
                            cohort: null,
                            department: null,
                            tab: "assign",
                            selectedCoordinatorId: "",
                            inviteEmail: "",
                          })
                        }
                        className="px-3.5 py-2 rounded-md border border-[#D5D4CE] bg-white text-[12.5px] font-medium text-[#4A4944] hover:bg-[#F3F2EE] hover:text-[#141414] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-md bg-[#141414] text-white text-[12.5px] font-medium hover:bg-[#282828] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <Send className="size-3.5" />
                        <span>{isPending ? "Sending invitation…" : "Send Invite & Auto-Link"}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
