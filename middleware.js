import { NextResponse } from 'next/server';

export function middleware(request) {
  const currentUser = request.cookies.get('auth_session')?.value;
  
  // 1. If trying to access dashboard (root) and not logged in -> Redirect to Login
  if (!currentUser && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If already logged in and trying to access Login -> Redirect to Dashboard
  if (currentUser && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'], // Protects root and login routes
};