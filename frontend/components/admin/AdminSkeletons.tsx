"use client";

import { SkeletonBlock } from "@/components/coordinator/CoordinatorSkeletons";

export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E8E7E1] p-4 space-y-2.5">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-7 w-20" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8E7E1] p-5 space-y-4">
          <SkeletonBlock className="h-4 w-40" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-[#F0EFE9] last:border-0">
              <SkeletonBlock className="h-3.5 w-44" />
              <SkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8E7E1] p-5 space-y-4">
          <SkeletonBlock className="h-4 w-36" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E7E1] space-y-2">
              <SkeletonBlock className="h-3.5 w-full" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Filter strip skeleton */}
      <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <SkeletonBlock className="h-9 w-60 rounded-xl" />
        <SkeletonBlock className="h-8 w-48 rounded-full" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-[#E8E7E1] overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-[#F0EFE9]">
          <SkeletonBlock className="h-4 w-32" />
        </div>
        <div className="divide-y divide-[#F0EFE9]">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <SkeletonBlock className="h-3.5 w-48" />
                <SkeletonBlock className="h-3 w-32" />
              </div>
              <SkeletonBlock className="h-5 w-20 rounded-full" />
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
