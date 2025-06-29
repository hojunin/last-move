import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // 인증이 필요하지 않은 경로들
  const publicPaths = [
    "/auth/signin",
    "/auth/signup",
    "/api/auth",
    "/_next",
    "/favicon.ico",
    "/manifest.json",
    "/sw.js",
    "/sw-notifications.js",
    "/workbox-e9849328.js",
  ];

  // public 경로는 통과
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!session) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

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
