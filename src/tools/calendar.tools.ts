
import { McpServer } from "@modelcontextprotocol/server";
import {
    listCalendarEvents,
    createCalendarEvent,
    findCalendarEventsByDate,
} from "../services/calendar.service";
import { z } from "zod";

export function registerCalendarTools(server: McpServer): void {
    server.registerTool(
        "listCalendarEvents",
        {
            title: "List Calendar Events",
            description: "Get the next 10 upcoming events from the primary Google Calendar.",
        },
        async () => {
            try {
                const events = await listCalendarEvents();
                return {
                    content: [{ type: "text", text: JSON.stringify(events, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Failed to list events: ${error instanceof Error ? error.message : String(error)}`,
                    }],
                    isError: true,
                };
            }
        },
    );

    server.registerTool(
        "createCalendarEvent",
        {
            title: "Create Calendar Event",
            description: "Create a new event in the primary Google Calendar.",
            inputSchema: {
                summary: z.string().min(1).describe("Event title"),
                start: z.string().datetime({ offset: true }).describe("Start date/time in ISO 8601 with timezone offset"),
                end: z.string().datetime({ offset: true }).describe("End date/time in ISO 8601 with timezone offset"),
                description: z.string().optional().describe("Optional event description"),
                location: z.string().optional().describe("Optional event location"),
            },
        },
        async ({ summary, start, end, description, location }) => {
            try {
                if (new Date(end) <= new Date(start)) {
                    throw new Error("End time must be after start time.");
                }

                const event = await createCalendarEvent({
                    summary,
                    start,
                    end,
                    description,
                    location,
                });

                return {
                    content: [{ type: "text", text: JSON.stringify(event, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Failed to create event: ${error instanceof Error ? error.message : String(error)}`,
                    }],
                    isError: true,
                };
            }
        },
    );

    server.registerTool(
        "findCalendarEventsByDate",
        {
            title: "Find Calendar Events by Date",
            description: "Find Google Calendar events on a specific date. Format: YYYY-MM-DD.",
            inputSchema: {
                date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date to search, e.g. 2026-10-20"),
            },
        },
        async ({ date }) => {
            try {
                const events = await findCalendarEventsByDate(date);
                return {
                    content: [{ type: "text", text: JSON.stringify(events, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Failed to find events: ${error instanceof Error ? error.message : String(error)}`,
                    }],
                    isError: true,
                };
            }
        },
    );
}
