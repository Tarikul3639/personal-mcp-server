import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  consumeAuthorizationCode,
  hasActiveMcpClientGrant,
  getGoogleProfile,
  revokeMcpClientAccess,
  rotateMcpRefreshToken,
  saveMcpRefreshToken,
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

const tokenResponse = async (input: {
  userId: string;
  clientId: string;
  refreshToken: string;
}) =>
  withOAuthCors(
    NextResponse.json(
      {
        access_token: await createAccessToken(input.userId, input.clientId),
        token_type: "Bearer",
        expires_in: 900,
        refresh_token: input.refreshToken,
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

export async function POST(request: NextRequest) {
  const body = await request.formData().catch(() => null);

  if (!body) return error("invalid_request");

  const grantType = body.get("grant_type");
  const clientId = body.get("client_id");
  const resource = body.get("resource");

  if (
    typeof clientId !== "string" ||
    (resource !== null && resource !== MCP_RESOURCE)
  ) {
    return error("invalid_request");
  }

  if (grantType === "authorization_code") {
    const code = body.get("code");
    const redirectUri = body.get("redirect_uri");
    const verifier = body.get("code_verifier");

    if (
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

    if (
      !(await hasActiveMcpClientGrant(
        authorization.user_id,
        authorization.client_id,
      ))
    ) {
      return error("invalid_grant");
    }

    const profile = await getGoogleProfile(authorization.user_id);

    if (!profile) return error("invalid_grant");

    const refreshToken = randomBytes(32).toString("base64url");
    await saveMcpRefreshToken({
      token: refreshToken,
      clientId: authorization.client_id,
      userId: authorization.user_id,
      familyId: randomUUID(),
    });

    return tokenResponse({
      userId: authorization.user_id,
      clientId: authorization.client_id,
      refreshToken,
    });
  }

  if (grantType === "refresh_token") {
    const currentRefreshToken = body.get("refresh_token");

    if (
      typeof currentRefreshToken !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(currentRefreshToken)
    ) {
      return error("invalid_grant");
    }

    const nextRefreshToken = randomBytes(32).toString("base64url");
    const rotated = await rotateMcpRefreshToken({
      currentTokenHash: createHash("sha256")
        .update(currentRefreshToken)
        .digest("hex"),
      nextToken: nextRefreshToken,
      clientId,
    });

    if (!rotated) return error("invalid_grant");

    if (!(await hasActiveMcpClientGrant(rotated.userId, clientId))) {
      return error("invalid_grant");
    }

    const profile = await getGoogleProfile(rotated.userId);

    if (!profile) {
      await revokeMcpClientAccess(rotated.userId, clientId);
      return error("invalid_grant");
    }

    return tokenResponse({
      userId: rotated.userId,
      clientId,
      refreshToken: nextRefreshToken,
    });
  }

  return error("unsupported_grant_type");
}

export function OPTIONS() {
  return oauthOptions();
}
