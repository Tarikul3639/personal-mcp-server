
import "server-only";
import { z } from "zod";

const envSchema = z.object({
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URIS: z.string().url(),
    GOOGLE_AUTH_URL: z.string().url(),

    DATABASE_URL: z.string().min(1),

    MCP_AUTH_SECRET: z.string().min(32),
    MCP_BASE_URL: z.string().url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error(
        "Invalid environment variables:",
        result.error.flatten().fieldErrors,
    );

    throw new Error("Environment validation failed");
}

export const env = result.data;
