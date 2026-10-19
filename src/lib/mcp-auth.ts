import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.MCP_AUTH_SECRET);
export const MCP_ISSUER = env.MCP_BASE_URL.replace(/\/$/, "");
export const MCP_RESOURCE = `${MCP_ISSUER}/api/mcp`;
export const USER_SESSION_COOKIE = "mcp_user_session";

export interface McpUser {
  userId: string;
  clientId: string;
}

export async function createAccessToken(userId: string, clientId: string) {
  return new SignJWT({ client_id: clientId, scope: "calendar" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(MCP_ISSUER)
    .setAudience(MCP_RESOURCE)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<McpUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: MCP_ISSUER,
      audience: MCP_RESOURCE,
    });

    if (typeof payload.sub !== "string" || typeof payload.client_id !== "string" || payload.scope !== "calendar") return null;
    return { userId: payload.sub, clientId: payload.client_id };
  } catch {
    return null;
  }
}

export async function createUserSession(userId: string) {
  return new SignJWT({ role: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(MCP_ISSUER)
    .setAudience(`${MCP_ISSUER}/dashboard`)
    .setSubject(userId.trim().toLowerCase())
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyUserSession(token?: string): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: MCP_ISSUER,
      audience: `${MCP_ISSUER}/dashboard`,
    });
    return typeof payload.sub === "string" && payload.role === "user" ? payload.sub : null;
  } catch {
    return null;
  }
}
