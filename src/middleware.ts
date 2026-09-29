import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, authEnabled, isValidAuthCookie } from './lib/auth';

export async function middleware(req: NextRequest) {
  if (!authEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  if (isPublic) {
    return NextResponse.next();
  }

  const cookieVal = req.cookies.get(AUTH_COOKIE)?.value;
  const isValid = await isValidAuthCookie(cookieVal);

  if (isValid) {
    return NextResponse.next();
  }

  // If unauthorized API request: return 401 JSON
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized: Valid login required' }, { status: 401 });
  }

  // Otherwise redirect to /login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
