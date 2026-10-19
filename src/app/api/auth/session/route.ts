import { NextResponse } from "next/server";
import { USER_SESSION_COOKIE } from "@/lib/mcp-auth";

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.delete(USER_SESSION_COOKIE);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
