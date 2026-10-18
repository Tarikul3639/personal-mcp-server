import { google } from "googleapis";
import { saveGoogleTokens, getGoogleTokens } from "@/lib/db";

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

    await saveGoogleTokens(tokens);
    return tokens;
}

export async function getGoogleAuth() {
    try {
        const tokens = await getGoogleTokens();

        oauth2Client.setCredentials(tokens);
        return oauth2Client;
    } catch {
        throw new Error(
            `Google Calendar not connected. Connect your account here: ${process.env.GOOGLE_AUTH_URL}`,
        );
    }
}
