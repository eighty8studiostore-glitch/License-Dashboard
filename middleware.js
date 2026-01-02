import { NextResponse } from 'next/server';

export function middleware(request) {
  // Safe access to the cookie
  const currentUser = request.cookies.get('auth_session')?.value;
  
  // 1. If accessing root ('/') and NOT logged in -> Redirect to Login
  if (!currentUser && request.nextUrl.pathname === '/') {
    // ERROR FIX: Must use "new URL()" with the base "request.url"
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If accessing Login ('/login') and ALREADY logged in -> Redirect to Dashboard
  if (currentUser && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};