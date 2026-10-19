
CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
  client_id TEXT PRIMARY KEY,
  client_secret TEXT,
  redirect_uris JSONB NOT NULL DEFAULT '[]',
  client_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mcp_authorization_codes (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES mcp_oauth_clients(client_id)
    ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL DEFAULT 'S256',
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mcp_access_tokens (
  token_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES mcp_oauth_clients(client_id)
    ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_calendar_credentials (
  id BIGINT PRIMARY KEY,
  tokens JSONB NOT NULL,
  email TEXT,
  name TEXT,
  picture TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_calendar_accounts (
  user_id TEXT PRIMARY KEY,
  tokens JSONB NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Preserve the existing single-account connection when upgrading to per-user accounts.
INSERT INTO google_calendar_accounts (user_id, tokens, email, name, picture, updated_at)
SELECT lower(email), tokens, email, name, picture, updated_at
FROM google_calendar_credentials
WHERE email IS NOT NULL AND email <> ''
ON CONFLICT (user_id) DO NOTHING;
