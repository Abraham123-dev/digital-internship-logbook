// Status label mappings — PRD §5 vocabulary.
// Single source of truth: import these everywhere, never hardcode status strings.

import type {
  DayPageStatus,
  WeekStatus,
  ExtensionStatus,
  AttendanceStatus,
  SupervisorBatchStatus,
} from "@/types/logbook";
import type { AccountStatus } from "@/types/auth";

// ── Day page labels ──────────────────────────────────────────────────────────
export const DAY_PAGE_LABELS: Record<DayPageStatus, string> = {
  not_filled: "Not filled yet",
  draft: "Draft",
  submitted: "Submitted",
  reviewed: "Reviewed",
  returned: "Returned",
  future: "Opens later",
};

// ── Week labels ──────────────────────────────────────────────────────────────
export const WEEK_LABELS: Record<WeekStatus, string> = {
  in_progress: "In progress",
  submitted: "Submitted",
  reviewed: "Reviewed",
  returned: "Returned",
  overdue: "Overdue",
  missed: "Missed week",
};

// ── Extension labels ─────────────────────────────────────────────────────────
export const EXTENSION_LABELS: Record<ExtensionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
  expired: "Expired",
};

// ── Attendance labels ─────────────────────────────────────────────────────────
export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  excused: "Excused",
};

// ── Supervisor batch labels ──────────────────────────────────────────────────
export const SUPERVISOR_BATCH_LABELS: Record<SupervisorBatchStatus, string> = {
  not_sent: "Not sent",
  awaiting_supervisor: "Awaiting supervisor",
  reviewed: "Reviewed",
  link_expired: "Link expired",
};

// ── Account status labels ────────────────────────────────────────────────────
export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  deactivated: "Deactivated",
  withdrawn: "Withdrawn",
  rusticated: "Rusticated",
};

// ── Aria labels for screen readers (status is never communicated by colour alone) ──
// Use these as aria-label or sr-only text alongside colour-based status chips.
export function getWeekStatusAriaLabel(status: WeekStatus): string {
  return `Week status: ${WEEK_LABELS[status]}`;
}

export function getDayPageStatusAriaLabel(status: DayPageStatus): string {
  return `Day status: ${DAY_PAGE_LABELS[status]}`;
}
