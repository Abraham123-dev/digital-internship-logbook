import type { ApiResult } from "@/types/api";
import { tokenStore } from "./client";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api/v1";

export interface AdminStats {
  totalStudents: number;
  activeCoordinators: number;
  pendingInvitations: number;
  weeksSubmittedThisWeek: number;
  overdueWeeksCount: number;
  cohortCompletionRate: number;
}

export interface AdminStudentItem {
  id: string;
  name: string;
  matricNo: string;
  email: string;
  department: string;
  programme: "SWEP" | "SIWES";
  coordinatorName: string;
  coordinatorId: string;
  status: "ACTIVE" | "DEACTIVATED" | "WITHDRAWN" | "RUSTICATED";
  weeksSubmitted: number;
  totalWeeks: number;
  registeredAt: string;
}

export interface AdminCoordinatorItem {
  id: string;
  name: string;
  email: string;
  staffId: string;
  department: string;
  programme: "SWEP" | "SIWES";
  enrolledStudentsCount: number;
  status: "ACTIVE" | "INACTIVE";
  joinedAt: string;
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: "ADMIN" | "COORDINATOR" | "STUDENT" | "SYSTEM";
  action: string;
  target: string;
  ipAddress: string;
  status: "SUCCESS" | "FAILED";
}

export interface AdminCohortItem {
  id: string;
  name: string;
  programme: "SWEP" | "SIWES";
  academicYear: string;
  departmentsCount: number;
  studentsCount: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "UPCOMING" | "CONCLUDED";
}

export interface DepartmentReportItem {
  department: string;
  programme: "SWEP" | "SIWES";
  enrolledStudents: number;
  submissionRate: number; // percentage
  missedWeeksCount: number;
  approvedExtensions: number;
  averageScore: number; // 0 - 100%
  averageAttendance?: number; // percentage
}

/* ── Admin API Client ─────────────────────────────────────────────── */
export const adminApi = {
  /** Fetch administration overview KPI statistics */
  async getOverviewStats(): Promise<ApiResult<AdminStats>> {
    try {
      const token = tokenStore.getAccess();
      if (token) {
        const res = await fetch(`${BASE}/admin/stats/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return { ok: true, data };
        }
      }
    } catch {
      // Backend not yet available
    }

    return {
      ok: true,
      data: {
        totalStudents: 148,
        activeCoordinators: 8,
        pendingInvitations: 2,
        weeksSubmittedThisWeek: 122,
        overdueWeeksCount: 6,
        cohortCompletionRate: 84,
      },
    };
  },

  /** Fetch student directory with server pagination & filters */
  async getStudents(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    department?: string;
    status?: string;
  }): Promise<ApiResult<{
    results: AdminStudentItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;

    const mockStudents: AdminStudentItem[] = [
      {
        id: "std-1",
        name: "Ada Okafor",
        matricNo: "CSC/2021/042",
        email: "aokafor@student.oauife.edu.ng",
        department: "Computer Science & Engineering",
        programme: "SWEP",
        coordinatorName: "Dr. Babatunde",
        coordinatorId: "coord-1",
        status: "ACTIVE",
        weeksSubmitted: 3,
        totalWeeks: 12,
        registeredAt: "28 Sep 2024",
      },
      {
        id: "std-2",
        name: "Tunde Bakare",
        matricNo: "CSC/2021/089",
        email: "tbakare@student.oauife.edu.ng",
        department: "Computer Science & Engineering",
        programme: "SWEP",
        coordinatorName: "Dr. Babatunde",
        coordinatorId: "coord-1",
        status: "ACTIVE",
        weeksSubmitted: 2,
        totalWeeks: 12,
        registeredAt: "28 Sep 2024",
      },
      {
        id: "std-3",
        name: "Chidinma Nwosu",
        matricNo: "CSC/2021/015",
        email: "cnwosu@student.oauife.edu.ng",
        department: "Computer Science & Engineering",
        programme: "SWEP",
        coordinatorName: "Dr. Babatunde",
        coordinatorId: "coord-1",
        status: "ACTIVE",
        weeksSubmitted: 3,
        totalWeeks: 12,
        registeredAt: "29 Sep 2024",
      },
      {
        id: "std-4",
        name: "Ibrahim Musa",
        matricNo: "CSC/2021/112",
        email: "imusa@student.oauife.edu.ng",
        department: "Computer Science & Engineering",
        programme: "SWEP",
        coordinatorName: "Dr. Babatunde",
        coordinatorId: "coord-1",
        status: "ACTIVE",
        weeksSubmitted: 1,
        totalWeeks: 12,
        registeredAt: "30 Sep 2024",
      },
      {
        id: "std-5",
        name: "Fatima Aliyu",
        matricNo: "CSC/2021/064",
        email: "faliyu@student.oauife.edu.ng",
        department: "Computer Science & Engineering",
        programme: "SWEP",
        coordinatorName: "Dr. Babatunde",
        coordinatorId: "coord-1",
        status: "ACTIVE",
        weeksSubmitted: 3,
        totalWeeks: 12,
        registeredAt: "30 Sep 2024",
      },
      {
        id: "std-6",
        name: "David Oladipo",
        matricNo: "EEE/2020/033",
        email: "doladipo@student.oauife.edu.ng",
        department: "Electrical & Electronic Engineering",
        programme: "SIWES",
        coordinatorName: "Engr. Prof. Adeleke",
        coordinatorId: "coord-2",
        status: "ACTIVE",
        weeksSubmitted: 4,
        totalWeeks: 16,
        registeredAt: "15 Sep 2024",
      },
      {
        id: "std-7",
        name: "Grace Eze",
        matricNo: "MEE/2020/058",
        email: "geze@student.oauife.edu.ng",
        department: "Mechanical Engineering",
        programme: "SIWES",
        coordinatorName: "Dr. Mrs. Adegoke",
        coordinatorId: "coord-3",
        status: "DEACTIVATED",
        weeksSubmitted: 0,
        totalWeeks: 16,
        registeredAt: "18 Sep 2024",
      },
    ];

    let filtered = [...mockStudents];
    if (params.search?.trim()) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) => s.name.toLowerCase().includes(q) || s.matricNo.toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== "ALL") {
      filtered = filtered.filter((s) => s.status === params.status);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize);
    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      ok: true,
      data: {
        results,
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  },

  /** Reassign coordinator or change status */
  async updateStudent(studentId: string, payload: {
    status?: string;
    coordinatorId?: string;
    reason?: string;
  }): Promise<ApiResult<{ success: boolean }>> {
    return { ok: true, data: { success: true } };
  },

  /** Fetch coordinators list with pagination */
  async getCoordinators(params: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResult<{
    results: AdminCoordinatorItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;

    const mockCoordinators: AdminCoordinatorItem[] = [
      {
        id: "coord-1",
        name: "Dr. Babatunde",
        email: "babatunde@oauife.edu.ng",
        staffId: "OAU/TECH/CSE/018",
        department: "Computer Science & Engineering",
        programme: "SWEP",
        enrolledStudentsCount: 34,
        status: "ACTIVE",
        joinedAt: "12 Aug 2024",
      },
      {
        id: "coord-2",
        name: "Engr. Prof. Adeleke",
        email: "adeleke@oauife.edu.ng",
        staffId: "OAU/TECH/EEE/009",
        department: "Electrical & Electronic Engineering",
        programme: "SIWES",
        enrolledStudentsCount: 42,
        status: "ACTIVE",
        joinedAt: "14 Aug 2024",
      },
      {
        id: "coord-3",
        name: "Dr. Mrs. Adegoke",
        email: "adegoke@oauife.edu.ng",
        staffId: "OAU/TECH/MEE/024",
        department: "Mechanical Engineering",
        programme: "SIWES",
        enrolledStudentsCount: 38,
        status: "ACTIVE",
        joinedAt: "16 Aug 2024",
      },
      {
        id: "coord-4",
        name: "Dr. O. Folorunso",
        email: "folorunso@oauife.edu.ng",
        staffId: "OAU/TECH/CVE/031",
        department: "Civil Engineering",
        programme: "SWEP",
        enrolledStudentsCount: 34,
        status: "ACTIVE",
        joinedAt: "18 Aug 2024",
      },
    ];

    const total = mockCoordinators.length;
    const start = (page - 1) * pageSize;
    const results = mockCoordinators.slice(start, start + pageSize);
    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      ok: true,
      data: { results, total, page, pageSize, totalPages },
    };
  },

  /** Fetch audit log entries with pagination & filtering */
  async getAuditLog(params: {
    page?: number;
    pageSize?: number;
    actorRole?: string;
  }): Promise<ApiResult<{
    results: AdminAuditEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;

    const mockLogs: AdminAuditEntry[] = [
      {
        id: "aud-1",
        timestamp: "23 Oct 2024, 02:40 PM",
        actor: "sysadmin@oauife.edu.ng",
        role: "ADMIN",
        action: "INVITATION_ISSUED",
        target: "Coordinator Invitation for Materials Science & Engineering",
        ipAddress: "105.112.98.14",
        status: "SUCCESS",
      },
      {
        id: "aud-2",
        timestamp: "23 Oct 2024, 11:15 AM",
        actor: "Dr. Babatunde",
        role: "COORDINATOR",
        action: "ATTENDANCE_CODE_GENERATED",
        target: "SWEP Code K9X2P4 (3 min validity)",
        ipAddress: "197.210.65.88",
        status: "SUCCESS",
      },
      {
        id: "aud-3",
        timestamp: "22 Oct 2024, 05:30 PM",
        actor: "Dr. Babatunde",
        role: "COORDINATOR",
        action: "WEEK_REVIEW_SUBMITTED",
        target: "Week 2 approved for student CSC/2021/042",
        ipAddress: "197.210.65.88",
        status: "SUCCESS",
      },
      {
        id: "aud-4",
        timestamp: "21 Oct 2024, 09:12 AM",
        actor: "sysadmin@oauife.edu.ng",
        role: "ADMIN",
        action: "STUDENT_REASSIGNED",
        target: "Reassigned student CSC/2021/089 to Dr. Babatunde",
        ipAddress: "105.112.98.14",
        status: "SUCCESS",
      },
      {
        id: "aud-5",
        timestamp: "20 Oct 2024, 10:45 PM",
        actor: "Ada Okafor",
        role: "STUDENT",
        action: "WEEK_SUBMITTED",
        target: "Submitted Week 3 Logbook for review",
        ipAddress: "102.89.34.120",
        status: "SUCCESS",
      },
    ];

    let filtered = [...mockLogs];
    if (params.actorRole && params.actorRole !== "ALL") {
      filtered = filtered.filter((l) => l.role === params.actorRole);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize);
    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      ok: true,
      data: { results, total, page, pageSize, totalPages },
    };
  },

  /** Fetch active cohorts */
  async getCohorts(): Promise<ApiResult<AdminCohortItem[]>> {
    return {
      ok: true,
      data: [
        {
          id: "coh-1",
          name: "SWEP 2024/2025 Cohort 1",
          programme: "SWEP",
          academicYear: "2024/2025",
          departmentsCount: 8,
          studentsCount: 148,
          startDate: "30 Sep 2024",
          endDate: "20 Dec 2024",
          status: "ACTIVE",
        },
        {
          id: "coh-2",
          name: "SIWES 2024/2025 Long Vacation",
          programme: "SIWES",
          academicYear: "2024/2025",
          departmentsCount: 5,
          studentsCount: 96,
          startDate: "16 Sep 2024",
          endDate: "10 Jan 2025",
          status: "ACTIVE",
        },
      ],
    };
  },

  /** Fetch departmental progress reports */
  async getReports(): Promise<ApiResult<DepartmentReportItem[]>> {
    return {
      ok: true,
      data: [
        {
          department: "Computer Science & Engineering",
          programme: "SWEP",
          enrolledStudents: 34,
          submissionRate: 91,
          missedWeeksCount: 1,
          approvedExtensions: 2,
          averageScore: 86,
          averageAttendance: 92,
        },
        {
          department: "Electrical & Electronic Engineering",
          programme: "SIWES",
          enrolledStudents: 42,
          submissionRate: 88,
          missedWeeksCount: 3,
          approvedExtensions: 4,
          averageScore: 82,
        },
        {
          department: "Mechanical Engineering",
          programme: "SIWES",
          enrolledStudents: 38,
          submissionRate: 84,
          missedWeeksCount: 4,
          approvedExtensions: 3,
          averageScore: 80,
        },
        {
          department: "Civil Engineering",
          programme: "SWEP",
          enrolledStudents: 34,
          submissionRate: 89,
          missedWeeksCount: 2,
          approvedExtensions: 1,
          averageScore: 84,
          averageAttendance: 88,
        },
      ],
    };
  },
};
