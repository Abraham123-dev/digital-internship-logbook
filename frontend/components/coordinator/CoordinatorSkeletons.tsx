"use client";

/**
 * Coordinated Skeleton Loading components that mirror the exact card layouts,
 * padding, and grid structure of each coordinator page to eliminate layout shifts.
 */

/* ── Base Shimmer Block ───────────────────────────────────────────── */
export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[#E8E7E1]/80 rounded-xl ${className || "h-4 w-full"}`}
    />
  );
}

/* ── Dashboard Skeleton (4 Metrics + 12-Column Split) ─────────────── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Banner Skeleton */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E7E1] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="size-3 rounded-full" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-4 w-48" />
            <SkeletonBlock className="h-3 w-80" />
          </div>
        </div>
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E8E7E1] p-4 space-y-2.5">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-7 w-28" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* Lower 12-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8E7E1] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFE9]">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3.5 py-3 border-b border-[#F0EFE9] last:border-0">
              <SkeletonBlock className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="h-3.5 w-32" />
                <SkeletonBlock className="h-3 w-full" />
              </div>
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8E7E1] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFE9]">
            <SkeletonBlock className="h-4 w-32" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E7E1] space-y-2">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-3.5 w-full" />
              <SkeletonBlock className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Students Cards Grid Skeleton (Logbook covers) ────────────────── */
export function StudentsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search & Filter Header Skeleton */}
      <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <SkeletonBlock className="h-9 w-full sm:w-64 rounded-xl" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E8E7E1] p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="size-10 rounded-xl" />
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-28" />
                  <SkeletonBlock className="h-3 w-20" />
                </div>
              </div>
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>

            <div className="space-y-2 pt-2 border-t border-[#F0EFE9]">
              <div className="flex justify-between">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-3 w-10" />
              </div>
              <SkeletonBlock className="h-1.5 w-full rounded-full" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-7 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Submission Review Skeleton ───────────────────────────────────── */
export function SubmissionReviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Submission Header Card Skeleton */}
      <div className="bg-white rounded-2xl border border-[#E8E7E1] p-6 space-y-3">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-6 w-24 rounded-full" />
        </div>
        <SkeletonBlock className="h-7 w-60" />
        <SkeletonBlock className="h-3.5 w-96" />
      </div>

      {/* Week Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBlock key={i} className="h-12 w-28 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Active Day Content Skeleton */}
      <div className="bg-white rounded-2xl border border-[#E8E7E1] p-6 space-y-5">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-16 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-10 w-full rounded-xl" />
        </div>
        <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E7E1] space-y-3">
          <SkeletonBlock className="h-4 w-40" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} className="size-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Extension Requests Skeleton ──────────────────────────────────── */
export function ExtensionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E8E7E1] p-6 space-y-2">
        <SkeletonBlock className="h-6 w-48" />
        <SkeletonBlock className="h-3.5 w-80" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E8E7E1] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-44" />
              <SkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="h-3.5 w-3/4" />
            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0EFE9]">
              <SkeletonBlock className="h-8 w-24 rounded-full" />
              <SkeletonBlock className="h-8 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Attendance Session Skeleton ──────────────────────────────────── */
export function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E8E7E1] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-3.5 w-80" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-full" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 space-y-3">
        <SkeletonBlock className="h-4 w-32" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-[#F0EFE9] last:border-0">
            <div className="space-y-1">
              <SkeletonBlock className="h-3.5 w-36" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
