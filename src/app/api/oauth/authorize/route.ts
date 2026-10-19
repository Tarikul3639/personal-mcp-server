import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  createAuthorizationCode,
  ensureMcpClientGrant,
  getGoogleProfile,
  getOAuthClient,
} from "@/lib/db";
import {
  MCP_ISSUER,
  MCP_RESOURCE,
  USER_SESSION_COOKIE,
  verifyUserSession,
} from "@/lib/mcp-auth";

function paramsFrom(url: URL) {
  return {
    clientId: url.searchParams.get("client_id") ?? "",
    redirectUri: url.searchParams.get("redirect_uri") ?? "",
    state: url.searchParams.get("state") ?? "",
    challenge: url.searchParams.get("code_challenge") ?? "",
    method: url.searchParams.get("code_challenge_method") ?? "S256",
    responseType: url.searchParams.get("response_type") ?? "code",
    resource: url.searchParams.get("resource") ?? "",
  };
}

async function validate(params: ReturnType<typeof paramsFrom>) {
  if (
    !params.clientId ||
    !params.redirectUri ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(params.challenge) ||
    params.method !== "S256" ||
    params.responseType !== "code" ||
    params.resource !== MCP_RESOURCE
  ) {
    return null;
  }

  const client = await getOAuthClient(params.clientId);

  if (!client || !client.redirect_uris.includes(params.redirectUri)) {
    return null;
  }

  return client;
}

async function issueAuthorizationCode(
  params: ReturnType<typeof paramsFrom>,
  userId: string,
) {
  const callback = new URL(params.redirectUri);
  const code = randomBytes(32).toString("base64url");

  await createAuthorizationCode({
    code,
    clientId: params.clientId,
    redirectUri: params.redirectUri,
    codeChallenge: params.challenge,
    userId,
  });

  callback.searchParams.set("code", code);

  if (params.state) {
    callback.searchParams.set("state", params.state);
  }

  callback.searchParams.set("iss", MCP_ISSUER);

  return NextResponse.redirect(callback, {
    status: 303,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const params = paramsFrom(request.nextUrl);
  const client = await validate(params);

  if (!client) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  const session = (await cookies()).get(USER_SESSION_COOKIE)?.value;
  const userId = await verifyUserSession(session);

  if (!userId) {
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;

    return NextResponse.redirect(
      new URL(
        `/api/auth/login?next=${encodeURIComponent(next)}`,
        request.url,
      ),
    );
  }

  const profile = await getGoogleProfile(userId);

  if (!profile) {
    return NextResponse.redirect(
      new URL("/?calendar=disconnected", request.url),
    );
  }

  const grantActive = await ensureMcpClientGrant(userId, params.clientId);

  if (!grantActive) {
    const callback = new URL(params.redirectUri);
    callback.searchParams.set("error", "access_denied");
    if (params.state) callback.searchParams.set("state", params.state);
    callback.searchParams.set("iss", MCP_ISSUER);
    return NextResponse.redirect(callback, {
      status: 303,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return issueAuthorizationCode(params, userId);
}
