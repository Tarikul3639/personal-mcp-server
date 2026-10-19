import { NextResponse } from "next/server";
import { MCP_ISSUER, MCP_RESOURCE } from "@/lib/mcp-auth";
import { oauthOptions, withOAuthCors } from "@/lib/oauth-cors";

export async function GET() {
    return withOAuthCors(NextResponse.json({
        resource: MCP_RESOURCE,
        authorization_servers: [MCP_ISSUER],
        bearer_methods_supported: ["header"],
    }));
}

export function OPTIONS() {
    return oauthOptions();
}
