import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-auth";

export async function GET(request: NextRequest) {
  const state = randomBytes(32).toString("hex");
  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/";

  const next =
    requestedNext.startsWith("/") &&
      !requestedNext.startsWith("//") &&
      !requestedNext.includes("\\")
      ? requestedNext
      : "/";

  const response = NextResponse.redirect(getGoogleAuthUrl(state));

  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/api/auth/callback",
    maxAge: 600,
  });

  response.cookies.set("google_oauth_next", next, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/api/auth/callback",
    maxAge: 600,
  });

  return response;
}