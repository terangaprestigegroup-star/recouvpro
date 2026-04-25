CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   VARCHAR(200),
  created_at  TIMESTAMP DEFAULT NOW(),
  expires_at  TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

CREATE TABLE IF NOT EXISTS merchants (
  id          SERIAL PRIMARY KEY,
  session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL,
  phone       VARCHAR(20) UNIQUE,
  email       VARCHAR(100) UNIQUE,
  shop_name   VARCHAR(100),
  plan        VARCHAR(10) DEFAULT 'free',
  otp_code    VARCHAR(6),
  otp_expires TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id          SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(20),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creances (
  id               SERIAL PRIMARY KEY,
  merchant_id      INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  session_id       UUID REFERENCES sessions(id) ON DELETE CASCADE,
  client_id        INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  client_name      VARCHAR(100),
  montant_initial  INTEGER NOT NULL,
  montant_restant  INTEGER NOT NULL,
  statut           VARCHAR(20) DEFAULT 'actif',
  description      VARCHAR(200),
  recovered_via    VARCHAR(20) DEFAULT NULL,
  due_date         DATE DEFAULT NULL,
  relances_today   INTEGER DEFAULT 0,
  last_relance_at  TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paiements (
  id         SERIAL PRIMARY KEY,
  creance_id INTEGER REFERENCES creances(id) ON DELETE CASCADE,
  montant    INTEGER NOT NULL,
  note       VARCHAR(200),
  paid_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relances (
  id         SERIAL PRIMARY KEY,
  creance_id INTEGER REFERENCES creances(id) ON DELETE CASCADE,
  type       VARCHAR(20) DEFAULT 'whatsapp',
  sent_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS abonnements (
  id                  SERIAL PRIMARY KEY,
  merchant_id         INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  paydunya_ref        VARCHAR(100),
  debut               DATE,
  fin                 DATE,
  statut              VARCHAR(20) DEFAULT 'actif',
  verified_signature  BOOLEAN DEFAULT FALSE,
  raw_payload         JSONB
);

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  creance_id  INTEGER REFERENCES creances(id) ON DELETE CASCADE,
  type        VARCHAR(30) DEFAULT 'relance_auto',
  message     TEXT,
  wa_link     TEXT,
  lu          BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id           SERIAL PRIMARY KEY,
  creance_id   INTEGER REFERENCES creances(id) ON DELETE CASCADE,
  merchant_id  INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  type         VARCHAR(10) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  sent         BOOLEAN DEFAULT FALSE,
  sent_at      TIMESTAMP,
  message      TEXT,
  wa_link      TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS rate_limits (
  id         SERIAL PRIMARY KEY,
  key        VARCHAR(200) UNIQUE NOT NULL,
  count      INTEGER DEFAULT 1,
  window_end TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  token_hash  VARCHAR(128) UNIQUE NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creances_merchant    ON creances(merchant_id);
CREATE INDEX IF NOT EXISTS idx_creances_session     ON creances(session_id);
CREATE INDEX IF NOT EXISTS idx_creances_statut      ON creances(statut);
CREATE INDEX IF NOT EXISTS idx_clients_merchant     ON clients(merchant_id);
CREATE INDEX IF NOT EXISTS idx_relances_creance     ON relances(creance_id);
CREATE INDEX IF NOT EXISTS idx_abonnements_merchant ON abonnements(merchant_id);
CREATE INDEX IF NOT EXISTS idx_notifs_merchant      ON notifications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled  ON reminders(scheduled_at) WHERE sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_merchant       ON audit_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ratelimit_key        ON rate_limits(key);
