import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { disconnectGoogleAccount, getGoogleTokens } from "@/lib/db";
import { createGoogleOAuthClient } from "@/lib/google-auth";
import { USER_SESSION_COOKIE, verifyUserSession } from "@/lib/mcp-auth";

export async function DELETE() {
  const session = (await cookies()).get(USER_SESSION_COOKIE)?.value;
  const userId = await verifyUserSession(session);

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const tokens = await getGoogleTokens(userId);

  if (tokens?.refresh_token || tokens?.access_token) {
    try {
      await createGoogleOAuthClient().revokeToken(
        tokens.refresh_token ?? tokens.access_token!
      );
    } catch (error) {
      console.warn(
        "Could not revoke Google token; removing local credentials anyway.",
        error
      );
    }
  }

  await disconnectGoogleAccount(userId);

  return NextResponse.json(
    { connected: false },
    { headers: { "Cache-Control": "no-store" } }
  );
}