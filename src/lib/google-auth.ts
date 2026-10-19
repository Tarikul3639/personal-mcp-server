import "server-only";
import { google } from "googleapis";
import { env } from "@/lib/env";
import { saveGoogleTokens, getGoogleTokens } from "@/lib/db";

export function createGoogleOAuthClient() {
    return new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URIS.split(",")[0],
    );
}

export function getGoogleAuthUrl(state: string) {
    return createGoogleOAuthClient().generateAuthUrl({
        access_type: "offline",
        prompt: "select_account consent",
        state,
        scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar",
        ],
    });
}

export async function handleGoogleCallback(code: string) {
    const oauth2Client = createGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
        version: "v2",
        auth: oauth2Client,
    });

    const { data } = await oauth2.userinfo.get();

    await saveGoogleTokens(tokens, {
        name: data.name ?? data.email ?? "Google User",
        email: data.email ?? "",
        picture: data.picture ?? null,
    });

    return {
        email: data.email?.trim().toLowerCase() ?? "",
        name: data.name ?? data.email ?? "Google User",
        picture: data.picture ?? null,
    };
}

export async function getGoogleAuth(userId: string) {
    const tokens = await getGoogleTokens(userId);

    if (!tokens) {
        throw new Error(
            `Google account is not connected. Visit ${env.MCP_BASE_URL}/dashboard to connect your Google account.`,
        );
    }

    const oauth2Client = createGoogleOAuthClient();
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
}
