import { google } from "googleapis";
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface CalendarEvent {
    summary: string;
    start: string;
    end: string;
}

export interface NewCalendarEvent {
    summary: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
}

const CREDENTIALS_PATH = path.resolve(
    process.cwd(),
    "src/credentials/google-oauth-client.json",
);

const TOKEN_PATH = path.resolve(
    process.cwd(),
    "src/credentials/google-token.json",
);

// Shared authentication function
async function createCalendarAuth() {
    const keyFile = JSON.parse(await readFile(CREDENTIALS_PATH, "utf8"));

    const credentials = keyFile.installed;

    if (!credentials?.client_id || !credentials?.client_secret) {
        throw new Error("Invalid Google OAuth client credentials.");
    }

    const auth = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
    );

    const tokens = JSON.parse(await readFile(TOKEN_PATH, "utf8"));

    auth.setCredentials(tokens);

    return auth;
}

// 1. List upcoming events
export async function listCalendarEvents(): Promise<CalendarEvent[]> {
    const auth = await createCalendarAuth();

    const calendar = google.calendar({
        version: "v3",
        auth,
    });

    const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
    });

    return (response.data.items ?? []).map((event) => ({
        summary: event.summary ?? "(No title)",
        start: event.start?.date ?? event.start?.dateTime ?? "Unknown",
        end: event.end?.date ?? event.end?.dateTime ?? "Unknown",
    }));
}

// 2. Find events on a specific date (Bangladesh time, UTC+06:00)
export async function findCalendarEventsByDate(
    date: string,
): Promise<CalendarEvent[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("Date must use YYYY-MM-DD format.");
    }

    const auth = await createCalendarAuth();

    const calendar = google.calendar({
        version: "v3",
        auth,
    });

    const timeMin = new Date(`${date}T00:00:00+06:00`);
    const timeMax = new Date(`${date}T00:00:00+06:00`);
    timeMax.setUTCDate(timeMax.getUTCDate() + 1);

    const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
    });

    return (response.data.items ?? []).map((event) => ({
        summary: event.summary ?? "(No title)",
        start: event.start?.date ?? event.start?.dateTime ?? "Unknown",
        end: event.end?.date ?? event.end?.dateTime ?? "Unknown",
    }));
}

// 3. Create a calendar event
export async function createCalendarEvent(input: NewCalendarEvent) {
    const auth = await createCalendarAuth();

    const calendar = google.calendar({
        version: "v3",
        auth,
    });

    const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
            summary: input.summary,
            description: input.description,
            location: input.location,
            start: {
                dateTime: input.start,
            },
            end: {
                dateTime: input.end,
            },
        },
    });

    return {
        id: response.data.id,
        summary: response.data.summary,
        start:
            response.data.start?.dateTime ?? response.data.start?.date ?? "Unknown",
        end: response.data.end?.dateTime ?? response.data.end?.date ?? "Unknown",
        htmlLink: response.data.htmlLink,
    };
}
