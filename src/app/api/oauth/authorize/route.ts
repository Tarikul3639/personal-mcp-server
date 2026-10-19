import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  createAuthorizationCode,
  getGoogleProfile,
  getOAuthClient,
} from "@/lib/db";
import {
  MCP_ISSUER,
  MCP_RESOURCE,
  USER_SESSION_COOKIE,
  verifyUserSession,
} from "@/lib/mcp-auth";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const page = (title: string, body: string) =>
  new NextResponse(
    `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            background: #090909;
            color: #eee;
            font: 16px system-ui;
            display: grid;
            min-height: 100vh;
            place-items: center;
        }
        .card {
            width: min(440px, calc(100% - 40px));
            padding: 32px;
            border: 1px solid #292929;
            border-radius: 18px;
            background: #111;
        }
        .tag {
            color: #f5c518;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: .12em;
        }
        h1 {
            font-size: 25px;
            margin: 12px 0;
        }
        p {
            color: #aaa;
            line-height: 1.6;
        }
        button {
            background: #f5c518;
            color: #111;
            border: 0;
            border-radius: 8px;
            padding: 13px 18px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            width: 100%;
            margin-top: 12px;
        }
        .sub {
            background: #222;
            color: #ddd;
        }
        .lock {
            font-size: 26px;
        }
    </style>
</head>
<body>
    <main class="card">${body}</main>
</body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "DENY",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      },
    },
  );

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

  const hidden = Object.entries({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    state: params.state,
    code_challenge: params.challenge,
    code_challenge_method: params.method,
    response_type: params.responseType,
    resource: params.resource,
  })
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`,
    )
    .join("");

  return page(
    "Approve calendar access",
    `
            <span class="tag">MCP connection request</span>
            <h1>Allow ${escapeHtml(client.client_name ?? "MCP client")}?</h1>
            <p>
                This client will be able to read and manage events in
                <strong>${escapeHtml(profile.email)}</strong>
                for 15 minutes per access token.
            </p>
            <p>
                Only approve a client you trust. You can close this page
                to deny access.
            </p>
            <form method="post" action="/api/oauth/authorize">
                ${hidden}
                <button name="decision" value="approve">
                    Approve calendar access
                </button>
                <button class="sub" name="decision" value="deny">
                    Deny
                </button>
            </form>
        `,
  );
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const asUrl = new URL(request.url);

  for (const key of [
    "client_id",
    "redirect_uri",
    "state",
    "code_challenge",
    "code_challenge_method",
    "response_type",
    "resource",
  ]) {
    const value = form.get(key);

    if (typeof value === "string") {
      asUrl.searchParams.set(key, value);
    }
  }

  const params = paramsFrom(asUrl);
  const client = await validate(params);

  if (!client) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  const session = request.cookies.get(USER_SESSION_COOKIE)?.value;
  const userId = await verifyUserSession(session);

  if (!userId) {
    return NextResponse.json(
      { error: "access_denied" },
      { status: 401 },
    );
  }

  const callback = new URL(params.redirectUri);

  if (form.get("decision") !== "approve") {
    callback.searchParams.set("error", "access_denied");

    if (params.state) {
      callback.searchParams.set("state", params.state);
    }

    callback.searchParams.set("iss", MCP_ISSUER);

    return NextResponse.redirect(callback, 303);
  }

  const profile = await getGoogleProfile(userId);

  if (!profile) {
    return NextResponse.redirect(
      new URL("/?calendar=disconnected", request.url),
    );
  }

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

  return NextResponse.redirect(callback, 303);
}