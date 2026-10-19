import { NextResponse } from "next/server";
import { MCP_ISSUER } from "@/lib/mcp-auth";
import { oauthOptions, withOAuthCors } from "@/lib/oauth-cors";

export async function GET() {
    const base = MCP_ISSUER;

    return withOAuthCors(NextResponse.json({
        issuer: base,
        authorization_endpoint: `${base}/api/oauth/authorize`,
        token_endpoint: `${base}/api/oauth/token`,
        registration_endpoint: `${base}/api/oauth/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
        scopes_supported: ["calendar", "offline_access"],
    }));
}

export function OPTIONS() {
    return oauthOptions();
}
