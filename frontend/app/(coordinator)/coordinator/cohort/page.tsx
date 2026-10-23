"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Settings, Clock, CheckCircle2,
  AlertCircle, Save, Plus, X
} from "lucide-react";
import { CoordinatorShell } from "@/components/coordinator/CoordinatorShell";
import { SkeletonBlock } from "@/components/coordinator/CoordinatorSkeletons";
import { coordinatorApi, type CohortSettings } from "@/lib/api/coordinator";

export default function CoordinatorCohortPage() {
  const [loading, setLoading] = useState(true);
  const [cohort, setCohort] = useState<CohortSettings | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await coordinatorApi.getCohortSettings();
      if (mounted && res.ok) {
        setCohort(res.data);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  }

  const inputCls = "w-full h-9.5 px-3 rounded-xl border border-[#D8D7CE] bg-white text-[12.5px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/15 focus:border-[#F04D23]";

  return (
    <CoordinatorShell
      title="Cohort Settings"
      subtitle="Programme dates, submission deadlines, and university holidays"
    >
      <div className="space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7A7973] hover:text-[#141414] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Overview</span>
          </Link>
        </div>

        {savedBanner && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-semibold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Cohort settings saved.</span>
          </div>
        )}

        {loading || !cohort ? (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-6 space-y-4">
              <SkeletonBlock className="h-6 w-48" />
              <div className="grid grid-cols-2 gap-4">
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-10 w-full" />
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* General Cohort Details */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#F0EFE9]">
                <Settings className="size-4 text-[#141414]" />
                <h2 className="text-[13px] font-bold text-[#141414]">Programme & Dates</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Internship Programme
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${cohort.programme} (Department assigned)`}
                    className="w-full h-9.5 px-3 rounded-xl border border-[#E8E7E1] bg-[#FAF9F5] text-[12px] text-[#7A7973] font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Academic Session
                  </label>
                  <input
                    type="text"
                    value={cohort.academicYear}
                    onChange={(e) => setCohort({ ...cohort, academicYear: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Cohort Start Date
                  </label>
                  <input
                    type="date"
                    value={cohort.startDate}
                    onChange={(e) => setCohort({ ...cohort, startDate: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Cohort End Date
                  </label>
                  <input
                    type="date"
                    value={cohort.endDate}
                    onChange={(e) => setCohort({ ...cohort, endDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Submission Deadlines & Extension Rules */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#F0EFE9]">
                <Clock className="size-4 text-[#141414]" />
                <h2 className="text-[13px] font-bold text-[#141414]">Submission Deadlines</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Weekly Submission Day
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Saturday"
                    className="w-full h-9.5 px-3 rounded-xl border border-[#E8E7E1] bg-[#FAF9F5] text-[12px] text-[#7A7973]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Weekly Cutoff Time
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="23:59 (11:59 PM)"
                    className="w-full h-9.5 px-3 rounded-xl border border-[#E8E7E1] bg-[#FAF9F5] text-[12px] text-[#7A7973]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Maximum Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={cohort.maxGraceDays}
                    onChange={(e) => setCohort({ ...cohort, maxGraceDays: parseInt(e.target.value, 10) })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Calendar Holidays */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EFE9]">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[#141414]" />
                  <h2 className="text-[13px] font-bold text-[#141414]">Public & University Holidays</h2>
                </div>
                <span className="text-[10.5px] text-[#7A7973]">Days exempt from logbook entry requirements</span>
              </div>

              <div className="space-y-2">
                {cohort.holidays.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#E8E7E1] bg-[#FAF9F5] text-[12px]"
                  >
                    <div>
                      <span className="font-semibold text-[#141414]">{h.label}</span>
                      <span className="text-[#7A7973] font-mono ml-2">&middot; {h.date}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-white border border-[#D8D7CE] px-2 py-0.5 rounded text-[#7A7973]">
                      Holiday
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors shadow-xs cursor-pointer"
              >
                <Save className="size-3.5" />
                <span>Save Settings</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </CoordinatorShell>
  );
}
