import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

// /api/health is public on purpose: it has to be answerable without a
// session so a run can be verified from outside a browser.
const PUBLIC_PATHS = ["/login", "/api/health"];

export function proxy(request: NextRequest) {
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const authed = verifySessionToken(token);

  if (!authed && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// A "Proxy" file (this one) always runs on the Node.js runtime in this
// Next.js version — node:crypto (used to verify the session HMAC) just
// works here with no config needed. Setting `runtime` explicitly is what
// produced "Route segment config is not allowed in Proxy file".
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
