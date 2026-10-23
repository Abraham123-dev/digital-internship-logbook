/**
 * Shared auth brand panel — used across login, signup, admin-login, accept-invite.
 *
 * The compass arc coordinates are pre-computed at MODULE SCOPE (static constant)
 * so that SSR and the client always receive identical floating-point values,
 * eliminating the React hydration mismatch caused by Math.cos/sin precision
 * differences between runtimes.
 */

import Link from "next/link";
import { Lock } from "lucide-react";

/* ── Pre-computed arc lines (stable across SSR + client) ── */
const ARC_LINES = Array.from({ length: 42 }, (_, i) => {
  const angle = (i * 92) / 41;
  const rad   = (angle * Math.PI) / 180;
  const r1 = 28, r2 = 195;
  // Round to 4 dp — removes any runtime float-precision divergence.
  const round = (n: number) => Math.round(n * 1e4) / 1e4;
  return {
    key: i,
    x1: round(Math.cos(rad) * r1),
    y1: round(200 - Math.sin(rad) * r1),
    x2: round(Math.cos(rad) * r2),
    y2: round(200 - Math.sin(rad) * r2),
  };
});

/* ── Compass arc SVG ────────────────────────────────────── */
function CompassArc() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full" aria-hidden>
      {ARC_LINES.map((l) => (
        <line
          key={l.key}
          x1={l.x1} y1={l.y1}
          x2={l.x2} y2={l.y2}
          stroke="white" strokeWidth="1" strokeLinecap="round"
        />
      ))}
      <circle cx="0" cy="200" r="26" fill="#141414" stroke="white" strokeWidth="1" />
    </svg>
  );
}

/* ── Brand panel variants ────────────────────────────────── */

interface BrandPanelProps {
  /** Contextual copy shown under the headline. */
  variant: "login" | "signup" | "admin" | "invite";
  /** For the invite variant: renders a detail card on the left panel. */
  inviteDetail?: { email: string; department: string; programme: string } | null;
}

const COPY: Record<BrandPanelProps["variant"], {
  eyebrow: string;
  headline: React.ReactNode;
  body: string;
  bullets: string[];
  footer: React.ReactNode;
}> = {
  login: {
    eyebrow: "SWEP · SIWES",
    headline: <>Digital logbook<br />and assessment<br />system</>,
    body: "Students document practical training, submit records, and receive coordinator feedback — all in one place.",
    bullets: [
      "Daily logbook entries & auto-save",
      "Coordinator feedback & grading",
      "SWEP attendance · SIWES supervision",
    ],
    footer: "Obafemi Awolowo University · Faculty of Technology",
  },
  signup: {
    eyebrow: "Student Registration",
    headline: <>Start your<br />training record<br />today</>,
    body: "Register once. Document your daily work throughout SWEP or SIWES and receive structured feedback from your department.",
    bullets: [
      "SWEP — On-campus workshop training",
      "SIWES — Industrial placement scheme",
      "Coordinator-verified logbook records",
    ],
    footer: "Obafemi Awolowo University · Faculty of Technology",
  },
  admin: {
    eyebrow: "System Administration",
    headline: <>Institutional<br />governance<br />console</>,
    body: "Manage accounts, invite coordinators, configure programmes, and oversee all platform audit records.",
    bullets: [
      "Invite & manage coordinator accounts",
      "Configure cohorts & programmes",
      "Platform-wide audit trail",
    ],
    footer: (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-white/25">
        <Lock className="size-3" />
        All admin actions are cryptographically logged.
      </span>
    ),
  },
  invite: {
    eyebrow: "Coordinator Onboarding",
    headline: <>Welcome to<br />your department&apos;s<br />logbook portal</>,
    body: "Review student submissions, generate attendance codes, and provide structured feedback and grades.",
    bullets: [
      "Review and approve student submissions",
      "Generate daily SWEP attendance codes",
      "Provide structured feedback and grades",
    ],
    footer: "Obafemi Awolowo University · Faculty of Technology",
  },
};

export function AuthBrandPanel({ variant, inviteDetail }: BrandPanelProps) {
  const c = COPY[variant];
  return (
    <div className="hidden lg:flex flex-col justify-between bg-[#141414] text-white p-7 xl:p-9 relative overflow-hidden">
      {/* Compass arc decoration */}
      <div className="pointer-events-none select-none absolute right-0 bottom-0 w-[300px] h-[300px] opacity-[0.06]">
        <CompassArc />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group relative z-10">
        <span className="size-2 rounded-full bg-[#F04D23] group-hover:scale-125 transition-transform" />
        <span className="text-[15px] font-extrabold tracking-[-0.03em]">Logr</span>
        <span className="text-[10.5px] text-white/40 font-normal ml-0.5">/ OAU</span>
      </Link>

      {/* Content */}
      <div className="relative z-10 my-auto py-6">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="size-1.5 rounded-full border-[1.5px] border-[#F04D23]" />
          <span className="text-[10px] font-mono font-medium tracking-wider text-white/50 uppercase">
            {c.eyebrow}
          </span>
        </div>

        <h2 className="text-[1.25rem] xl:text-[1.4rem] font-bold tracking-[-0.03em] leading-[1.2] text-white mb-3">
          {c.headline}
        </h2>
        <p className="text-[12px] text-white/50 leading-relaxed max-w-[250px]">
          {c.body}
        </p>

        {/* Invite detail card */}
        {variant === "invite" && inviteDetail && (
          <div className="mt-5 p-3 rounded-xl border border-white/10 bg-white/5 space-y-1">
            <p className="text-[9.5px] font-mono text-white/40 uppercase tracking-wider">Invitation details</p>
            <p className="text-[12px] text-white font-semibold">{inviteDetail.email}</p>
            <p className="text-[10.5px] text-white/50">{inviteDetail.department} · {inviteDetail.programme}</p>
          </div>
        )}

        <div className="mt-6 space-y-2.5">
          {c.bullets.map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-[11.5px] text-white/60">
              <span className="size-1.5 rounded-full bg-[#F04D23] shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-[9.5px] font-mono text-white/25">
        {c.footer}
      </div>
    </div>
  );
}

/* ── Mobile logo bar (shown instead of brand panel) ──────── */
export function MobileAuthBar({ badge }: { badge?: React.ReactNode } = {}) {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#D8D7CE] bg-[#EDECE6]/90 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-[#F04D23]" />
        <span className="text-[15px] font-extrabold tracking-[-0.03em] text-[#141414]">Logr</span>
        <span className="text-[10.5px] text-[#7A7973] font-normal ml-0.5">/ OAU</span>
      </Link>
      {badge}
    </div>
  );
}
