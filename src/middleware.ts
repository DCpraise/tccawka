import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // The app layout handles auth protection client-side via useAuth().
  // Middleware only needs to pass requests through cleanly.
  // We do NOT check cookies here because the client uses localStorage for sessions.
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
