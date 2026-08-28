import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/auth";
import { jsonError } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email ?? "";
    const password = body.password ?? "";
    if (!verifyCredentials(email, password)) {
      return jsonError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }
    const response = NextResponse.json({ data: { ok: true } });
    response.cookies.set(
      getSessionCookieName(),
      await createSessionToken(email),
      sessionCookieOptions(),
    );
    return response;
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

export async function DELETE() {
  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.set(getSessionCookieName(), "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
