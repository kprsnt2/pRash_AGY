import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, authEnabled, checkPassword, passcodeToken, isValidAuthCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const enabled = authEnabled();
  if (!enabled) {
    return NextResponse.json({ authEnabled: false, authenticated: true });
  }

  const cookieVal = req.cookies.get(AUTH_COOKIE)?.value;
  const authenticated = await isValidAuthCookie(cookieVal);

  return NextResponse.json({ authEnabled: true, authenticated });
}

export async function POST(req: NextRequest) {
  if (!authEnabled()) {
    return NextResponse.json({ ok: true, message: 'Auth disabled' });
  }

  let password = '';
  try {
    const body = await req.json();
    password = String(body.password || body.passcode || '');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
  }

  const expectedPass = process.env.APP_PASSWORD?.trim() || process.env.APP_PASSCODE?.trim() || '';
  const token = await passcodeToken(expectedPass);

  const res = NextResponse.json({ ok: true, message: 'Authentication successful' });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, message: 'Logged out successfully' });
  res.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
