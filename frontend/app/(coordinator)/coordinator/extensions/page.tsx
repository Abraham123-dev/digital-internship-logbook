"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, Check, X, Calendar, ChevronRight
} from "lucide-react";
import { CoordinatorShell } from "@/components/coordinator/CoordinatorShell";
import { ExtensionsSkeleton } from "@/components/coordinator/CoordinatorSkeletons";
import { coordinatorApi, type ExtensionRequestItem } from "@/lib/api/coordinator";

export default function CoordinatorExtensionsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ExtensionRequestItem[]>([]);
  const [activeModal, setActiveModal] = useState<{
    item: ExtensionRequestItem;
    type: "approve" | "deny";
  } | null>(null);

  const [graceDays, setGraceDays] = useState(3);
  const [denyComment, setDenyComment] = useState("");
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await coordinatorApi.getExtensionRequests();
      if (mounted && res.ok) {
        setRequests(res.data);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleConfirmDecision() {
    if (!activeModal) return;
    setProcessing(true);
    const { item, type } = activeModal;
    const res = await coordinatorApi.decideExtension(item.id, type, {
      graceDays: type === "approve" ? graceDays : undefined,
      comment: type === "deny" ? denyComment : undefined,
    });
    setProcessing(false);
    setActiveModal(null);

    if (res.ok) {
      setActionDone(
        type === "approve"
          ? `Approved ${graceDays}-day extension for ${item.studentName} (Week ${item.weekNumber}).`
          : `Denied extension request for ${item.studentName}.`
      );
      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? {
                ...r,
                status: type === "approve" ? "approved" : "denied",
                coordinatorComment: type === "deny" ? denyComment : undefined,
              }
            : r
        )
      );
    }
  }

  return (
    <CoordinatorShell
      title="Extension Requests"
      subtitle="Review student requests for late weekly logbook submissions"
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

        {actionDone && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{actionDone}</span>
            </div>
            <button
              onClick={() => setActionDone(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {loading ? (
          <ExtensionsSkeleton />
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E7E1] p-12 text-center space-y-2">
            <Clock className="size-8 text-[#9A9990] mx-auto" />
            <h3 className="text-[14px] font-bold text-[#141414]">No extension requests</h3>
            <p className="text-[12px] text-[#7A7973]">
              There are currently no pending extension requests.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0EFE9]">
                  <div className="flex items-center gap-2.5">
                    <span className="size-8 rounded-lg bg-[#F5F4EF] text-[#141414] text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                      W{req.weekNumber}
                    </span>
                    <div>
                      <h3 className="text-[13px] font-bold text-[#141414]">{req.studentName}</h3>
                      <p className="text-[10.5px] text-[#7A7973] font-mono">
                        {req.matricNo} &middot; Week {req.weekNumber} &middot; Due {req.deadlineDate}
                      </p>
                    </div>
                  </div>

                  <div>
                    {req.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="size-2.5" /> Pending
                      </span>
                    ) : req.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="size-2.5" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                        <XCircle className="size-2.5" /> Denied
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason Body */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono uppercase text-[#7A7973]">Student reason</p>
                  <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E7E1] text-[12.5px] text-[#3A3934] leading-relaxed">
                    &ldquo;{req.reason}&rdquo;
                  </div>
                </div>

                {req.attachmentUrl && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <FileText className="size-3.5 text-[#F04D23]" />
                    <span className="text-[#5A5954]">Supporting document:</span>
                    <a
                      href={req.attachmentUrl}
                      className="font-semibold text-[#141414] hover:underline"
                    >
                      View document &rarr;
                    </a>
                  </div>
                )}

                {req.coordinatorComment && (
                  <div className="p-3 rounded-xl bg-red-50/60 border border-red-200 text-[11.5px] text-red-800">
                    <strong>Reason for denial:</strong> {req.coordinatorComment}
                  </div>
                )}

                {/* Decision Actions for Pending Requests */}
                {req.status === "pending" && (
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0EFE9]">
                    <button
                      onClick={() => setActiveModal({ item: req, type: "deny" })}
                      className="px-3.5 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Deny
                    </button>
                    <button
                      onClick={() => setActiveModal({ item: req, type: "approve" })}
                      className="px-4 py-1.5 rounded-full bg-[#141414] text-white text-[11px] font-semibold hover:bg-[#282828] transition-colors shadow-xs cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Decision Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8E7E1] max-w-[420px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EFE9]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#F04D23]" />
                <h3 className="text-[13px] font-bold text-[#141414]">
                  {activeModal.type === "approve" ? "Approve Extension" : "Deny Extension"}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-[#7A7973] hover:text-[#141414] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-[12px] text-[#5A5954]">
              Student: <strong className="text-[#141414]">{activeModal.item.studentName}</strong> (Week {activeModal.item.weekNumber})
            </p>

            {activeModal.type === "approve" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Grace period (days)
                  </label>
                  <select
                    value={graceDays}
                    onChange={(e) => setGraceDays(parseInt(e.target.value, 10))}
                    className="w-full h-9 px-3 rounded-xl border border-[#D8D7CE] bg-white text-[12.5px] text-[#141414] font-medium outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 7].map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? "day" : "days"} extension
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-[#7A7973]">
                  The student will be able to edit and submit Week {activeModal.item.weekNumber} until the new deadline.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                  Reason for denial *
                </label>
                <textarea
                  rows={3}
                  required
                  value={denyComment}
                  onChange={(e) => setDenyComment(e.target.value)}
                  placeholder="Explain why this extension is denied…"
                  className="w-full p-3 rounded-xl border border-[#D8D7CE] bg-white text-[12px] text-[#141414] outline-none"
                />
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 rounded-full border border-[#D8D7CE] text-[12px] font-semibold text-[#5A5954] hover:bg-[#FAF9F5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing || (activeModal.type === "deny" && !denyComment.trim())}
                onClick={handleConfirmDecision}
                className={`flex-1 py-2 rounded-full text-white text-[12px] font-semibold shadow-xs disabled:opacity-40 cursor-pointer ${
                  activeModal.type === "approve"
                    ? "bg-[#141414] hover:bg-[#282828]"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing ? "Saving…" : activeModal.type === "approve" ? "Approve" : "Deny"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CoordinatorShell>
  );
}
