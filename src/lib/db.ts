import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function saveGoogleTokens(tokens: object) {
    await sql`
    INSERT INTO google_tokens (id, tokens)
    VALUES (1, ${JSON.stringify(tokens)}::jsonb)
    ON CONFLICT (id)
    DO UPDATE SET tokens = EXCLUDED.tokens
  `;
}

export async function getGoogleTokens() {
    const rows = await sql`
    SELECT tokens FROM google_tokens WHERE id = 1
  `;
    return rows[0]?.tokens;
}
