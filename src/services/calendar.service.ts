import { google, calendar_v3 } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

export type CalendarEvent = calendar_v3.Schema$Event;

type CreateEventInput = {
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  colorId?: string;
  attendees?: calendar_v3.Schema$EventAttendee[];
  reminders?: {
    useDefault?: boolean;
    overrides?: calendar_v3.Schema$EventReminder[];
  };
  visibility?: "default" | "public" | "private" | "confidential";
  transparency?: "opaque" | "transparent";
  recurrence?: string[];
};

export async function listCalendarEvents(userId: string): Promise<CalendarEvent[]> {
  const auth = await getGoogleAuth(userId);

  const { data } = await google.calendar({ version: "v3", auth }).events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return data.items ?? [];
}

export async function createCalendarEvent(
  userId: string,
  input: CreateEventInput,
): Promise<CalendarEvent> {
  const auth = await getGoogleAuth(userId);
  const { start, end, ...details } = input;

  const { data } = await google
    .calendar({ version: "v3", auth })
    .events.insert({
      calendarId: "primary",
      requestBody: {
        ...details,
        start: { dateTime: start },
        end: { dateTime: end },
      },
    });

  return data;
}

export async function findCalendarEventsByDate(
  userId: string,
  date: string,
): Promise<CalendarEvent[]> {
  const events = await listCalendarEvents(userId);

  return events.filter((event) => {
    const start = event.start?.dateTime ?? event.start?.date;
    return start?.startsWith(date);
  });
}

export async function getCalendarEvent(
  userId: string,
  eventId: string,
): Promise<CalendarEvent> {
  const auth = await getGoogleAuth(userId);

  const { data } = await google.calendar({ version: "v3", auth }).events.get({
    calendarId: "primary",
    eventId,
  });

  return data;
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  updates: Partial<CreateEventInput>,
): Promise<CalendarEvent> {
  const auth = await getGoogleAuth(userId);
  const { start, end, ...details } = updates;

  const requestBody: calendar_v3.Schema$Event = {
    ...details,
    ...(start !== undefined ? { start: { dateTime: start } } : {}),
    ...(end !== undefined ? { end: { dateTime: end } } : {}),
  };

  const { data } = await google.calendar({ version: "v3", auth }).events.patch({
    calendarId: "primary",
    eventId,
    requestBody,
  });

  return data;
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
  const auth = await getGoogleAuth(userId);

  await google.calendar({ version: "v3", auth }).events.delete({
    calendarId: "primary",
    eventId,
  });
}
