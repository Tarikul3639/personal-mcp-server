import { createMcpHandler } from "mcp-handler";
import { registerPingTool } from "@/tools/ping.tools";
import { registerCalendarTools } from "@/tools/calendar.tools";

const handler = createMcpHandler((server) => {
  registerPingTool(server);
  registerCalendarTools(server);
});

export { handler as GET, handler as POST };