import { authenticate } from "@google-cloud/local-auth";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const CREDENTIALS_PATH = path.resolve(
    "src/credentials/google-oauth-client.json",
);

const TOKEN_PATH = path.resolve("src/credentials/google-token.json");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

async function main() {
    const auth = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });

    await writeFile(TOKEN_PATH, JSON.stringify(auth.credentials, null, 2), {
        mode: 0o600, // File permissions: read/write for owner only
    });

    console.error("Google Calendar authorization successful!");
    console.error("Token saved to:", TOKEN_PATH);
}

main().catch((error) => {
    console.error("Authorization failed:", error);
    process.exitCode = 1;
});
