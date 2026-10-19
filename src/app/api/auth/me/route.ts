import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGoogleProfile } from "@/lib/db";
import { USER_SESSION_COOKIE, verifyUserSession } from "@/lib/mcp-auth";

export async function GET() {
  const session = (await cookies()).get(USER_SESSION_COOKIE)?.value;
  const userId = await verifyUserSession(session);

  if (!userId) {
    return NextResponse.json(
      { authenticated: false, user: null },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const user = await getGoogleProfile(userId);

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      { authenticated: true, user },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Auth profile error:", error);

    return NextResponse.json(
      { authenticated: false, user: null },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}