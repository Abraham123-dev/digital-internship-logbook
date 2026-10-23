import type { ApiResult } from "@/types/api";
import { tokenStore } from "./client";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api/v1";

/* ── Coordinator Types ────────────────────────────────────────────── */
export type ProgrammeType = "SWEP" | "SIWES";

export interface CoordinatorStudentSummary {
  id: string;
  name: string;
  matricNo: string;
  department: string;
  programme: ProgrammeType;
  avatarUrl?: string;
  weeksSubmitted: number;
  totalWeeks: number;
  runningScoreAvg: number; // 0 - 100%
  status: "active" | "overdue" | "extension_pending" | "needs_review";
  pendingReviewCount: number;
  attendanceRate?: number; // SWEP only (e.g. 92%)
  supervisorBatchStatus?: "awaiting" | "reviewed" | "none"; // SIWES only
}

export interface DaySubmissionEntry {
  dayName: string; // "Monday", "Tuesday", etc.
  date: string;    // "2024-10-21"
  activities: string;
  skills: string;
  reflection: string;
  photos: string[];
  rating: number | null; // 1 to 5
  comment: string | null;
  isFilled: boolean;
}

export interface WeeklySubmissionDetail {
  id: string;
  studentId: string;
  studentName: string;
  matricNo: string;
  department: string;
  programme: ProgrammeType;
  weekNumber: number;
  dates: string;
  submittedAt: string;
  status: "PENDING_REVIEW" | "APPROVED" | "RETURNED";
  isLateApproved?: boolean;
  days: DaySubmissionEntry[];
  coordinatorFeedback?: string;
  returnReason?: string;
  supervisorSignOff?: {
    supervisorName: string;
    company: string;
    reviewedAt: string;
    reviewText: string;
  };
}

export interface ExtensionRequestItem {
  id: string;
  studentId: string;
  studentName: string;
  matricNo: string;
  programme: ProgrammeType;
  weekNumber: number;
  deadlineDate: string;
  reason: string;
  attachmentUrl?: string;
  status: "pending" | "approved" | "denied";
  requestedAt: string;
  graceDays?: number;
  newDeadline?: string;
  coordinatorComment?: string;
}

export interface AttendanceSession {
  code: string;
  active: boolean;
  expiresAt: string; // ISO string
  durationMinutes: number;
  presentCount: number;
  totalStudents: number;
  records: Array<{
    studentId: string;
    studentName: string;
    matricNo: string;
    status: "present" | "absent" | "excused";
    time?: string;
    reason?: string;
  }>;
}

export interface CohortSettings {
  programme: ProgrammeType;
  academicYear: string;
  cycle: string;
  startDate: string;
  endDate: string;
  workingDays: string[];
  holidays: Array<{ date: string; label: string }>;
  weeklyDeadlineDay: string;
  weeklyDeadlineTime: string;
  maxGraceDays: number;
}

/* ── Mock Data Repository for Development ─────────────────────────── */
const MOCK_STUDENTS: CoordinatorStudentSummary[] = [
  {
    id: "std-1",
    name: "Ada Okafor",
    matricNo: "CSC/2021/042",
    department: "Computer Science & Engineering",
    programme: "SWEP",
    weeksSubmitted: 3,
    totalWeeks: 12,
    runningScoreAvg: 86,
    status: "needs_review",
    pendingReviewCount: 1,
    attendanceRate: 92,
  },
  {
    id: "std-2",
    name: "Tunde Bakare",
    matricNo: "CSC/2021/089",
    department: "Computer Science & Engineering",
    programme: "SWEP",
    weeksSubmitted: 2,
    totalWeeks: 12,
    runningScoreAvg: 78,
    status: "extension_pending",
    pendingReviewCount: 0,
    attendanceRate: 85,
  },
  {
    id: "std-3",
    name: "Chidinma Nwosu",
    matricNo: "CSC/2021/015",
    department: "Computer Science & Engineering",
    programme: "SWEP",
    weeksSubmitted: 3,
    totalWeeks: 12,
    runningScoreAvg: 94,
    status: "needs_review",
    pendingReviewCount: 1,
    attendanceRate: 96,
  },
  {
    id: "std-4",
    name: "Ibrahim Musa",
    matricNo: "CSC/2021/112",
    department: "Computer Science & Engineering",
    programme: "SWEP",
    weeksSubmitted: 1,
    totalWeeks: 12,
    runningScoreAvg: 60,
    status: "overdue",
    pendingReviewCount: 0,
    attendanceRate: 70,
  },
  {
    id: "std-5",
    name: "Fatima Aliyu",
    matricNo: "CSC/2021/064",
    department: "Computer Science & Engineering",
    programme: "SWEP",
    weeksSubmitted: 3,
    totalWeeks: 12,
    runningScoreAvg: 88,
    status: "active",
    pendingReviewCount: 0,
    attendanceRate: 90,
  },
];

const MOCK_EXTENSIONS: ExtensionRequestItem[] = [
  {
    id: "ext-1",
    studentId: "std-2",
    studentName: "Tunde Bakare",
    matricNo: "CSC/2021/089",
    programme: "SWEP",
    weekNumber: 3,
    deadlineDate: "19 Oct 2024",
    reason: "Suffered severe malaria and fever during the weekend submission window. Medical certificate from OAU Health Centre attached.",
    attachmentUrl: "#",
    status: "pending",
    requestedAt: "20 Oct 2024, 08:30 AM",
  },
  {
    id: "ext-2",
    studentId: "std-4",
    studentName: "Ibrahim Musa",
    matricNo: "CSC/2021/112",
    programme: "SWEP",
    weekNumber: 2,
    deadlineDate: "12 Oct 2024",
    reason: "Workshop electrical faults and equipment power issues prevented logging test runs on time.",
    status: "denied",
    requestedAt: "13 Oct 2024, 11:15 AM",
    coordinatorComment: "Reason was submitted after the permissible 48-hour window without medical proof.",
  },
];

/* ── Coordinator API Client ───────────────────────────────────────── */
export const coordinatorApi = {
  /** Fetch overview statistics & pending submissions */
  async getDashboardData(): Promise<ApiResult<{
    stats: {
      enrolledStudents: number;
      pendingReviews: number;
      pendingExtensions: number;
      overdueWeeks: number;
      averageAttendance: number;
    };
    recentSubmissions: Array<{
      id: string;
      studentName: string;
      matricNo: string;
      weekNumber: number;
      dates: string;
      tasksSummary: string;
      status: "PENDING_REVIEW" | "APPROVED" | "RETURNED";
      submittedAt: string;
    }>;
    cohortInfo: {
      programme: ProgrammeType;
      cycle: string;
      weekNumber: number;
      totalWeeks: number;
      submissionDeadline: string;
    };
  }>> {
    // Attempt backend endpoint if available, fallback gracefully to mock
    try {
      const token = tokenStore.getAccess();
      if (token) {
        const res = await fetch(`${BASE}/coordinator/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return { ok: true, data };
        }
      }
    } catch {
      // Backend not yet available for this endpoint
    }

    return {
      ok: true,
      data: {
        stats: {
          enrolledStudents: 34,
          pendingReviews: 3,
          pendingExtensions: 1,
          overdueWeeks: 2,
          averageAttendance: 91,
        },
        recentSubmissions: [
          {
            id: "sub-101",
            studentName: "Ada Okafor",
            matricNo: "CSC/2021/042",
            weekNumber: 3,
            dates: "14 – 18 Oct 2024",
            tasksSummary: "Completed PostgreSQL database migration scripts, Docker compose cluster, and tested container networks.",
            status: "PENDING_REVIEW",
            submittedAt: "19 Oct, 10:45 PM",
          },
          {
            id: "sub-102",
            studentName: "Chidinma Nwosu",
            matricNo: "CSC/2021/015",
            weekNumber: 3,
            dates: "14 – 18 Oct 2024",
            tasksSummary: "Created REST API endpoints for user logbook submissions, applied JWT token refresh rotation.",
            status: "PENDING_REVIEW",
            submittedAt: "19 Oct, 11:15 PM",
          },
          {
            id: "sub-103",
            studentName: "Fatima Aliyu",
            matricNo: "CSC/2021/064",
            weekNumber: 2,
            dates: "07 – 11 Oct 2024",
            tasksSummary: "Frontend state synchronization and client-side form validation using React Hook Form.",
            status: "APPROVED",
            submittedAt: "12 Oct, 09:20 PM",
          },
        ],
        cohortInfo: {
          programme: "SWEP",
          cycle: "2024/2025 Cycle 1",
          weekNumber: 4,
          totalWeeks: 12,
          submissionDeadline: "Saturday, 26 Oct at 11:59 PM",
        },
      },
    };
  },

  /** Fetch students list with filtering */
  async getStudents(query?: string, filter?: string): Promise<ApiResult<CoordinatorStudentSummary[]>> {
    let list = [...MOCK_STUDENTS];
    if (filter === "needs_review") {
      list = list.filter((s) => s.status === "needs_review");
    } else if (filter === "overdue") {
      list = list.filter((s) => s.status === "overdue");
    } else if (filter === "extension_pending") {
      list = list.filter((s) => s.status === "extension_pending");
    }

    if (query?.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.matricNo.toLowerCase().includes(q)
      );
    }

    return { ok: true, data: list };
  },

  /** Get specific student detail with all weeks */
  async getStudentDetail(id: string): Promise<ApiResult<CoordinatorStudentSummary & {
    weeks: Array<{
      weekNumber: number;
      dates: string;
      status: "reviewed" | "submitted" | "in_progress" | "overdue" | "missed";
      score?: number;
      feedback?: string;
    }>;
  }>> {
    const student = MOCK_STUDENTS.find((s) => s.id === id) || MOCK_STUDENTS[0];
    return {
      ok: true,
      data: {
        ...student,
        weeks: [
          { weekNumber: 1, dates: "30 Sep – 04 Oct", status: "reviewed", score: 4.5, feedback: "Excellent documentation." },
          { weekNumber: 2, dates: "07 – 11 Oct", status: "reviewed", score: 4.2, feedback: "Good detail on CORS." },
          { weekNumber: 3, dates: "14 – 18 Oct", status: "submitted" },
          { weekNumber: 4, dates: "21 – 25 Oct", status: "in_progress" },
        ],
      },
    };
  },

  /** Fetch a specific week submission for grading */
  async getSubmissionDetail(weekId: string): Promise<ApiResult<WeeklySubmissionDetail>> {
    return {
      ok: true,
      data: {
        id: weekId,
        studentId: "std-1",
        studentName: "Ada Okafor",
        matricNo: "CSC/2021/042",
        department: "Computer Science & Engineering",
        programme: "SWEP",
        weekNumber: 3,
        dates: "14 – 18 October 2024",
        submittedAt: "Saturday, 19 October 2024 at 10:45 PM",
        status: "PENDING_REVIEW",
        days: [
          {
            dayName: "Monday",
            date: "2024-10-14",
            activities: "Analyzed relational database schema for the logbook. Set up PostgreSQL database tables with foreign keys and index constraints.",
            skills: "PostgreSQL, DDL scripts, ER diagrams, foreign key constraints.",
            reflection: "Took time to properly model UUID keys vs autoincrement IDs. Decided on UUIDs for security.",
            photos: [],
            rating: 4,
            comment: "Clear understanding of normalization.",
            isFilled: true,
          },
          {
            dayName: "Tuesday",
            date: "2024-10-15",
            activities: "Configured Docker Compose to orchestrate local backend web container, Redis worker, and database services.",
            skills: "Docker Compose, multi-container orchestration, port mapping.",
            reflection: "Encountered container host networking conflict, resolved with explicit bridge network.",
            photos: [],
            rating: 5,
            comment: "Well-explained network diagnosis.",
            isFilled: true,
          },
          {
            dayName: "Wednesday",
            date: "2024-10-16",
            activities: "Created initial Django database seed scripts for test departments and academic terms.",
            skills: "Python manage.py commands, Django ORM bulk_create.",
            reflection: "Batch inserts improved seed execution from 45s down to 2s.",
            photos: [],
            rating: null,
            comment: null,
            isFilled: true,
          },
          {
            dayName: "Thursday",
            date: "2024-10-17",
            activities: "Conducted unit test suites for API authentication endpoints and token refresh cycles.",
            skills: "Pytest, REST client mocks, HTTP status validation.",
            reflection: "Found edge case in token blacklisting upon password reset.",
            photos: [],
            rating: null,
            comment: null,
            isFilled: true,
          },
          {
            dayName: "Friday",
            date: "2024-10-18",
            activities: "Weekly synthesis and verification testing with department team leads.",
            skills: "Team presentation, sprint review, technical demo.",
            reflection: "Demo was well received. Feedback noted for week 4 migrations.",
            photos: [],
            rating: null,
            comment: null,
            isFilled: true,
          },
        ],
      },
    };
  },

  /** Submit review rating and comments */
  async submitReview(
    submissionId: string,
    action: "approve" | "return",
    payload: {
      ratings: Record<number, number>; // dayIndex -> 1..5
      comments: Record<number, string>;
      overallComment: string;
      returnReason?: string;
      correctionDeadline?: string;
    }
  ): Promise<ApiResult<{ success: boolean; averageScore: number }>> {
    // Calculates score average
    const vals = Object.values(payload.ratings);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 4.0;
    return { ok: true, data: { success: true, averageScore: avg } };
  },

  /** Fetch extension requests */
  async getExtensionRequests(): Promise<ApiResult<ExtensionRequestItem[]>> {
    return { ok: true, data: MOCK_EXTENSIONS };
  },

  /** Decide on an extension request */
  async decideExtension(
    requestId: string,
    decision: "approve" | "deny",
    payload: { graceDays?: number; comment?: string }
  ): Promise<ApiResult<{ success: boolean }>> {
    return { ok: true, data: { success: true } };
  },

  /** Get active attendance session */
  async getAttendanceSession(): Promise<ApiResult<AttendanceSession>> {
    return {
      ok: true,
      data: {
        code: "K9X2P4",
        active: true,
        expiresAt: new Date(Date.now() + 140000).toISOString(),
        durationMinutes: 3,
        presentCount: 24,
        totalStudents: 34,
        records: [
          { studentId: "std-1", studentName: "Ada Okafor", matricNo: "CSC/2021/042", status: "present", time: "09:02 AM" },
          { studentId: "std-2", studentName: "Tunde Bakare", matricNo: "CSC/2021/089", status: "present", time: "09:04 AM" },
          { studentId: "std-3", studentName: "Chidinma Nwosu", matricNo: "CSC/2021/015", status: "present", time: "09:01 AM" },
          { studentId: "std-4", studentName: "Ibrahim Musa", matricNo: "CSC/2021/112", status: "absent" },
          { studentId: "std-5", studentName: "Fatima Aliyu", matricNo: "CSC/2021/064", status: "present", time: "09:05 AM" },
        ],
      },
    };
  },

  /** Generate new attendance code */
  async generateAttendanceCode(durationMinutes: number): Promise<ApiResult<{ code: string; expiresAt: string }>> {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return {
      ok: true,
      data: {
        code,
        expiresAt: new Date(Date.now() + durationMinutes * 60000).toISOString(),
      },
    };
  },

  /** Override a student's attendance */
  async overrideAttendance(
    studentId: string,
    status: "present" | "excused",
    reason: string
  ): Promise<ApiResult<{ success: boolean }>> {
    return { ok: true, data: { success: true } };
  },

  /** Fetch cohort configuration */
  async getCohortSettings(): Promise<ApiResult<CohortSettings>> {
    return {
      ok: true,
      data: {
        programme: "SWEP",
        academicYear: "2024/2025",
        cycle: "Cycle 1 (Semester Break)",
        startDate: "2024-09-30",
        endDate: "2024-12-20",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        holidays: [
          { date: "2024-10-01", label: "Independence Day" },
          { date: "2024-12-25", label: "Christmas Day" },
        ],
        weeklyDeadlineDay: "Saturday",
        weeklyDeadlineTime: "23:59",
        maxGraceDays: 7,
      },
    };
  },
};
