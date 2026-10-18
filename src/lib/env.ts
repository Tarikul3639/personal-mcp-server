import "server-only";
import { z } from "zod";

const envSchema = z.object({
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_PROJECT_ID: z.string().min(1),
    GOOGLE_AUTH_URI: z.string().url(),
    GOOGLE_TOKEN_URI: z.string().url(),
    GOOGLE_AUTH_PROVIDER_CERT_URL: z.string().url(),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URIS: z.string().url(),
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
