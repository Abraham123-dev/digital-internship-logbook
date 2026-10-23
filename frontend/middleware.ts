import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@/types/auth";

const SESSION_COOKIE = "logr_session";

const ROLE_HOME: Record<Role, string> = {
  student: "/student",
  coordinator: "/coordinator",
  admin: "/admin",
};

const PROTECTED: Array<{ prefix: string; role: Role }> = [
  { prefix: "/student", role: "student" },
  { prefix: "/coordinator", role: "coordinator" },
  { prefix: "/admin", role: "admin" },
];

const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/accept-invite"];

function decodeJwtRole(token?: string): Role | null {
  if (!token) return null;
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const base64 = segment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(segment.length + ((4 - (segment.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(base64)) as { role?: string };
    const role = payload.role;
    if (role === "student" || role === "coordinator" || role === "admin") return role as Role;
    return null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  // ── DEV PREVIEW MODE ─────────────────────────────────────────────────────────
  // Auth guards are bypassed so all pages can be visited at their direct URLs.
  // To restore production auth: delete the next line only.
  return NextResponse.next();
  // ─────────────────────────────────────────────────────────────────────────────

  // eslint-disable-next-line no-unreachable
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/supervisor")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const cookieVal = req.cookies.get(SESSION_COOKIE)?.value;
  const role = cookieVal ? decodeJwtRole(cookieVal) : null;

  for (const { prefix, role: required } of PROTECTED) {
    if (!pathname.startsWith(prefix)) continue;

    if (!role) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (role !== required) {
      return NextResponse.redirect(new URL(ROLE_HOME[role as Role], req.url));
    }

    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname) && role) {
    return NextResponse.redirect(new URL(ROLE_HOME[role as Role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)" ],
};
