import { McpServer } from "@modelcontextprotocol/server";
import { registerPingTool } from "./tools/ping.tools.js";
import { registerCalendarTools } from "./tools/calendar.tools.js";

export function createServer(): McpServer {
    const server = new McpServer({
        name: "Personal MCP Server",
        version: "1.0.0",
    });

    registerPingTool(server);
    registerCalendarTools(server);

    return server;
}
