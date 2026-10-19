
import "server-only";
import { Pool } from "pg";
import type { Credentials } from "google-auth-library";
import { env } from "@/lib/env";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

type GoogleUser = {
  name: string;
  email: string;
  picture: string | null;
};

export async function saveGoogleTokens(
  tokens: Credentials,
  user: GoogleUser,
): Promise<void> {
  const userId = user.email.trim().toLowerCase();
  if (!userId) throw new Error("Google did not provide an account email.");
  const existing = await getGoogleTokens(userId);

  const mergedTokens: Credentials = {
    ...existing,
    ...tokens,
    refresh_token: tokens.refresh_token ?? existing?.refresh_token,
  };

  await pool.query(
    `INSERT INTO google_calendar_accounts
      (user_id, tokens, name, email, picture, updated_at)
     VALUES ($1, $2::jsonb, $3, $4, $5, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       tokens = EXCLUDED.tokens,
       name = EXCLUDED.name,
       email = EXCLUDED.email,
       picture = EXCLUDED.picture,
       updated_at = NOW()`,
    [
      userId,
      JSON.stringify(mergedTokens),
      user.name,
      user.email,
      user.picture,
    ],
  );
}

export async function getGoogleTokens(userId: string): Promise<Credentials | null> {
  const { rows } = await pool.query(
    `SELECT tokens
     FROM google_calendar_accounts
     WHERE user_id = $1`,
    [userId.trim().toLowerCase()],
  );

  return (rows[0]?.tokens as Credentials | undefined) ?? null;
}

export async function getGoogleProfile(userId: string): Promise<GoogleUser | null> {
  const { rows } = await pool.query(
    `SELECT name, email, picture
     FROM google_calendar_accounts
     WHERE user_id = $1`,
    [userId.trim().toLowerCase()],
  );

  return (rows[0] as GoogleUser | undefined) ?? null;
}

export type OAuthClient = {
  client_id: string;
  redirect_uris: string[];
  client_name: string | null;
};

export async function saveOAuthClient(clientId: string, redirectUris: string[], clientName: string | null) {
  await pool.query(
    `INSERT INTO mcp_oauth_clients (client_id, redirect_uris, client_name)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (client_id) DO NOTHING`,
    [clientId, JSON.stringify(redirectUris), clientName],
  );
}

export async function getOAuthClient(clientId: string): Promise<OAuthClient | null> {
  const { rows } = await pool.query(
    `SELECT client_id, redirect_uris, client_name FROM mcp_oauth_clients WHERE client_id = $1`,
    [clientId],
  );
  return (rows[0] as OAuthClient | undefined) ?? null;
}

export async function createAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  userId: string;
}) {
  await pool.query(`DELETE FROM mcp_authorization_codes WHERE expires_at <= NOW()`);
  await pool.query(
    `INSERT INTO mcp_authorization_codes
      (code, client_id, redirect_uri, code_challenge, code_challenge_method, user_id, expires_at)
     VALUES ($1, $2, $3, $4, 'S256', $5, NOW() + INTERVAL '5 minutes')`,
    [input.code, input.clientId, input.redirectUri, input.codeChallenge, input.userId],
  );
}

export async function consumeAuthorizationCode(input: { code: string; clientId: string; redirectUri: string; challenge: string }) {
  const { rows } = await pool.query(
    `DELETE FROM mcp_authorization_codes
     WHERE code = $1 AND client_id = $2 AND redirect_uri = $3
       AND code_challenge = $4 AND code_challenge_method = 'S256'
       AND expires_at > NOW()
     RETURNING client_id, redirect_uri, code_challenge, code_challenge_method, user_id`,
    [input.code, input.clientId, input.redirectUri, input.challenge],
  );
  return rows[0] as {
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: string;
    user_id: string;
  } | undefined;
}

export async function disconnectGoogleAccount(userId: string) {
  await pool.query(`DELETE FROM google_calendar_accounts WHERE user_id = $1`, [userId.trim().toLowerCase()]);
}

export async function checkDatabase(): Promise<void> {
  await pool.query("SELECT 1");
}
