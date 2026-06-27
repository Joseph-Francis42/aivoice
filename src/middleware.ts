import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Protected paths
  const isProtectedPath =
    pathname.startsWith("/dashboard") || pathname.startsWith("/interview");

  // Auth gateway paths (home page, login/register UI)
  const isAuthPath = pathname === "/";

  if (isProtectedPath && !token) {
    // Redirect unauthenticated users to landing page
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthPath && token) {
    // Redirect already authenticated users to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Config to specify matching routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
