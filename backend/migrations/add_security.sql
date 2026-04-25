CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE SET NULL,
  session_id  UUID,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(30),
  target_id   INTEGER,
  metadata    JSONB,
  ip          VARCHAR(45),
  user_agent  VARCHAR(300),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_merchant ON audit_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_audit_action   ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  id         SERIAL PRIMARY KEY,
  key        VARCHAR(200) UNIQUE NOT NULL,
  count      INTEGER DEFAULT 1,
  window_end TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ratelimit_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_ratelimit_end ON rate_limits(window_end);

ALTER TABLE abonnements
  ADD COLUMN IF NOT EXISTS verified_signature BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS raw_payload        JSONB;

ALTER TABLE creances
  ADD COLUMN IF NOT EXISTS relances_today  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_relance_at TIMESTAMP;
