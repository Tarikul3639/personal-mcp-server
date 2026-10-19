import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  consumeAuthorizationCode,
  getGoogleProfile,
} from "@/lib/db";
import { createAccessToken, MCP_RESOURCE } from "@/lib/mcp-auth";
import { oauthOptions, withOAuthCors } from "@/lib/oauth-cors";

const error = (code: string) =>
  withOAuthCors(
    NextResponse.json(
      { error: code },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      },
    ),
  );

export async function POST(request: NextRequest) {
  const body = await request.formData().catch(() => null);

  if (!body) return error("invalid_request");

  const grantType = body.get("grant_type");
  const clientId = body.get("client_id");
  const code = body.get("code");
  const redirectUri = body.get("redirect_uri");
  const verifier = body.get("code_verifier");
  const resource = body.get("resource");

  if (
    grantType !== "authorization_code" ||
    typeof clientId !== "string" ||
    typeof code !== "string" ||
    typeof redirectUri !== "string" ||
    typeof verifier !== "string" ||
    resource !== MCP_RESOURCE ||
    !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)
  ) {
    return error("invalid_grant");
  }

  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");

  const authorization = await consumeAuthorizationCode({
    code,
    clientId,
    redirectUri,
    challenge,
  });

  if (!authorization) return error("invalid_grant");

  const profile = await getGoogleProfile(authorization.user_id);

  if (!profile) return error("invalid_grant");

  return withOAuthCors(
    NextResponse.json(
      {
        access_token: await createAccessToken(
          authorization.user_id,
          authorization.client_id,
        ),
        token_type: "Bearer",
        expires_in: 900,
        scope: "calendar",
      },
      {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      },
    ),
  );
}

export function OPTIONS() {
  return oauthOptions();
}