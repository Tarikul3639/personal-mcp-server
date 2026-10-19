# Personal MCP Server

A personal Model Context Protocol (MCP) server built with Next.js that
connects compatible AI clients to Google Calendar.

![Personal MCP Server homepage](public/tarikuls-mcp.png)

## Features

- Google OAuth login
- List upcoming calendar events
- Create, find, retrieve, update, and delete events
- Event options for description, location, color, attendees,
  reminders, visibility, transparency, and recurrence

## Website

- Website: https://tarikuls-mcp.vercel.app
- MCP endpoint: https://tarikuls-mcp.vercel.app/api/mcp

Use the website's **Login with Google** flow to authorize access. The
homepage screenshot is stored at `public/tarikuls-mcp.png`.

## Environment variables

Create a `.env.local` file in the project root and provide your own
credentials:

```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URIS="http://localhost:3000/api/auth/callback"
GOOGLE_AUTH_URL="http://localhost:3000/api/auth/login"
DATABASE_URL="your_neon_postgresql_connection_string"
```

Replace the placeholders with your actual values. Never commit
`.env.local`, OAuth secrets, database credentials, or access/refresh
tokens to Git. Keep `DATABASE_URL` server-side only.

For production, configure these variables in your hosting provider and
use the production login and callback URLs. Add the exact callback URL
to the authorized redirect URIs in Google Cloud Console.

## Getting started

Requirements: Node.js, pnpm, Google OAuth credentials, and a Neon
PostgreSQL database.

Install dependencies:

```bash
pnpm install
```

Run locally:

```bash
pnpm dev
```

Open <http://localhost:3000> and log in with Google.

Build:

```bash
pnpm run build
```

## Connect an MCP client

Configure your MCP client to use this endpoint:

```text
https://tarikuls-mcp.vercel.app/api/mcp
```

To inspect the available tools, run:

```bash
pnpm dlx @modelcontextprotocol/inspector
```

Enter the endpoint in the Inspector UI and check the **Tools** tab.

## Google OAuth setup

1.  Select or create a project in Google Cloud Console.
2.  Enable the Google Calendar API.
3.  Configure the OAuth consent screen.
4.  Create an OAuth client ID.
5.  Add the app's exact callback URL to authorized redirect URIs.
6.  Set the environment variables locally and in production.

## Security

- Never expose `GOOGLE_CLIENT_SECRET` or `DATABASE_URL` to client-side
  code.
- Never commit real credentials or tokens.
- Use HTTPS for production OAuth callbacks.
- If credentials are exposed, rotate them immediately.

## License

Add a `LICENSE` file if you intend to publish this project under an
open-source license.
