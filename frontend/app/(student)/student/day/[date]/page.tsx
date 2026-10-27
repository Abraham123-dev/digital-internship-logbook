"use client";

import { useState, useCallback, use, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Camera, Star, Lock, AlertCircle,
  CheckCircle2, Clock, ChevronLeft, ChevronRight
} from "lucide-react";
import { studentApi, type DayStatus } from "@/lib/api/student";

function formatFullDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-NG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Lagos",
    });
  } catch {
    return dateStr;
  }
}

function getAdjacentDate(dateStr: string, offsetDays: number): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return dateStr;
  }
}

type SaveState = "idle" | "saving" | "saved" | "error";

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const config: Record<SaveState, { text: string; cls: string; icon?: React.ReactNode }> = {
    idle: { text: "", cls: "" },
    saving: { text: "Saving…", cls: "text-[#9A9990]", icon: <Clock className="size-3" /> },
    saved: { text: "Saved", cls: "text-emerald-700 font-medium", icon: <CheckCircle2 className="size-3" /> },
    error: { text: "Failed to save", cls: "text-red-500 font-medium", icon: <AlertCircle className="size-3" /> },
  };
  const { text, cls, icon } = config[state];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${cls}`}>
      {icon}
      <span>{text}</span>
    </span>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  minChars,
  rows = 4,
  readOnly,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minChars?: number;
  rows?: number;
  readOnly?: boolean;
  hint?: string;
}) {
  const count = value.trim().length;
  const isSatisfied = !minChars || count >= minChars;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
          {label} {required && <span className="text-[#F04D23]">*</span>}
        </label>
        {minChars && !readOnly && (
          <span className={`text-[10px] font-mono ${isSatisfied ? "text-emerald-700" : "text-[#9A9990]"}`}>
            {count} / {minChars} chars min
          </span>
        )}
      </div>

      {readOnly ? (
        <div className="p-3.5 rounded-xl border border-[#E8E7E1] bg-[#FAF9F5] text-[12.5px] text-[#141414] leading-relaxed whitespace-pre-wrap">
          {value || <span className="text-[#9A9990] italic">No entry provided.</span>}
        </div>
      ) : (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3.5 rounded-xl border border-[#D8D7CE] bg-white text-[12.5px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/15 focus:border-[#F04D23]"
        />
      )}

      {hint && !readOnly && (
        <p className="text-[10px] text-[#9A9990]">{hint}</p>
      )}
    </div>
  );
}

export default function StudentDayPage({ params }: { params: Promise<{ date: string }> }) {
  const unwrappedParams = use(params);
  const rawDate = unwrappedParams.date;

  const [activities, setActivities] = useState("");
  const [skills, setSkills] = useState("");
  const [reflection, setReflection] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [status, setStatus] = useState<DayStatus>("draft");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadDay() {
      setLoading(true);
      const res = await studentApi.getDay(rawDate);
      if (res.ok && res.data) {
        setActivities(res.data.activities || "");
        setSkills(res.data.skills || "");
        setReflection(res.data.reflection || "");
        setStatus(res.data.status || "draft");
        setRating(res.data.rating);
        setComment(res.data.coordinatorComment);
        setPhotos(res.data.photos || []);
      }
      setLoading(false);
    }
    loadDay();
  }, [rawDate]);

  const persistData = useCallback(async (acts: string, skls: string, refl: string) => {
    setSaveState("saving");
    const res = await studentApi.saveDay(rawDate, {
      activities: acts,
      skills: skls,
      reflection: refl,
      isDraft: true,
    });
    if (res.ok) {
      setSaveState("saved");
    } else {
      setSaveState("error");
    }
  }, [rawDate]);

  function triggerAutoSave(newActs: string, newSkls: string, newRefl: string) {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSaveState("saving");
    debounceTimerRef.current = setTimeout(() => {
      persistData(newActs, newSkls, newRefl);
    }, 1000);
  }

  const isReadOnly = ["submitted", "reviewed"].includes(status);

  async function handlePhoto(file: File) {
    if (uploading || isReadOnly) return;
    setPhotoError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setPhotoError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Each photo must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setSaveState("saving");
      const saved = await studentApi.saveDay(rawDate, { activities, skills, reflection, isDraft: true });
      setSaveState(saved.ok ? "saved" : "error");
      if (!saved.ok) {
        setPhotoError(saved.message);
        return;
      }
      const res = await studentApi.uploadDayPhoto(rawDate, file);
      if (res.ok) setPhotos((current) => [...current, res.data.url]);
      else setPhotoError(res.message);
    } finally {
      setUploading(false);
    }
  }
  const prevDate = getAdjacentDate(rawDate, -1);
  const nextDate = getAdjacentDate(rawDate, 1);

  return (
    <div className="min-h-screen bg-[#F5F4EF] font-sans selection:bg-[#F04D23] selection:text-white text-[#141414] py-8 px-4 sm:px-6">
      <div className="max-w-[780px] mx-auto space-y-5">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7A7973] hover:text-[#141414] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <SaveIndicator state={saveState} />
            <Link
              href="/student"
              className="text-[11px] font-semibold text-[#141414] hover:underline"
            >
              Back to logbook &rarr;
            </Link>
          </div>
        </div>

        {/* Day Header Card */}
        <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7973]">
                Daily Activity Record
              </span>
            </div>
            <h1 className="text-[1.25rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mt-0.5">
              {formatFullDate(rawDate)}
            </h1>
            <p className="text-[11.5px] text-[#7A7973] mt-0.5">
              Record activities, technical skills, and reflections for coordinator assessment.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="size-3" />
              <span>{isReadOnly ? "Locked" : "Draft"}</span>
            </span>
            {rating != null && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Star className="size-3 fill-emerald-600 text-emerald-600" />
                <span>Score: {rating}/5</span>
              </span>
            )}
          </div>
        </div>

        {/* Coordinator Comment if evaluated */}
        {comment && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[#141414] space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-amber-900 font-semibold">
              Coordinator Assessment Note
            </p>
            <p className="text-[12px] text-amber-950 leading-relaxed">
              {comment}
            </p>
          </div>
        )}

        {/* Form Body */}
        {loading ? (
          <div className="p-12 text-center text-[12px] text-[#7A7973] bg-white rounded-2xl border border-[#E8E7E1]">
            Loading log entry…
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs space-y-6">
            
            <FormField
              id="activities"
              label="Daily Activities & Tasks"
              value={activities}
              onChange={(val) => {
                setActivities(val);
                triggerAutoSave(val, skills, reflection);
              }}
              placeholder="Describe what tasks you carried out today in clear, concise detail…"
              required
              minChars={30}
              rows={4}
              readOnly={isReadOnly}
              hint="Include specific modules, systems, and deliverables worked on."
            />

            <FormField
              id="skills"
              label="Tools, Technologies & Practical Skills"
              value={skills}
              onChange={(val) => {
                setSkills(val);
                triggerAutoSave(activities, val, reflection);
              }}
              placeholder="e.g. Docker, PostgreSQL, Django REST Framework, Git…"
              required
              rows={3}
              readOnly={isReadOnly}
              hint="List programming tools or engineering concepts practised."
            />

            {/* Photo Section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                Photos & Diagrams <span className="text-[#9A9990] font-normal">— Optional, up to 5</span>
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={isReadOnly || uploading || photos.length >= 5}
                  onClick={() => fileInputRef.current?.click()}
                  className="size-20 rounded-xl border border-dashed border-[#D8D7CE] hover:border-[#141414] text-[#7A7973] hover:text-[#141414] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="size-4" />
                  <span className="text-[10px] font-medium">{uploading ? "Uploading…" : "Add"}</span>
                </button>
                <p className="text-[11px] text-[#9A9990]">
                  Attach photos of equipment, circuits, or schematics from workshop sessions.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Upload logbook photo"
                className="hidden"
                disabled={isReadOnly || uploading || photos.length >= 5}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void handlePhoto(file);
                }}
              />
              <p className="text-[11px] text-[#9A9990]">PNG, JPEG, or WebP, up to 5 MB each. {photos.length}/5 photos.</p>
              {photoError && <p role="alert" className="text-[12px] text-red-600">{photoError}</p>}
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {photos.map((url, index) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      {/* Signed private URLs are provided directly by the backend. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Logbook photo ${index + 1}`} className="size-24 rounded-xl border border-[#E8E7E1] object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <FormField
              id="reflection"
              label="Learnings & Problem Solving"
              value={reflection}
              onChange={(val) => {
                setReflection(val);
                triggerAutoSave(activities, skills, val);
              }}
              placeholder="What challenges did you face, and what fixed them?"
              rows={3}
              readOnly={isReadOnly}
              hint="Reflection notes are factored into weekly assessment scores."
            />

            {/* Navigation & Action Footer */}
            <div className="pt-4 border-t border-[#F0EFE9] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href={`/student/day/${prevDate}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#D8D7CE] text-[11px] font-medium text-[#5A5954] hover:text-[#141414] hover:bg-white transition-colors"
                >
                  <ChevronLeft className="size-3.5" /> Previous day
                </Link>
                <Link
                  href={`/student/day/${nextDate}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#D8D7CE] text-[11px] font-medium text-[#5A5954] hover:text-[#141414] hover:bg-white transition-colors"
                >
                  Next day <ChevronRight className="size-3.5" />
                </Link>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => persistData(activities, skills, reflection)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors shadow-xs cursor-pointer"
                >
                  <Save className="size-3.5" />
                  <span>Save entry</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
