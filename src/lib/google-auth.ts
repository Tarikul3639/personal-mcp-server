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
        scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar",
        ],
    });
}

export async function handleGoogleCallback(code: string) {
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

    return tokens;
}

export async function getGoogleAuth() {
    const tokens = await getGoogleTokens();

    oauth2Client.setCredentials(tokens);

    return oauth2Client;
}

export async function getGoogleUser() {
    const auth = await getGoogleAuth();
    const oauth2 = google.oauth2({ version: "v2", auth });

    const { data } = await oauth2.userinfo.get();

    return {
        name: data.name ?? data.email ?? "Google User",
        email: data.email ?? "",
        picture: data.picture ?? null,
    };
}
