import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  listMcpClientAccess,
  revokeMcpClientAccess,
} from "@/lib/db";
import { USER_SESSION_COOKIE, verifyUserSession } from "@/lib/mcp-auth";

async function currentUserId() {
  const session = (await cookies()).get(USER_SESSION_COOKIE)?.value;
  return verifyUserSession(session);
}

export async function GET() {
  const userId = await currentUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { clients: await listMcpClientAccess(userId) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  const userId = await currentUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = await request.json().catch(() => null);
  const clientId = body?.client_id;

  if (typeof clientId !== "string" || !clientId) {
    return NextResponse.json(
      { error: "client_id is required" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const revoked = await revokeMcpClientAccess(userId, clientId);

  if (!revoked) {
    return NextResponse.json(
      { error: "Client access not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { revoked: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
