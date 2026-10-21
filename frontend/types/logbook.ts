export type DayPageStatus =
  | "not_filled"
  | "draft"
  | "submitted"
  | "reviewed"
  | "returned"
  | "future";

export type WeekStatus =
  | "in_progress"
  | "submitted"
  | "reviewed"
  | "returned"
  | "overdue"
  | "missed";

export type ExtensionStatus = "pending" | "approved" | "denied" | "expired";

export type AttendanceStatus = "present" | "absent" | "excused";

export type SupervisorBatchStatus =
  | "not_sent"
  | "awaiting_supervisor"
  | "reviewed"
  | "link_expired";

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
}

export interface DayPage {
  id: string;
  /** ISO date string YYYY-MM-DD in Nigeria time. */
  date: string;
  status: DayPageStatus;
  activities: string;
  skillsLearned: string | null;
  myReview: string | null;
  photos: Photo[];
  coordinatorComment: string | null;
  /** 1–5, null until coordinator reviews. */
  rating: number | null;
  /** True when activities.length >= 20. */
  isFilled: boolean;
  isWorkingDay: boolean;
  isHoliday: boolean;
  lastSavedAt: string | null;
}

export interface WeekDeadline {
  /** ISO datetime. Saturday 23:59 Nigeria time. */
  datetime: string;
  /** Human-readable countdown string from the server, never the browser clock. */
  timeRemaining: string;
  isPast: boolean;
}

export interface Week {
  id: string;
  weekNumber: number;
  totalWeeks: number;
  startDate: string;
  endDate: string;
  status: WeekStatus;
  days: DayPage[];
  filledDayCount: number;
  totalWorkingDayCount: number;
  deadline: WeekDeadline;
  submittedAt: string | null;
  reviewedAt: string | null;
  returnedAt: string | null;
  correctionDeadline: string | null;
  extension: Extension | null;
  isLateApproved: boolean;
}

export interface Extension {
  id: string;
  weekId: string;
  status: ExtensionStatus;
  reason: string;
  attachmentUrl: string | null;
  approvedUntil: string | null;
  coordinatorComment: string | null;
  requestedAt: string;
  decidedAt: string | null;
}

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  excusedReason: string | null;
}

export interface AttendanceSummary {
  presentCount: number;
  /** Days on which the coordinator generated at least one code. */
  totalCodedDays: number;
  records: AttendanceRecord[];
}

export interface SupervisorDetails {
  name: string;
  email: string;
  phone: string;
  organisation: string | null;
}

export interface SupervisorBatch {
  id: string;
  weekNumbers: number[];
  sentAt: string;
  status: SupervisorBatchStatus;
  supervisor: SupervisorDetails;
  reviewText: string | null;
  signature: string | null;
  /** Null until the first resend; used to enforce the 24 h resend throttle. */
  lastResendAt: string | null;
}

export interface WeekSummary {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  status: WeekStatus;
}

export interface StudentHomeData {
  /** null when cohort has not been configured yet. */
  currentWeek: Week | null;
  weekNumber: number | null;
  totalWeeks: number | null;
  dayNumber: number | null;
  totalDays: number | null;
  previousWeeks: WeekSummary[];
  supervisorBatches: SupervisorBatch[];
}
