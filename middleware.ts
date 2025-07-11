import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth';
import NextAuth from 'next-auth';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 디버깅: 모든 요청 로그
  console.log(`[미들웨어] 요청: ${pathname}, 인증 상태: ${!!req.auth}`);

  // 인증이 필요하지 않은 경로들
  const publicPaths = [
    '/about',
    '/auth/signin',
    '/auth/signup',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',
    '/sw-notifications.js',
    '/workbox-3c9d0171.js',
  ];

  // public 경로는 통과
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    console.log(`[미들웨어] 퍼블릭 경로 통과: ${pathname}`);
    return NextResponse.next();
  }

  // 인증되지 않은 사용자는 About 페이지로 리다이렉트
  if (!req.auth) {
    console.log(
      `[미들웨어] 인증되지 않은 사용자 ${pathname} → /about 리다이렉트`,
    );
    const aboutUrl = new URL('/about', req.url);
    return NextResponse.redirect(aboutUrl);
  }

  // 인증된 사용자는 정상적으로 통과
  console.log(`[미들웨어] 인증된 사용자 통과: ${pathname}`);
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
