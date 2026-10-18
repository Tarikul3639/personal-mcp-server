import { McpServer } from "@modelcontextprotocol/server";
import { listCalendarEvents } from "../services/calendar.service.js";

export function registerCalendarTools(server: McpServer): void {
    server.registerTool(
        "listCalendarEvents",
        {
            title: "List Calendar Events",
            description:
                "Get the next 10 upcoming events from the primary Google Calendar.",
        },
        async () => {
            try {
                const events = await listCalendarEvents();

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(events, null, 2),
                        },
                    ],
                };
            } catch (error) {
                console.error("Failed to list calendar events:", error);

                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to fetch calendar events: ${error instanceof Error ? error.message : String(error)
                                }`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
