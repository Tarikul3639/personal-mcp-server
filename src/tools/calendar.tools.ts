import { McpServer } from "@modelcontextprotocol/server";
import {
    listCalendarEvents,
    createCalendarEvent,
    findCalendarEventsByDate,
    getCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
} from "../services/calendar.service";
import { z } from "zod";

const dateTimeSchema = z.string().datetime({ offset: true });

const eventFields = {
    summary: z.string().min(1).optional(),
    start: dateTimeSchema.optional(),
    end: dateTimeSchema.optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    colorId: z.string().optional(),
    attendees: z.array(
        z.object({
            email: z.string().email(),
        }),
    ).optional(),
    reminders: z.object({
        useDefault: z.boolean().optional(),
        overrides: z.array(
            z.object({
                method: z.enum(["email", "popup"]),
                minutes: z.number().int().min(0),
            }),
        ).optional(),
    }).optional(),
    visibility: z.enum([
        "default",
        "public",
        "private",
        "confidential",
    ]).optional(),
    transparency: z.enum(["opaque", "transparent"]).optional(),
    recurrence: z.array(z.string()).optional(),
};

const createEventSchema = z.object({
    ...eventFields,
    summary: z.string().min(1),
    start: dateTimeSchema,
    end: dateTimeSchema,
}).refine(
    (event) => new Date(event.end) > new Date(event.start),
    {
        message: "End time must be after start time.",
        path: ["end"],
    },
);

const updateEventSchema = z.object({
    eventId: z.string().min(1),
    updates: z.object(eventFields).refine(
        (updates) => Object.keys(updates).length > 0,
        "Provide at least one field to update.",
    ).refine(
        (updates) =>
            !updates.start ||
            !updates.end ||
            new Date(updates.end) > new Date(updates.start),
        {
            message: "End time must be after start time.",
            path: ["end"],
        },
    ),
});

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
            description: "Create a calendar event with description, location, color, attendees, reminders and recurrence.",
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
            description: "Find upcoming calendar events whose start date matches YYYY-MM-DD.",
            inputSchema: {
                date: z.string().date(),
            },
        },
        async ({ date }) => {
            try {
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
            description: "Get a Google Calendar event by its event ID.",
            inputSchema: {
                eventId: z.string().min(1),
            },
        },
        async ({ eventId }) => {
            try {
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
            description: "Update selected fields of an existing Google Calendar event.",
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
            description: "Permanently delete an event from the primary Google Calendar.",
            inputSchema: {
                eventId: z.string().min(1),
            },
        },
        async ({ eventId }) => {
            try {
                await deleteCalendarEvent(eventId);
                return result({ success: true, eventId });
            } catch (error) {
                return failure("Failed to delete event", error);
            }
        },
    );
}