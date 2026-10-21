import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@/types/auth";

// TODO: confirm cookie name with backend partner before first integration.
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

function decodeJwtRole(token: string): Role | null {
  try {
    const segment = token.split(".")[1];
    // JWT payload is base64url-encoded, not base64.
    // Replace base64url chars before decoding and add padding.
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      segment.length + ((4 - (segment.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(atob(base64)) as { role?: string };
    const role = payload.role;
    if (role === "student" || role === "coordinator" || role === "admin") return role;
    return null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Supervisor pages are token-authenticated; handled entirely by the page.
  if (pathname.startsWith("/supervisor")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE);
  const role = cookie ? decodeJwtRole(cookie.value) : null;

  for (const { prefix, role: required } of PROTECTED) {
    if (!pathname.startsWith(prefix)) continue;

    if (!role) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (role !== required) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }

    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname) && role) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)" ],
};
