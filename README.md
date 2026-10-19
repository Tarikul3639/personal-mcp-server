# Personal MCP Server

A remote [Model Context Protocol](https://modelcontextprotocol.io/) server that lets compatible AI assistants work with Google Calendar. Each person connects their own Google account and signs in with that account when connecting an MCP client.

![Personal MCP Server homepage](public/tarikuls-mcp.png)

![Personal dashboard showing account and connection status](public/dashboard.png)

## Pages and links

- Website: <https://tarikuls-mcp.vercel.app>
- Dashboard: <https://tarikuls-mcp.vercel.app/dashboard>
- System documentation: <https://tarikuls-mcp.vercel.app/docs>
- Remote MCP endpoint: <https://tarikuls-mcp.vercel.app/api/mcp>
- Created by: <https://tarikul-islam.me/>

The homepage introduces the service and shows the MCP endpoint. The dashboard shows your Google account and connection status. The `/docs` page explains the connection and security flow.

## How it works

1. Sign in from the dashboard with Google and grant the server Google Calendar access.
2. Add the `/api/mcp` endpoint to an MCP client that supports Streamable HTTP and OAuth discovery.
3. When prompted, sign in with the Google account whose calendar you want to use.
4. The server uses the signed-in account and redirects the client back automatically.
5. Ask the AI assistant to use the Calendar tools.

You and a friend can use the same server URL with separate Google accounts. Credentials are stored per account, and each access token is tied to the Google account that signed in. One user’s access token cannot read another user’s calendar.

### Available tools

- `listCalendarEvents` — list the next 10 upcoming events.
- `findCalendarEventsByDate` — find an event date among those upcoming events.
- `getCalendarEvent` — retrieve an event by ID.
- `createCalendarEvent` — create an event, including attendees, reminders, recurrence, and other event options.
- `updateCalendarEvent` — update an existing event.
- `deleteCalendarEvent` — delete an event by ID.
- `ping` — check that the server is responding.

## Run locally

Requirements: Node.js, pnpm, a Google OAuth client, and a PostgreSQL database. This project uses Neon PostgreSQL by default.

Install dependencies and create `.env.local` in the project root:

```bash
pnpm install
```

```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URIS="http://localhost:3000/api/auth/callback"
GOOGLE_AUTH_URL="http://localhost:3000/api/auth/login"
DATABASE_URL="your_postgresql_connection_string"
MCP_AUTH_SECRET="use-at-least-32-random-characters"
MCP_BASE_URL="http://localhost:3000"
```

Initialize or upgrade the database schema, then start the app:

```bash
pnpm db:setup
pnpm dev
```

Open <http://localhost:3000>. The schema setup migrates an existing single-account Calendar connection into the per-account table. Keep `.env.local`, OAuth secrets, database credentials, and access or refresh tokens out of Git. `DATABASE_URL` and `MCP_AUTH_SECRET` must remain server-side.

Build the project with:

```bash
pnpm run build
```

## Google OAuth setup

1. Create or select a project in Google Cloud Console.
2. Enable the Google Calendar API.
3. Configure the OAuth consent screen and create a Web application OAuth client.
4. Add the exact callback URL to the authorized redirect URIs. Locally this is `http://localhost:3000/api/auth/callback`; in production use your HTTPS domain.
5. Set the environment variables above locally and in your hosting provider. Set `MCP_BASE_URL` to the public origin of the deployment.

## Connect a remote MCP client

Configure the client to use your server’s MCP endpoint:

```text
https://your-domain.example/api/mcp
```

The server publishes OAuth discovery metadata. An MCP client uses that to open the Google sign-in flow. After sign-in, the server issues an authorization code automatically. To inspect the endpoint during development, run:

```bash
pnpm dlx @modelcontextprotocol/inspector
```

Before deploying persistent client grants and refresh-token support, apply `src/sql/schema.sql` to the production database (or run `pnpm db:setup` with its `DATABASE_URL`). Recreate the ChatGPT connector after deployment so it reloads OAuth metadata and requests `offline_access`.

OAuth authorization uses PKCE (S256). Authorization codes expire after five minutes and MCP access tokens expire after 15 minutes. Refresh tokens rotate each time they are used and stay active until the user revokes the client or disconnects Google Calendar. ChatGPT can renew access in the background without asking you to sign in again. Authorization uses the Google account connected to the current signed-in session; there is no separate MCP client approval page.

## Accounts and access

- Each Google account has its own Calendar credentials and profile record.
- Every Calendar tool call uses the account identity from the verified MCP access token.
- Google sign-in identifies the account, and Google’s Calendar permission grants the server access to that account’s calendar.
- The first connection creates a persistent grant for that Google account and MCP client. The dashboard lists each client and can revoke its grant; revocation blocks existing access tokens and removes refresh tokens.
- The dashboard shows the registered MCP client name, not the specific AI model using that client.
- Google credentials stay on the server and are not sent to the browser or MCP client.
- Dashboard sessions use signed, HttpOnly, SameSite cookies and expire after 12 hours.
- MCP refresh tokens are stored as hashes, rotate on use, and are revoked when Calendar is disconnected.
- Disconnecting Calendar removes that account’s saved credentials and attempts to revoke its Google token.
- Anyone who can reach the public website can sign in and connect their own Google account. There is no invite-only email allowlist; users cannot access another account’s Calendar without that account’s authorization.

Use HTTPS in production. If any credentials are exposed, revoke or rotate them immediately.
