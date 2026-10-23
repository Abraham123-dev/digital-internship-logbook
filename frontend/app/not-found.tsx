import Link from "next/link";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F4EF] font-sans selection:bg-[#F04D23] selection:text-white flex flex-col justify-between p-6">
      <header className="max-w-[1180px] w-full mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="size-2 rounded-full bg-[#F04D23] group-hover:scale-125 transition-transform shrink-0" />
          <span className="text-[17px] font-extrabold tracking-[-0.03em] text-[#141414]">Logr</span>
          <span className="text-[11.5px] text-[#7A7973] font-normal ml-0.5">/ OAU</span>
        </Link>
      </header>

      <main className="max-w-[500px] w-full mx-auto my-auto text-center space-y-6">
        <div className="size-16 rounded-2xl bg-white border border-[#E8E7E1] mx-auto flex items-center justify-center text-[#141414] shadow-xs">
          <Compass className="size-7 text-[#7A7973]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#F04D23]">
            404 Error
          </span>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-[#141414]">
            Page not found
          </h1>
          <p className="text-[13px] text-[#7A7973] leading-relaxed max-w-[380px] mx-auto">
            The page you requested could not be located, may have been relocated, or requires authentication.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] transition-colors shadow-xs"
          >
            <Home className="size-3.5" />
            <span>Return to home</span>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#D8D7CE] text-[#141414] text-[12.5px] font-semibold hover:bg-[#F5F4EF] transition-colors shadow-xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Sign in</span>
          </Link>
        </div>
      </main>

      <footer className="text-center text-[11px] text-[#9A9990] py-4">
        Obafemi Awolowo University &middot; Faculty of Technology &middot; SWEP & SIWES
      </footer>
    </div>
  );
}
