"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";

/* ── data ───────────────────────────────────────────── */

const workflowPhases = [
  {
    num: "01",
    title: "Document Work",
    summary: "Students write daily entries throughout their training period.",
    detail:
      "Each entry captures what the student did that day — tasks completed, skills practised, observations made, and any problems encountered. Entries autosave continuously so nothing is lost. For SWEP students, daily attendance is verified here too using a short-lived coordinator-generated code.",
  },
  {
    num: "02",
    title: "Submit Work",
    summary: "Logbook records are submitted on a configured schedule.",
    detail:
      "Coordinators define submission windows for each cohort. Students submit their accumulated entries within that window. For SIWES students, the submission is also forwarded to their industrial supervisor via a secure email link — no account required on the supervisor's end.",
  },
  {
    num: "03",
    title: "Review & Feedback",
    summary: "Coordinators read submissions and respond with structured feedback.",
    detail:
      "Coordinators can approve a submission, leave written comments, or return it for correction. Students receive feedback in their dashboard and can revise and resubmit. SIWES submissions also carry the supervisor's sign-off, which coordinators can see before assessing.",
  },
  {
    num: "04",
    title: "Assess Students",
    summary: "The department assigns formal grades and closes the record.",
    detail:
      "After reviewing all submissions and feedback cycles, the coordinator assigns a final grade. Logr maintains a structured record of each student's assessment for Senate-approved reporting. Grading authority stays entirely with the department — supervisors cannot grade.",
  },
];

const userRoles = [
  {
    role: "Student",
    tag: "SWEP / SIWES Trainee",
    desc: "Records daily work, submits logbook entries on the programme schedule, tracks coordinator feedback, and makes corrections. Marks SWEP attendance or requests SIWES supervisor sign-off.",
    link: "/signup",
    linkText: "Register",
  },
  {
    role: "Departmental Coordinator",
    tag: "Faculty Reviewer",
    desc: "Manages student cohorts, generates SWEP daily attendance codes, reviews submissions, provides written feedback, handles extension requests, and assigns final grades.",
    link: "/login",
    linkText: "Sign in",
  },
  {
    role: "Administrator",
    tag: "Institutional Governance",
    desc: "Manages all accounts, invites coordinators, configures programmes and cohorts, assigns departmental responsibilities, and oversees platform audit records.",
    link: "/admin/login",
    linkText: "Admin access",
  },
  {
    role: "External Supervisor",
    tag: "SIWES Workplace Employer",
    desc: "Receives a secure link by email, reads the student's submitted records, provides feedback, and signs off — no account or software installation required.",
    link: "/login",
    linkText: "Supervisor link",
  },
];

const navLinks = [
  { label: "How it works", href: "#workflow" },
  { label: "Programmes", href: "#programmes" },
  { label: "Roles", href: "#roles" },
];

const ARC_LINES = Array.from({ length: 42 }, (_, i) => {
  const angle = (i * 92) / 41;
  const rad = (angle * Math.PI) / 180;
  const r1 = 28, r2 = 195;
  const round = (n: number) => Math.round(n * 1e4) / 1e4;
  return {
    key: i,
    x1: round(Math.cos(rad) * r1),
    y1: round(200 - Math.sin(rad) * r1),
    x2: round(Math.cos(rad) * r2),
    y2: round(200 - Math.sin(rad) * r2),
  };
});

function CompassArc({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {ARC_LINES.map((l) => (
        <line
          key={l.key}
          x1={l.x1} y1={l.y1}
          x2={l.x2} y2={l.y2}
          stroke="#141414" strokeWidth="1" strokeLinecap="round"
        />
      ))}
      <circle cx="0" cy="200" r="26" fill="#EDECE6" stroke="#141414" strokeWidth="1" />
    </svg>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#EDECE6] text-[#141414] font-sans selection:bg-[#F04D23] selection:text-white">

      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-[#D8D7CE] bg-[#EDECE6]/95 backdrop-blur-sm">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="size-2 rounded-full bg-[#F04D23]" />
            <span className="text-[17px] font-extrabold tracking-[-0.03em]">Logr</span>
            <span className="text-[11px] text-[#7A7973] font-normal hidden sm:inline ml-0.5">/ OAU</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-[#5A5954] font-medium">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-[#141414] transition-colors">{l.label}</a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-[13px] font-medium text-[#141414] hover:underline">Sign in</Link>
            <Link href="/signup" className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-full bg-[#141414] text-white hover:bg-[#282828] transition-colors">
              Register
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {/* Mobile: sign in + 2-line icon */}
          <div className="flex md:hidden items-center gap-4">
            <Link href="/login" className="text-[12px] font-medium text-[#141414]">Sign in</Link>
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="flex flex-col justify-center items-end gap-[5px]">
              <span className="block h-[1.5px] w-5 bg-[#141414] rounded-full" />
              <span className="block h-[1.5px] w-3.5 bg-[#141414] rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER BACKDROP ── */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* ── MOBILE DRAWER PANEL ── */}
      <div className={`fixed top-0 right-0 bottom-0 z-50 w-[300px] bg-[#EDECE6] border-l border-[#D8D7CE] flex flex-col transition-transform duration-300 ease-out md:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>

        <div className="h-16 flex items-center justify-between px-6 border-b border-[#D8D7CE]">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#F04D23]" />
            <span className="text-[15px] font-extrabold tracking-[-0.03em]">Logr</span>
          </div>
          <button onClick={() => setMenuOpen(false)} className="size-8 flex items-center justify-center text-[#5A5954] hover:text-[#141414]">
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-col px-6 py-8 gap-1 flex-1">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="text-[15px] font-semibold text-[#141414] py-3.5 border-b border-[#E8E7E1] hover:opacity-60 transition-opacity">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="px-6 pb-10 flex flex-col gap-3">
          <Link href="/signup" onClick={() => setMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#141414] text-white text-[13px] font-semibold">
            Register as Student
            <ArrowUpRight className="size-3.5" />
          </Link>
          <Link href="/login" onClick={() => setMenuOpen(false)}
            className="w-full flex items-center justify-center py-3 rounded-full border border-[#D0CFCE] text-[#141414] text-[13px] font-semibold">
            Sign in to Portal
          </Link>
        </div>
      </div>

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden border-b border-[#D8D7CE]">
          <div className="pointer-events-none select-none absolute right-0 bottom-0 w-[280px] sm:w-[420px] lg:w-[520px] h-[280px] sm:h-[420px] lg:h-[520px] opacity-[0.13] translate-x-1/3 translate-y-1/3">
            <CompassArc className="w-full h-full" />
          </div>

          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 pt-12 sm:pt-20 pb-14 sm:pb-24 relative">

            <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-medium text-[#141414] mb-7 sm:mb-10">
              <span className="size-1.5 rounded-full border-[1.5px] border-[#F04D23] shrink-0" />
              <span>Obafemi Awolowo University &nbsp;&middot;&nbsp; SWEP &amp; SIWES</span>
            </div>

            <h1 className="text-[1.85rem] sm:text-[2.8rem] lg:text-[3.8rem] xl:text-[4.5rem] font-extrabold tracking-[-0.035em] leading-[1.06] text-[#141414] max-w-3xl mb-5 sm:mb-7">
              Digital logbook and assessment system
            </h1>

            <p className="text-[13px] sm:text-[15px] lg:text-[16px] text-[#5A5954] leading-relaxed max-w-lg mb-8 sm:mb-10">
              Students document practical training, submit records, and receive coordinator feedback.
              Departments review, correct, and assess — all in one place.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-full bg-[#141414] text-white text-[12px] sm:text-[13px] font-semibold hover:bg-[#282828] transition-colors">
                Register as Student
                <ArrowUpRight className="size-3.5" />
              </Link>
              <Link href="/login"
                className="inline-flex items-center gap-2 text-[12px] sm:text-[13px] font-semibold text-[#141414] hover:opacity-70 transition-opacity">
                Sign in to Portal
                <span className="size-6 rounded-full border border-[#141414] flex items-center justify-center">
                  <ArrowRight className="size-3" />
                </span>
              </Link>
            </div>

            <div className="mt-10 sm:mt-16 pt-5 border-t border-[#D0CFCE] flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono text-[#7A7973]">
              <span>SWEP · On-Campus Training</span>
              <span className="hidden sm:inline text-[#D0CFCE]">|</span>
              <span>SIWES · Industrial Placement</span>
              <span className="hidden sm:inline text-[#D0CFCE]">|</span>
              <a href="#workflow" className="text-[#141414] font-semibold hover:underline underline-offset-4 flex items-center gap-1">
                See how it works <ArrowRight className="size-3" />
              </a>
            </div>
          </div>
        </section>


        {/* ── WORKFLOW ── */}
        <section id="workflow" className="py-16 sm:py-24 border-b border-[#D8D7CE]">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">

            <div className="flex items-center gap-2 text-[12px] font-medium text-[#141414] mb-3">
              <span className="size-1.5 rounded-full border-[1.5px] border-[#F04D23]" />
              <span>How it works</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-[#141414] mb-2">
              Four stages, one continuous record
            </h2>
            <p className="text-[13px] text-[#5A5954] mb-12 sm:mb-16 max-w-lg leading-relaxed">
              Every activity in Logr maps to this progression — from the first daily entry to the final departmental grade.
            </p>

            {/* Timeline */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 relative">
              <div className="hidden lg:block absolute top-[22px] left-0 right-0 border-t border-[#C8C7BE] pointer-events-none" />

              {workflowPhases.map((phase, i) => (
                <div key={phase.num}
                  className={`pr-0 lg:pr-8 pb-10 sm:pb-0 ${i > 0 ? "pt-10 sm:pt-0 border-t sm:border-t-0 border-[#D8D7CE] sm:border-l sm:pl-8 lg:border-l-0 lg:pl-0" : ""}`}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="size-11 rounded-full bg-[#EDECE6] border border-[#C8C7BE] text-[13px] font-bold text-[#141414] flex items-center justify-center shrink-0 relative z-10">
                      {phase.num}
                    </span>
                  </div>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-[#141414] mb-2">{phase.title}</h3>
                  <p className="text-[12px] sm:text-[13px] font-semibold text-[#3A3934] leading-relaxed mb-3">{phase.summary}</p>
                  <p className="text-[12px] sm:text-[13px] text-[#7A7973] leading-relaxed">{phase.detail}</p>
                </div>
              ))}
            </div>

          </div>
        </section>


        {/* ── PROGRAMMES ── */}
        <section id="programmes" className="border-b border-[#D8D7CE]">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-[1fr_1px_1fr]">

              {/* SWEP */}
              <div className="py-14 sm:py-16 lg:pr-16">
                <div className="flex items-center gap-2 mb-7">
                  <span className="size-1.5 rounded-full border-[1.5px] border-[#F04D23]" />
                  <span className="font-mono font-bold text-[#F04D23] tracking-wider uppercase text-[11px]">SWEP</span>
                </div>
                <h2 className="text-xl sm:text-[22px] font-extrabold tracking-[-0.03em] text-[#141414] leading-tight mb-3">
                  Student Work Experience Programme
                </h2>
                <p className="text-[13px] text-[#5A5954] leading-relaxed mb-8 max-w-md">
                  On-campus, school-organised practical training for 200-level students. Students log daily work; coordinators verify physical attendance using a short-lived 6-character code generated each day.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "Daily attendance verified by coordinator-generated codes",
                    "Logbook records submitted on configured programme cycles",
                    "Coordinator reviews, provides feedback, and assigns grades",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-[12px] sm:text-[13px] text-[#3A3934]">
                      <span className="mt-[5px] size-1.5 rounded-full bg-[#F04D23] shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors">
                  Register for SWEP
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              <div className="hidden lg:block bg-[#D8D7CE]" />

              {/* SIWES */}
              <div className="py-14 sm:py-16 lg:pl-16 border-t lg:border-t-0 border-[#D8D7CE]">
                <div className="flex items-center gap-2 mb-7">
                  <span className="size-1.5 rounded-full border-[1.5px] border-[#141414]" />
                  <span className="font-mono font-bold text-[#141414] tracking-wider uppercase text-[11px]">SIWES</span>
                </div>
                <h2 className="text-xl sm:text-[22px] font-extrabold tracking-[-0.03em] text-[#141414] leading-tight mb-3">
                  Students Industrial Work Experience Scheme
                </h2>
                <p className="text-[13px] text-[#5A5954] leading-relaxed mb-8 max-w-md">
                  External industrial placement at a real company, typically for 300 or 400-level students. Students document their work on-site; their industrial supervisor can review and sign off without creating an account.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "Student sends records to their workplace supervisor via a secure email link",
                    "Supervisor reviews and signs off — no account or software required",
                    "Formal grading remains the sole authority of the academic department",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-[12px] sm:text-[13px] text-[#3A3934]">
                      <span className="mt-[5px] size-1.5 rounded-full bg-[#141414] shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#141414] text-[#141414] text-[12px] font-semibold hover:bg-[#141414] hover:text-white transition-colors">
                  Register for SIWES
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

            </div>
          </div>
        </section>


        {/* ── ROLES ── */}
        <section id="roles" className="py-16 sm:py-24">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">

            <div className="flex items-center gap-2 text-[12px] font-medium text-[#141414] mb-10 sm:mb-12">
              <span className="size-1.5 rounded-full border-[1.5px] border-[#F04D23]" />
              <span>Who uses Logr</span>
            </div>

            <div className="divide-y divide-[#D8D7CE]">
              {userRoles.map((role) => (
                <div key={role.role}
                  className="flex flex-col sm:grid sm:grid-cols-[180px_1fr_auto] gap-1.5 sm:gap-10 lg:gap-16 items-start sm:items-baseline py-5 sm:py-7">
                  <div>
                    <p className="text-[14px] font-bold text-[#141414]">{role.role}</p>
                    <p className="text-[10px] font-mono text-[#7A7973] mt-0.5 uppercase tracking-wider">{role.tag}</p>
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-[#5A5954] leading-relaxed">{role.desc}</p>
                  <Link href={role.link}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#141414] hover:opacity-70 transition-opacity whitespace-nowrap mt-2 sm:mt-0">
                    {role.linkText}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </section>

      </main>


      {/* ── FOOTER ── */}
      <footer className="bg-[#141414] text-white">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-12">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="size-2 rounded-full bg-[#F04D23]" />
                <span className="text-[17px] font-extrabold tracking-[-0.03em]">Logr</span>
              </div>
              <p className="text-[11px] text-white/40 font-mono">Digital Internship Logbook &amp; Assessment System · OAU</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-white/60 font-medium">
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Register</Link>
              <Link href="/admin/login" className="hover:text-white transition-colors">Admin</Link>
              <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
              <a href="#programmes" className="hover:text-white transition-colors">Programmes</a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] sm:text-[11px] text-white/30 font-mono">
            <span>Obafemi Awolowo University · Technology &amp; Computing Faculties</span>
            <span>SWEP &amp; SIWES · {new Date().getFullYear()}</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
