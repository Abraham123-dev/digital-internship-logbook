"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Star, Clock, CheckCircle2, RotateCcw,
  AlertCircle, Camera, Check, ChevronLeft, ChevronRight,
  X, Send, ShieldAlert, Award
} from "lucide-react";
import { CoordinatorShell } from "@/components/coordinator/CoordinatorShell";
import { SubmissionReviewSkeleton } from "@/components/coordinator/CoordinatorSkeletons";
import { coordinatorApi, type WeeklySubmissionDetail } from "@/lib/api/coordinator";

export default function CoordinatorReviewPage({
  params,
}: {
  params: Promise<{ weekId: string }>;
}) {
  const unwrappedParams = use(params);
  const weekId = unwrappedParams.weekId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<WeeklySubmissionDetail | null>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Ratings (day index -> 1..5)
  const [ratings, setRatings] = useState<Record<number, number>>({});
  // Day comments (day index -> string)
  const [comments, setComments] = useState<Record<number, string>>({});
  // Overall feedback comment
  const [overallFeedback, setOverallFeedback] = useState("");

  // Modals & submission state
  const [submitting, setSubmitting] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnDeadline, setReturnDeadline] = useState("Tuesday, 29 Oct at 11:59 PM");
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await coordinatorApi.getSubmissionDetail(weekId);
      if (mounted && res.ok) {
        setSubmission(res.data);
        // Pre-populate existing ratings if present
        const initRatings: Record<number, number> = {};
        const initComments: Record<number, string> = {};
        res.data.days.forEach((d, idx) => {
          if (d.rating) initRatings[idx] = d.rating;
          if (d.comment) initComments[idx] = d.comment;
        });
        setRatings(initRatings);
        setComments(initComments);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [weekId]);

  const currentDay = submission?.days[activeDayIdx];

  // Calculate live average score from rated days
  const ratedValues = Object.values(ratings);
  const liveAverage = ratedValues.length
    ? (ratedValues.reduce((a, b) => a + b, 0) / ratedValues.length).toFixed(1)
    : "—";

  const allDaysRated = submission?.days.length ? ratedValues.length === submission.days.length : false;

  async function handleApprove() {
    if (!submission) return;
    setSubmitting(true);
    const res = await coordinatorApi.submitReview(submission.id, "approve", {
      ratings,
      comments,
      overallComment: overallFeedback,
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccessBanner(`Week ${submission.weekNumber} approved with an average score of ${res.data.averageScore.toFixed(1)}/5.0.`);
    }
  }

  async function handleReturn() {
    if (!submission || !returnReason.trim()) return;
    setSubmitting(true);
    const res = await coordinatorApi.submitReview(submission.id, "return", {
      ratings,
      comments,
      overallComment: overallFeedback,
      returnReason,
      correctionDeadline: returnDeadline,
    });
    setSubmitting(false);
    setReturnModalOpen(false);
    if (res.ok) {
      setSuccessBanner(`Week ${submission.weekNumber} returned to ${submission.studentName} for corrections by ${returnDeadline}.`);
    }
  }

  return (
    <CoordinatorShell
      title="Weekly Submission Review"
      subtitle={submission ? `${submission.studentName} (${submission.matricNo}) · Week ${submission.weekNumber}` : "Loading submission…"}
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

          {submission && (
            <span className="text-[11px] font-mono text-[#7A7973]">
              Submission ID: <strong className="text-[#141414]">{submission.id}</strong>
            </span>
          )}
        </div>

        {/* Success Confirmation Banner */}
        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12.5px] font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <Link
              href="/coordinator"
              className="px-3.5 py-1.5 rounded-full bg-[#141414] text-white text-[11px] font-semibold hover:bg-[#282828] transition-colors shrink-0"
            >
              Return to overview
            </Link>
          </div>
        )}

        {loading || !submission ? (
          <SubmissionReviewSkeleton />
        ) : (
          <div className="space-y-6">
            
            {/* Header Submission Metadata Card */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7973]">
                    Week {submission.weekNumber} Logbook Review
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="size-2.5" /> Awaiting review
                  </span>
                </div>
                <h1 className="text-[1.25rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mt-0.5">
                  {submission.studentName}
                </h1>
                <p className="text-[11.5px] text-[#7A7973] mt-0.5">
                  {submission.matricNo} &middot; {submission.dates} &middot; Submitted {submission.submittedAt}
                </p>
              </div>

              {/* Running Score Metric */}
              <div className="flex items-center gap-3 bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E7E1]">
                <div className="text-right">
                  <p className="text-[9.5px] font-mono text-[#7A7973] uppercase">Average Score</p>
                  <p className="text-[1.4rem] font-extrabold tracking-tight text-[#141414] leading-none">
                    {liveAverage} <span className="text-[11px] text-[#7A7973] font-normal">/ 5.0</span>
                  </p>
                  <p className="text-[10px] text-[#7A7973] mt-0.5">
                    {ratedValues.length} of {submission.days.length} days rated
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Star className="size-5 fill-amber-500 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Weekday Stepper Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {submission.days.map((day, idx) => {
                const isRated = ratings[idx] != null;
                const active = activeDayIdx === idx;
                return (
                  <button
                    key={day.dayName}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-[12px] font-semibold transition-all shrink-0 cursor-pointer ${
                      active
                        ? "bg-[#141414] text-white border-[#141414] shadow-xs"
                        : "bg-white border-[#E8E7E1] text-[#5A5954] hover:border-[#D8D7CE] hover:text-[#141414]"
                    }`}
                  >
                    <span>{day.dayName}</span>
                    {isRated ? (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        active ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        <Star className="size-2.5 fill-current" /> {ratings[idx]}
                      </span>
                    ) : (
                      <span className={`size-1.5 rounded-full ${active ? "bg-[#F04D23]" : "bg-amber-400"}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current Day Inspection Form */}
            {currentDay && (
              <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs space-y-6">
                
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EFE9]">
                  <div>
                    <h2 className="text-[14px] font-bold text-[#141414]">
                      {currentDay.dayName} &middot; {currentDay.date}
                    </h2>
                    <p className="text-[11px] text-[#7A7973]">Submitted daily entry</p>
                  </div>
                  <span className="text-[10.5px] font-mono text-[#7A7973]">
                    Day {activeDayIdx + 1} of {submission.days.length}
                  </span>
                </div>

                {/* Section 1: Activities Done */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Tasks & Activities
                  </h3>
                  <div className="p-4 rounded-xl border border-[#E8E7E1] bg-[#FAF9F5] text-[12.5px] text-[#141414] leading-relaxed">
                    {currentDay.activities}
                  </div>
                </div>

                {/* Section 2: Skills Learned */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Tools & Skills
                  </h3>
                  <div className="p-3.5 rounded-xl border border-[#E8E7E1] bg-[#FAF9F5] text-[12px] text-[#141414] font-mono">
                    {currentDay.skills}
                  </div>
                </div>

                {/* Section 3: Reflection */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Student Reflection
                  </h3>
                  <div className="p-3.5 rounded-xl border border-[#E8E7E1] bg-[#FAF9F5] text-[12px] text-[#5A5954] italic leading-relaxed">
                    &ldquo;{currentDay.reflection}&rdquo;
                  </div>
                </div>

                {/* Grading Panel for this Day */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-[12px] font-bold text-[#141414]">Score for this day (1–5)</h4>
                    </div>

                    {/* 1 - 5 Rating Buttons */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((score) => {
                        const selected = ratings[activeDayIdx] === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setRatings({ ...ratings, [activeDayIdx]: score })}
                            className={`size-8 rounded-lg font-bold text-[12px] transition-all cursor-pointer flex items-center justify-center ${
                              selected
                                ? "bg-[#141414] text-white shadow-xs scale-105"
                                : "bg-white border border-[#D8D7CE] text-[#5A5954] hover:bg-amber-100 hover:text-[#141414]"
                            }`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day Comment Input */}
                  <div className="pt-2">
                    <input
                      type="text"
                      value={comments[activeDayIdx] || ""}
                      onChange={(e) => setComments({ ...comments, [activeDayIdx]: e.target.value })}
                      placeholder="Add a note for this day (optional)…"
                      className="w-full h-8.5 px-3 rounded-lg border border-amber-200 bg-white text-[12px] text-[#141414] placeholder:text-[#9A9990] outline-none focus:ring-1 focus:ring-[#141414]"
                    />
                  </div>
                </div>

                {/* Stepper Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F0EFE9]">
                  <button
                    disabled={activeDayIdx === 0}
                    onClick={() => setActiveDayIdx(activeDayIdx - 1)}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#5A5954] hover:text-[#141414] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="size-4" /> Previous day
                  </button>

                  <button
                    disabled={activeDayIdx === submission.days.length - 1}
                    onClick={() => setActiveDayIdx(activeDayIdx + 1)}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#5A5954] hover:text-[#141414] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Next day <ChevronRight className="size-4" />
                  </button>
                </div>

              </div>
            )}

            {/* Overall Review & Decision Section */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-[13px] font-bold text-[#141414]">Review Decision</h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                  Feedback for student (optional)
                </label>
                <textarea
                  rows={2}
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  placeholder="Feedback on overall weekly performance…"
                  className="w-full p-3.5 rounded-xl border border-[#D8D7CE] bg-white text-[12.5px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/15 focus:border-[#F04D23]"
                />
              </div>

              <div className="pt-3 border-t border-[#F0EFE9] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-[#7A7973]">
                  {allDaysRated
                    ? "All 5 days rated. Ready to approve."
                    : `Rate all 5 days before approving (${ratedValues.length}/5 completed).`}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-orange-300 text-orange-700 hover:bg-orange-50 text-[12px] font-semibold transition-colors cursor-pointer"
                  >
                    Return for corrections
                  </button>

                  <button
                    type="button"
                    disabled={!allDaysRated || submitting}
                    onClick={handleApprove}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    {submitting ? "Approving…" : "Approve week"}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Return Week Modal Dialog */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8E7E1] max-w-[440px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EFE9]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#F04D23]" />
                <h3 className="text-[13px] font-bold text-[#141414]">Return Week for Correction</h3>
              </div>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="p-1 text-[#7A7973] hover:text-[#141414] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-[12px] text-[#5A5954] leading-relaxed">
              This unlocks Week {submission?.weekNumber} for <strong className="text-[#141414]">{submission?.studentName}</strong> to revise and resubmit.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                Reason for return *
              </label>
              <textarea
                rows={3}
                required
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Explain what needs revision or additions…"
                className="w-full p-3 rounded-xl border border-[#D8D7CE] bg-white text-[12.5px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/15 focus:border-[#F04D23]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                Resubmission deadline
              </label>
              <input
                type="text"
                value={returnDeadline}
                onChange={(e) => setReturnDeadline(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#D8D7CE] bg-white text-[12px] text-[#141414] font-medium"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="flex-1 py-2 rounded-full border border-[#D8D7CE] text-[12px] font-semibold text-[#5A5954] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!returnReason.trim() || submitting}
                onClick={handleReturn}
                className="flex-1 py-2 rounded-full bg-orange-600 text-white text-[12px] font-semibold hover:bg-orange-700 transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
              >
                {submitting ? "Returning…" : "Return week"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CoordinatorShell>
  );
}
