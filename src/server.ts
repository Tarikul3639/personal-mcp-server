import { McpServer } from "@modelcontextprotocol/server";
import { listCalendarEvents } from "./services/calendar.service.js";

export function createServer(): McpServer {
    const server = new McpServer({
        name: "Personal MCP Server",
        version: "1.0.0",
    });

    server.registerTool(
        "ping",
        {
            description: "Check whether the personal MCP server is working",
        },
        async () => ({
            content: [
                {
                    type: "text",
                    text: "Personal MCP Server is working!",
                },
            ],
        }),
    );

    server.registerTool(
        "listCalendarEvents",
        {
            title: "List Calendar Events",
            description:
                "Get the next 10 upcoming events from the primary Google Calendar.",
            inputSchema: {},
        },
        async (_args) => {
            console.error("TOOL CALLED!");
            
            const events = await listCalendarEvents();

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(events, null, 2),
                    },
                ],
            };
        },
    );

    return server;
}
