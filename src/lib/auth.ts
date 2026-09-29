export const AUTH_COOKIE = 'prash_auth';

export function authEnabled(): boolean {
  const pass = process.env.APP_PASSWORD?.trim() || process.env.APP_PASSCODE?.trim();
  return !!pass;
}

/** SHA-256 hex hash of the password/passcode */
export async function passcodeToken(passcode: string): Promise<string> {
  const data = new TextEncoder().encode(`prash::${passcode}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function expectedToken(): Promise<string | null> {
  const passcode = process.env.APP_PASSWORD?.trim() || process.env.APP_PASSCODE?.trim();
  if (!passcode) return null;
  return passcodeToken(passcode);
}

/** Constant-time comparison */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function isValidAuthCookie(value: string | undefined): Promise<boolean> {
  const expected = await expectedToken();
  if (!expected) return true; // Auth not configured, allow access
  if (!value) return false;
  return safeEqual(value, expected);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD?.trim() || process.env.APP_PASSCODE?.trim();
  if (!expected) return true;
  return safeEqual(input.trim(), expected);
}
