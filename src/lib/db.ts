
import "server-only";
import { createHash } from "node:crypto";
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

export type McpClientAccess = {
  client_id: string;
  client_name: string | null;
  granted_at: Date;
  revoked_at: Date | null;
};

export async function ensureMcpClientGrant(
  userId: string,
  clientId: string,
): Promise<boolean> {
  const normalizedUserId = userId.trim().toLowerCase();
  await pool.query(
    `INSERT INTO mcp_oauth_grants (user_id, client_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, client_id) DO NOTHING`,
    [normalizedUserId, clientId],
  );
  const { rows } = await pool.query(
    `SELECT revoked_at FROM mcp_oauth_grants
     WHERE user_id = $1 AND client_id = $2`,
    [normalizedUserId, clientId],
  );
  return rows.length > 0 && rows[0].revoked_at === null;
}

export async function hasActiveMcpClientGrant(
  userId: string,
  clientId: string,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM mcp_oauth_grants
     WHERE user_id = $1 AND client_id = $2 AND revoked_at IS NULL`,
    [userId.trim().toLowerCase(), clientId],
  );
  return (rowCount ?? 0) > 0;
}

export async function listMcpClientAccess(
  userId: string,
): Promise<McpClientAccess[]> {
  const { rows } = await pool.query(
    `SELECT g.client_id, c.client_name, g.created_at AS granted_at,
            g.revoked_at
     FROM mcp_oauth_grants g
     JOIN mcp_oauth_clients c ON c.client_id = g.client_id
     WHERE g.user_id = $1
     ORDER BY g.created_at DESC`,
    [userId.trim().toLowerCase()],
  );
  return rows as McpClientAccess[];
}

export async function restoreMcpClientAccess(
  userId: string,
  clientId: string,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE mcp_oauth_grants SET revoked_at = NULL
     WHERE user_id = $1 AND client_id = $2 AND revoked_at IS NOT NULL`,
    [userId.trim().toLowerCase(), clientId],
  );
  return (rowCount ?? 0) > 0;
}

export async function revokeMcpClientAccess(
  userId: string,
  clientId: string,
): Promise<boolean> {
  const client = await pool.connect();
  const normalizedUserId = userId.trim().toLowerCase();

  try {
    await client.query("BEGIN");
    const { rowCount } = await client.query(
      `UPDATE mcp_oauth_grants SET revoked_at = NOW()
       WHERE user_id = $1 AND client_id = $2 AND revoked_at IS NULL`,
      [normalizedUserId, clientId],
    );
    if (!rowCount) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(
      `DELETE FROM mcp_refresh_tokens WHERE user_id = $1 AND client_id = $2`,
      [normalizedUserId, clientId],
    );
    await client.query(
      `DELETE FROM mcp_authorization_codes WHERE user_id = $1 AND client_id = $2`,
      [normalizedUserId, clientId],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function revokeAllMcpClientAccess(userId: string): Promise<void> {
  const client = await pool.connect();
  const normalizedUserId = userId.trim().toLowerCase();

  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE mcp_oauth_grants SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [normalizedUserId],
    );
    await client.query(
      `DELETE FROM mcp_refresh_tokens WHERE user_id = $1`,
      [normalizedUserId],
    );
    await client.query(
      `DELETE FROM mcp_authorization_codes WHERE user_id = $1`,
      [normalizedUserId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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

export async function saveMcpRefreshToken(input: {
  token: string;
  clientId: string;
  userId: string;
  familyId: string;
}): Promise<void> {
  const tokenHash = createHash("sha256").update(input.token).digest("hex");
  await pool.query(
    `INSERT INTO mcp_refresh_tokens
      (token_hash, client_id, user_id, family_id)
     VALUES ($1, $2, $3, $4)`,
    [tokenHash, input.clientId, input.userId.trim().toLowerCase(), input.familyId],
  );
}

export async function rotateMcpRefreshToken(input: {
  currentTokenHash: string;
  nextToken: string;
  clientId: string;
}): Promise<{ userId: string } | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT user_id, family_id, used_at, expires_at
       FROM mcp_refresh_tokens
       WHERE token_hash = $1 AND client_id = $2
       FOR UPDATE`,
      [input.currentTokenHash, input.clientId],
    );
    const current = rows[0] as {
      user_id: string;
      family_id: string;
      used_at: Date | null;
      expires_at: Date | null;
    } | undefined;

    if (!current) {
      await client.query("COMMIT");
      return null;
    }

    if (
      current.used_at ||
      (current.expires_at && current.expires_at.getTime() <= Date.now())
    ) {
      await client.query(
        `DELETE FROM mcp_refresh_tokens WHERE family_id = $1`,
        [current.family_id],
      );
      await client.query("COMMIT");
      return null;
    }

    const nextTokenHash = createHash("sha256")
      .update(input.nextToken)
      .digest("hex");

    await client.query(
      `UPDATE mcp_refresh_tokens SET used_at = NOW() WHERE token_hash = $1`,
      [input.currentTokenHash],
    );
    await client.query(
      `INSERT INTO mcp_refresh_tokens
        (token_hash, client_id, user_id, family_id)
       VALUES ($1, $2, $3, $4)`,
      [nextTokenHash, input.clientId, current.user_id, current.family_id],
    );
    await client.query("COMMIT");

    return { userId: current.user_id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function disconnectGoogleAccount(userId: string) {
  await pool.query(`DELETE FROM google_calendar_accounts WHERE user_id = $1`, [userId.trim().toLowerCase()]);
}

export async function checkDatabase(): Promise<void> {
  await pool.query("SELECT 1");
}
