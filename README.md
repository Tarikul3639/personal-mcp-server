# Personal MCP Server

A TypeScript MCP server that exposes personal productivity tools over stdio.

## Current tools

- `ping` - verifies that the MCP server is running.
- `listCalendarEvents` - returns the next 10 upcoming events from the
  authenticated user's primary Google Calendar.

## Requirements

- Node.js 20 or newer
- pnpm 12
- A desktop browser for the Google OAuth consent flow
- A Google Cloud project with the Google Calendar API enabled

## Install

```bash
pnpm install
```

## Google Calendar setup

1. In Google Cloud Console, enable the **Google Calendar API** for your
   project.
2. Create an OAuth client with application type **Desktop app**.
3. Download the OAuth client JSON file.
4. Save it as:

   ```text
   src/credentials/google-oauth-client.json
   ```

   The file must contain an `installed` object and a localhost redirect URI,
   for example `"http://localhost"`.

Do not commit the credentials file, client secret, access token, or refresh
token to source control.

## Run

For development, with automatic restart on source changes:

```bash
pnpm run start:dev
```

For a normal run:

```bash
pnpm start
```

The server communicates over stdio. It should be started by an MCP client or
MCP Inspector rather than opened as a regular HTTP server.

On the first calendar request, Google OAuth opens a browser window. If the
browser does not open automatically, specify the browser executable:

```bash
BROWSER=/usr/bin/google-chrome pnpm run start:dev
```

For an MCP client configuration, set the same environment variable in the
server's environment:

```json
{
  "env": {
    "BROWSER": "/usr/bin/google-chrome"
  }
}
```

Use `command -v google-chrome` to find the correct path on Linux. After
granting access, Google redirects to a temporary localhost callback and the
tool returns the calendar events.

## Build

```bash
pnpm run build
```

Compiled files are written to `build/`.

## Troubleshooting

### `listCalendarEvents` keeps loading

The calendar tool waits for the Google OAuth callback. Check the following:

1. The credentials file exists at
   `src/credentials/google-oauth-client.json`.
2. The JSON is a Desktop/Installed application credential.
3. The Google Calendar API is enabled.
4. A browser is available to the same desktop session as the MCP server.
5. The browser is explicitly configured if automatic launching fails:

   ```bash
   BROWSER=/usr/bin/google-chrome pnpm run start:dev
   ```

Approve the requested Calendar read-only permission and wait for the browser
to display the successful authentication page.

### No events are returned

The tool queries the `primary` calendar for events starting from the current
time, with a maximum of 10 results, ordered by start time. Confirm that the
Google account used during OAuth has upcoming events in its primary calendar.
