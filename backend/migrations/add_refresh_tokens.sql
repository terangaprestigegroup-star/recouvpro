CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  token_hash  VARCHAR(128) UNIQUE NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_merchant ON refresh_tokens(merchant_id);
CREATE INDEX IF NOT EXISTS idx_refresh_hash     ON refresh_tokens(token_hash);
