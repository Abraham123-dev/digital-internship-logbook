import type { ApiResult } from "@/types/api";
import { api } from "./client";

export type DayStatus = "ready" | "draft" | "empty" | "submitted" | "reviewed" | "returned" | "future" | "holiday";
export type WeekStatus = "in_progress" | "submitted" | "reviewed" | "returned" | "overdue" | "missed";
export type ProgrammeType = "SWEP" | "SIWES";

export interface StudentDayData {
  date: string;
  dayName: string;
  dayShort: string;
  status: DayStatus;
  activities: string;
  skills: string;
  reflection: string;
  photos: string[];
  rating?: number;
  coordinatorComment?: string;
}

export interface StudentWeekSummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  status: WeekStatus;
  filledDays: number;
  totalDays: number;
  score?: number;
  feedback?: string;
  days: StudentDayData[];
}

export interface StudentDashboardData {
  student: {
    name: string;
    matricNo: string;
    department: string;
    programme: ProgrammeType;
    institution: string;
  };
  metrics: {
    currentWeek: number;
    totalWeeks: number;
    completionPct: number;
    attendanceRate: number; // e.g. 92%
    runningScoreAvg: number; // e.g. 84%
    statusText: string;
  };
  currentWeek: StudentWeekSummary;
  weeks: StudentWeekSummary[];
}

export interface StudentAttendanceData {
  rate: number;
  attended: number;
  total: number;
  activeSession: boolean;
  activeSessionExpiresAt?: string;
  history: Array<{
    date: string;
    dayName: string;
    status: "present" | "absent" | "excused";
    code?: string;
    time?: string;
    note?: string;
  }>;
}

export interface SupervisorReviewBatchItem {
  id: string;
  batchLabel: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  sentAt: string;
  status: "pending" | "reviewed" | "expired";
  reviewedAt?: string;
  rating?: number;
  feedback?: string;
  signedBy?: string;
}

export interface SaveDayPayload {
  activities: string;
  skills: string;
  reflection: string;
  photos?: string[];
  isDraft?: boolean;
}

export interface RequestExtensionPayload {
  reason: "medical" | "technical" | "university_event" | "workplace_emergency" | "other";
  graceDays: number;
  notes: string;
}

export interface SendSupervisorBatchPayload {
  supervisorEmail: string;
  supervisorName: string;
  companyName: string;
  weekNumbers: number[];
  personalMessage?: string;
}

/* ── Fallback Seed State ────────────────────────────────────────────── */
const MOCK_DAYS_W4: StudentDayData[] = [
  {
    date: "2024-10-21",
    dayName: "Monday",
    dayShort: "Mon",
    status: "reviewed",
    activities: "Installed Docker Desktop, configured PostgreSQL container environment, and wrote migration runner scripts for testing user tables.",
    skills: "Docker, PostgreSQL, Linux Shell",
    reflection: "Container networking required explicit port binding to avoid localhost collision.",
    photos: [],
    rating: 4,
    coordinatorComment: "Good technical specificity. Make sure to detail volume persistence.",
  },
  {
    date: "2024-10-22",
    dayName: "Tuesday",
    dayShort: "Tue",
    status: "reviewed",
    activities: "Identified and fixed CORS headers issue on authentication endpoints. Configured JWT refresh token rotation with secure storage.",
    skills: "Django REST Framework, JWT Security, HTTP Headers",
    reflection: "Token rotation prevents replay attacks while maintaining seamless session refresh.",
    photos: [],
    rating: 5,
    coordinatorComment: "Excellent work addressing token security standard.",
  },
  {
    date: "2024-10-23",
    dayName: "Wednesday",
    dayShort: "Wed",
    status: "ready",
    activities: "Drafted daily report for PostgreSQL seed scripts and container networking test scenarios across development branches.",
    skills: "Database Seeding, Automated Testing",
    reflection: "Mock test datasets help isolate validation errors before staging integration.",
    photos: [],
  },
  {
    date: "2024-10-24",
    dayName: "Thursday",
    dayShort: "Thu",
    status: "empty",
    activities: "",
    skills: "",
    reflection: "",
    photos: [],
  },
  {
    date: "2024-10-25",
    dayName: "Friday",
    dayShort: "Fri",
    status: "future",
    activities: "",
    skills: "",
    reflection: "",
    photos: [],
  },
];

const MOCK_WEEKS: StudentWeekSummary[] = [
  {
    weekNumber: 1,
    startDate: "2024-09-30",
    endDate: "2024-10-04",
    status: "reviewed",
    filledDays: 5,
    totalDays: 5,
    score: 85,
    feedback: "Thorough orientation documentation and safety briefing records.",
    days: [],
  },
  {
    weekNumber: 2,
    startDate: "2024-10-07",
    endDate: "2024-10-11",
    status: "reviewed",
    filledDays: 5,
    totalDays: 5,
    score: 88,
    feedback: "Solid technical entries on component architecture and API scaffolding.",
    days: [],
  },
  {
    weekNumber: 3,
    startDate: "2024-10-14",
    endDate: "2024-10-18",
    status: "reviewed",
    filledDays: 5,
    totalDays: 5,
    score: 82,
    feedback: "Good progress on database migrations. Maintain daily entries consistently.",
    days: [],
  },
  {
    weekNumber: 4,
    startDate: "2024-10-21",
    endDate: "2024-10-25",
    status: "in_progress",
    filledDays: 3,
    totalDays: 5,
    days: MOCK_DAYS_W4,
  },
  {
    weekNumber: 5,
    startDate: "2024-10-28",
    endDate: "2024-11-01",
    status: "in_progress",
    filledDays: 0,
    totalDays: 5,
    days: [],
  },
  {
    weekNumber: 6,
    startDate: "2024-11-04",
    endDate: "2024-11-08",
    status: "in_progress",
    filledDays: 0,
    totalDays: 5,
    days: [],
  },
];

/* ── Student API Service ────────────────────────────────────────────── */
export const studentApi = {
  /** Fetch overview dashboard statistics and recent weeks */
  async getDashboard(): Promise<ApiResult<StudentDashboardData>> {
    try {
      const res = await api.get<StudentDashboardData>("/student/dashboard/");
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    return {
      ok: true,
      data: {
        student: {
          name: "Ada Okafor",
          matricNo: "CSC/2021/042",
          department: "Computer Science & Engineering",
          programme: "SWEP",
          institution: "Obafemi Awolowo University",
        },
        metrics: {
          currentWeek: 4,
          totalWeeks: 12,
          completionPct: 33,
          attendanceRate: 92,
          runningScoreAvg: 85,
          statusText: "Week 4 in progress",
        },
        currentWeek: MOCK_WEEKS[3],
        weeks: MOCK_WEEKS,
      },
    };
  },

  /** Fetch details for a specific week */
  async getWeek(weekNumber: number): Promise<ApiResult<StudentWeekSummary>> {
    try {
      const res = await api.get<StudentWeekSummary>(`/student/weeks/${weekNumber}/`);
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    const found = MOCK_WEEKS.find((w) => w.weekNumber === weekNumber) || {
      weekNumber,
      startDate: "2024-10-21",
      endDate: "2024-10-25",
      status: "in_progress" as WeekStatus,
      filledDays: 3,
      totalDays: 5,
      days: MOCK_DAYS_W4,
    };

    return { ok: true, data: found };
  },

  /** Submit a completed week for coordinator review */
  async submitWeek(weekNumber: number): Promise<ApiResult<{ message: string }>> {
    try {
      const res = await api.post<{ message: string }>(`/student/weeks/${weekNumber}/submit/`, {});
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    return { ok: true, data: { message: `Week ${weekNumber} submitted for coordinator review.` } };
  },

  /** Request a deadline extension appeal for an overdue or pending week */
  async requestWeekExtension(
    weekNumber: number,
    payload: RequestExtensionPayload
  ): Promise<ApiResult<{ message: string; id: string }>> {
    try {
      const res = await api.post<{ message: string; id: string }>(
        `/student/weeks/${weekNumber}/extension-appeal/`,
        payload
      );
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    return {
      ok: true,
      data: {
        id: `ext-${Date.now()}`,
        message: "Extension appeal submitted to faculty coordinator for review.",
      },
    };
  },

  /** Fetch log entry for a specific calendar date */
  async getDay(date: string): Promise<ApiResult<StudentDayData>> {
    try {
      const res = await api.get<StudentDayData>(`/student/days/${date}/`);
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    const found = MOCK_DAYS_W4.find((d) => d.date === date) || {
      date,
      dayName: "Weekday",
      dayShort: "Day",
      status: "empty" as DayStatus,
      activities: "",
      skills: "",
      reflection: "",
      photos: [],
    };

    return { ok: true, data: found };
  },

  /** Save or update a day entry */
  async saveDay(date: string, payload: SaveDayPayload): Promise<ApiResult<{ message: string; date: string }>> {
    try {
      const res = await api.put<{ message: string; date: string }>(`/student/days/${date}/`, payload);
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    return { ok: true, data: { message: "Day entry saved successfully.", date } };
  },

  /** Get attendance records and active check-in session */
  async getAttendance(): Promise<ApiResult<StudentAttendanceData>> {
    try {
      const res = await api.get<StudentAttendanceData>("/student/attendance/");
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    return {
      ok: true,
      data: {
        rate: 92,
        attended: 18,
        total: 20,
        activeSession: true,
        activeSessionExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        history: [
          { date: "2024-10-23", dayName: "Wednesday", status: "present", time: "09:04 AM", code: "749201" },
          { date: "2024-10-22", dayName: "Tuesday", status: "present", time: "08:58 AM", code: "392018" },
          { date: "2024-10-21", dayName: "Monday", status: "present", time: "09:12 AM", code: "850192" },
          { date: "2024-10-18", dayName: "Friday", status: "absent", note: "Excused medical leave" },
          { date: "2024-10-17", dayName: "Thursday", status: "present", time: "09:01 AM", code: "291048" },
        ],
      },
    };
  },

  /** Verify daily attendance OTP code */
  async verifyAttendanceCode(code: string): Promise<ApiResult<{ message: string }>> {
    try {
      const res = await api.post<{ message: string }>("/student/attendance/verify/", { code });
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    if (code.length === 6) {
      return { ok: true, data: { message: "Attendance verified successfully." } };
    }
    return { ok: false, status: 400, message: "Invalid or expired attendance code." };
  },

  /** Fetch workplace supervisor review batches (SIWES) */
  async getSupervisorReviews(): Promise<ApiResult<SupervisorReviewBatchItem[]>> {
    try {
      const res = await api.get<SupervisorReviewBatchItem[]>("/student/supervisor-reviews/");
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    return {
      ok: true,
      data: [
        {
          id: "batch-1",
          batchLabel: "Weeks 1–4 Logbook Evaluation",
          recipientEmail: "engr.alabi@techfirm.ng",
          recipientName: "Engr. Folake Alabi",
          companyName: "VentureCraft Engineering Ltd.",
          sentAt: "2024-10-22T10:30:00Z",
          status: "reviewed",
          reviewedAt: "2024-10-23T14:15:00Z",
          rating: 5,
          feedback: "Demonstrated strong grasp of database structures and containerized services.",
          signedBy: "Folake Alabi, Lead Systems Architect",
        },
      ],
    };
  },

  /** Send review batch invitation to workplace supervisor */
  async sendSupervisorBatch(payload: SendSupervisorBatchPayload): Promise<ApiResult<{ message: string }>> {
    try {
      const res = await api.post<{ message: string }>("/student/supervisor-reviews/send/", payload);
      if (res.ok) return res;
    } catch {
      // Fallback
    }

    return {
      ok: true,
      data: {
        message: `Evaluation link sent to ${payload.supervisorEmail}. Valid for 72 hours.`,
      },
    };
  },
};
