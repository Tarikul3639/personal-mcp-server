import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function saveGoogleTokens(
  tokens: object,
  user: {
    name: string;
    email: string;
    picture: string | null;
  },
) {
  await sql`
    INSERT INTO google_tokens (id, tokens, name, email, picture)
    VALUES (
      1,
      ${JSON.stringify(tokens)}::jsonb,
      ${user.name},
      ${user.email},
      ${user.picture}
    )
    ON CONFLICT (id)
    DO UPDATE SET
      tokens = EXCLUDED.tokens,
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      picture = EXCLUDED.picture
  `;
}

export async function getGoogleTokens() {
  const rows = await sql`
    SELECT tokens
    FROM google_tokens
    WHERE id = 1
  `;

  return rows[0]?.tokens;
}

export async function getGoogleProfile() {
  const rows = await sql`
    SELECT name, email, picture
    FROM google_tokens
    WHERE id = 1
  `;

  return rows[0] ?? null;
}