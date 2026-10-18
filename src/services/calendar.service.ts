import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import path from "node:path";

export interface CalendarEvent {
    summary: string;
    start: string;
    end: string;
}

const CREDENTIALS_PATH = path.resolve(
    process.cwd(),
    "src/credentials/google-oauth-client.json",
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

export async function createCalendarAuth() {
    return authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
    console.error("1. Starting calendar auth...");

    const auth = await createCalendarAuth();

    console.error("2. Calendar auth completed!");

    const calendar = google.calendar({
        version: "v3",
        auth,
    });

    console.error("3. Requesting calendar events...");

    const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
    });

    console.error("4. Calendar events received!");

    return (response.data.items ?? []).map((event) => ({
        summary: event.summary ?? "(No title)",
        start: event.start?.date ?? event.start?.dateTime ?? "Unknown",
        end: event.end?.date ?? event.end?.dateTime ?? "Unknown"
    }))
}
