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

// Invitation links must remain accessible even when another account is signed in.
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

function decodeJwtRole(token?: string): Role | null {
  if (!token) return null;
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const base64 = segment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(segment.length + ((4 - (segment.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(base64)) as { role?: string; user_role?: string };
    const role = (payload.role ?? payload.user_role)?.toLowerCase();
    if (role === "student" || role === "coordinator" || role === "admin") return role as Role;
    return null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/supervisor")) return NextResponse.next();

  const cookieVal = req.cookies.get(SESSION_COOKIE)?.value;
  let role = cookieVal ? decodeJwtRole(cookieVal) : null;
  if (!role) {
    const roleCookie = req.cookies.get("logr_role")?.value?.toLowerCase();
    if (roleCookie === "student" || roleCookie === "coordinator" || roleCookie === "admin") {
      role = roleCookie as Role;
    }
  }

  // If already authenticated and visiting admin login:
  if (pathname === "/admin/login") {
    if (role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role as Role], req.url));
    }
    return NextResponse.next();
  }

  for (const { prefix, role: required } of PROTECTED) {
    if (!pathname.startsWith(prefix)) continue;

    if (!role) {
      const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
      const url = new URL(loginPath, req.url);
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
