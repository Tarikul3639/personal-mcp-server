import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyAccessToken } from "@/lib/mcp-auth";
import { registerPingTool } from "@/tools/ping.tools";
import { registerCalendarTools } from "@/tools/calendar.tools";
import { getGoogleProfile } from "@/lib/db";

const handler = createMcpHandler((server) => {
  registerPingTool(server);
  registerCalendarTools(server);
});

const protectedHandler = withMcpAuth(
  handler,
  async (_request, bearerToken) => {
    if (!bearerToken) return undefined;

    const user = await verifyAccessToken(bearerToken);

    if (!user) return undefined;

    const profile = await getGoogleProfile(user.userId);

    if (!profile) return undefined;

    return {
      token: bearerToken,
      clientId: user.clientId,
      scopes: ["calendar"],
      extra: {
        userId: user.userId,
      },
    };
  },
  { required: true },
);

export { protectedHandler as GET, protectedHandler as POST };