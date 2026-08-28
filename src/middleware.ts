import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const secret = process.env.INTERNAL_APP_SECRET;
  if (!secret) return NextResponse.next();

  const provided =
    request.headers.get("x-internal-app-secret") ??
    request.cookies.get("internal_app_secret")?.value;

  if (provided !== secret) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Internal access required" } },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
