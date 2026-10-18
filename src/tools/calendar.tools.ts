import { McpServer } from "@modelcontextprotocol/server";
import {
    listCalendarEvents,
    createCalendarEvent,
    findCalendarEventsByDate,
    getCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
} from "../services/calendar.service";

import {
    createEventSchema,
    updateEventSchema,
    findEventsByDateSchema,
    eventIdSchema,
} from "../schemas/calendar.schema";

function result(data: unknown) {
    return {
        content: [{
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
        }],
    };
}

function failure(action: string, error: unknown) {
    return {
        content: [{
            type: "text" as const,
            text: `${action}: ${error instanceof Error ? error.message : String(error)
                }`,
        }],
        isError: true,
    };
}

export function registerCalendarTools(server: McpServer): void {
    server.registerTool(
        "listCalendarEvents",
        {
            title: "List Calendar Events",
            description: "List the next 10 upcoming events from the primary Google Calendar.",
        },
        async () => {
            try {
                return result(await listCalendarEvents());
            } catch (error) {
                return failure("Failed to list events", error);
            }
        },
    );

    server.registerTool(
        "createCalendarEvent",
        {
            title: "Create Calendar Event",
            description:
                "Create a Google Calendar event. Supports title, start and end time, description, location, event color, attendees, reminders, visibility, transparency, and recurrence. Choose colorId from the documented Google Calendar color options when a color is requested.",
            inputSchema: createEventSchema.shape,
        },
        async (input) => {
            try {
                const event = createEventSchema.parse(input);
                return result(await createCalendarEvent(event));
            } catch (error) {
                return failure("Failed to create event", error);
            }
        },
    );

    server.registerTool(
        "findCalendarEventsByDate",
        {
            title: "Find Calendar Events by Date",
            description:
                "Find upcoming calendar events whose start date matches the specified YYYY-MM-DD date.",
            inputSchema: findEventsByDateSchema.shape,
        },
        async (input) => {
            try {
                const { date } = findEventsByDateSchema.parse(input);
                return result(await findCalendarEventsByDate(date));
            } catch (error) {
                return failure("Failed to find events", error);
            }
        },
    );

    server.registerTool(
        "getCalendarEvent",
        {
            title: "Get Calendar Event",
            description: "Retrieve a Google Calendar event using its event ID.",
            inputSchema: eventIdSchema.shape,
        },
        async (input) => {
            try {
                const { eventId } = eventIdSchema.parse(input);
                return result(await getCalendarEvent(eventId));
            } catch (error) {
                return failure("Failed to get event", error);
            }
        },
    );

    server.registerTool(
        "updateCalendarEvent",
        {
            title: "Update Calendar Event",
            description:
                "Update selected fields of an existing Google Calendar event. Provide its event ID and at least one field to update.",
            inputSchema: updateEventSchema.shape,
        },
        async (input) => {
            try {
                const { eventId, updates } = updateEventSchema.parse(input);
                return result(await updateCalendarEvent(eventId, updates));
            } catch (error) {
                return failure("Failed to update event", error);
            }
        },
    );

    server.registerTool(
        "deleteCalendarEvent",
        {
            title: "Delete Calendar Event",
            description:
                "Permanently delete an event from the primary Google Calendar using its event ID.",
            inputSchema: eventIdSchema.shape,
        },
        async (input) => {
            try {
                const { eventId } = eventIdSchema.parse(input);
                await deleteCalendarEvent(eventId);
                return result({ success: true, eventId });
            } catch (error) {
                return failure("Failed to delete event", error);
            }
        },
    );
}