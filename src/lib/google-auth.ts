import { google } from "googleapis";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TOKEN_DIR = path.join(process.cwd(), ".tokens");
const TOKEN_FILE = path.join(TOKEN_DIR, "google-calendar.json");

export const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URIS!.split(",")[0],
);

export function getGoogleAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: ["https://www.googleapis.com/auth/calendar"],
    });
}

export async function handleGoogleCallback(code: string) {
    const { tokens } = await oauth2Client.getToken(code);

    await mkdir(TOKEN_DIR, { recursive: true });
    await writeFile(TOKEN_FILE, JSON.stringify(tokens), { mode: 0o600 });

    return tokens;
}

export async function getGoogleAuth() {
    try {
        const tokens = JSON.parse(await readFile(TOKEN_FILE, "utf8"));

        oauth2Client.setCredentials(tokens);
        return oauth2Client;
    } catch {
        throw new Error(
            "Google Calendar not connected. Please connect your Google account first. Visit /api/auth/login to connect.",
        );
    }
}
