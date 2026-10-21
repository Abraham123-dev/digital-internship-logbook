import Link from "next/link";
import { BookOpen, CheckCircle2, ShieldCheck, Clock, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold tracking-tight text-lg shadow-sm">
              L
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight">Logr</span>
              <span className="ml-2 hidden sm:inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border">
                Faculty of Engineering
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-md hover:bg-muted transition-colors text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="relative overflow-hidden py-20 lg:py-28 border-b border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Official Portal for SWEP & SIWES
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto text-balance">
              The modern digital logbook for engineering interns.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
              Replace outdated paper logbooks with daily digital tracking, automated submission deadlines, verifiable attendance, and coordinator feedback.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-base hover:bg-primary/90 transition-all shadow-sm group"
              >
                Register as Student
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background hover:bg-muted font-medium text-base transition-colors"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </section>

        {/* Roles & Programmes Overview */}
        <section className="py-16 bg-muted/30 border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Built for your training workflow</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Tailored journeys designed specifically for university coordinators and engineering students.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* SWEP Card */}
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-sm hover:border-foreground/20 transition-all">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  SW
                </div>
                <div>
                  <h3 className="text-xl font-bold">SWEP — Student Work Experience</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    On-campus workshop practice with daily classroom attendance validation.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Daily activity logging with autosave</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Instant attendance via coordinator-generated session codes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Weekly Saturday 23:59 strict submission window</span>
                  </li>
                </ul>
              </div>

              {/* SIWES Card */}
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-sm hover:border-foreground/20 transition-all">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  SI
                </div>
                <div>
                  <h3 className="text-xl font-bold">SIWES — Industrial Work Scheme</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Off-campus industry internship with remote external supervisor verification.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Direct submission batches to industry supervisors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>One-click magic review links (no supervisor login required)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Digital coordinator grading and correction reviews</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <BookOpen className="size-5" />
                </div>
                <h4 className="font-semibold text-base">Never lose a daily entry</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automatic background autosave ensures your notes, diagrams, and learned skills are secured continuously.
                </p>
              </div>

              <div className="space-y-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <Clock className="size-5" />
                </div>
                <h4 className="font-semibold text-base">Fair deadline tracking</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Clear server-synchronized countdowns and formal extension request channels for unexpected delays.
                </p>
              </div>

              <div className="space-y-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <ShieldCheck className="size-5" />
                </div>
                <h4 className="font-semibold text-base">Verified reviews</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Institutional transparency with department-level grading rubrics and supervisor audit trails.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Logr · Faculty of Engineering, Obafemi Awolowo University.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Student / Coordinator Login
            </Link>
            <Link href="/admin/login" className="hover:text-foreground transition-colors">
              Administrator Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
