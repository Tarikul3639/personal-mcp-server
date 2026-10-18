import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const auth = await getGoogleAuth();

  const response = await google
    .calendar({
      version: "v3",
      auth,
    })
    .events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

  return (response.data.items ?? []).map((event) => ({
    summary: event.summary ?? "(No title)",
    start: event.start?.dateTime ?? event.start?.date ?? "Unknown",
    end: event.end?.dateTime ?? event.end?.date ?? "Unknown",
  }));
}

export async function createCalendarEvent({
  summary,
  start,
  end,
  description,
  location,
}: {
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}): Promise<CalendarEvent> {
  const auth = await getGoogleAuth();

  const response = await google
    .calendar({
      version: "v3",
      auth,
    })
    .events.insert({
      calendarId: "primary",
      requestBody: {
        summary,
        description,
        location,
        start: { dateTime: start },
        end: { dateTime: end },
      },
    });

  const event = response.data;

  return {
    summary: event.summary ?? "(No title)",
    start: event.start?.dateTime ?? event.start?.date ?? "Unknown",
    end: event.end?.dateTime ?? event.end?.date ?? "Unknown",
  };
}

export async function findCalendarEventsByDate(
  date: string,
): Promise<CalendarEvent[]> {
  const events = await listCalendarEvents();
  return events.filter((event) => event.start.startsWith(date));
}
