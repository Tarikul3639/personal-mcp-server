import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { saveOAuthClient } from "@/lib/db";
import { oauthOptions, withOAuthCors } from "@/lib/oauth-cors";

function allowedRedirect(uri: unknown): uri is string {
  if (typeof uri !== "string") return false;

  try {
    const url = new URL(uri);

    return (
      !url.hash &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(
            url.hostname,
          )))
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const redirectUris = body?.redirect_uris;

  if (
    !Array.isArray(redirectUris) ||
    redirectUris.length === 0 ||
    redirectUris.length > 20 ||
    !redirectUris.every(allowedRedirect)
  ) {
    return withOAuthCors(
      NextResponse.json(
        { error: "invalid_redirect_uri" },
        { status: 400 },
      ),
    );
  }

  const clientId = randomUUID();

  const clientName =
    typeof body.client_name === "string"
      ? body.client_name.trim().slice(0, 120) || null
      : null;

  await saveOAuthClient(clientId, redirectUris, clientName);

  return withOAuthCors(
    NextResponse.json(
      {
        client_id: clientId,
        redirect_uris: redirectUris,
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code"],
        response_types: ["code"],
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    ),
  );
}

export function OPTIONS() {
  return oauthOptions();
}