const COOKIE = "invoice_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret(): string | null {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) return null;
  return value;
}

function expectedEmail(): string {
  return (process.env.AUTH_EMAIL ?? "").trim().toLowerCase();
}

function expectedPassword(): string {
  return process.env.AUTH_PASSWORD ?? "";
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function sign(payload: string): Promise<string | null> {
  const keyMaterial = secret();
  if (!keyMaterial) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyMaterial),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(mac);
}

export function getSessionCookieName(): string {
  return COOKIE;
}

export async function createSessionToken(email: string, now = Date.now()): Promise<string> {
  const payload = `${email.toLowerCase()}.${now + MAX_AGE_SECONDS * 1000}`;
  const mac = await sign(payload);
  if (!mac) {
    throw new Error("AUTH_SECRET must be set to at least 16 characters");
  }
  return `${payload}.${mac}`;
}

export async function readSessionEmail(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const mac = token.slice(lastDot + 1);
  const expected = await sign(payload);
  if (!expected || !timingSafeEqual(mac, expected)) return null;
  const expiryDot = payload.lastIndexOf(".");
  if (expiryDot <= 0) return null;
  const email = payload.slice(0, expiryDot);
  const expiryRaw = payload.slice(expiryDot + 1);
  const expiry = Number(expiryRaw);
  if (!email || !Number.isFinite(expiry) || expiry < Date.now()) return null;
  if (email !== expectedEmail()) return null;
  return email;
}

export function verifyCredentials(email: string, password: string): boolean {
  const wantEmail = expectedEmail();
  const wantPassword = expectedPassword();
  if (!wantEmail || !wantPassword) return false;
  return (
    timingSafeEqual(email.trim().toLowerCase(), wantEmail) &&
    timingSafeEqual(password, wantPassword)
  );
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
