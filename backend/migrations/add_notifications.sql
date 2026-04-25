CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  creance_id  INTEGER REFERENCES creances(id)  ON DELETE CASCADE,
  type        VARCHAR(30) DEFAULT 'relance_auto',
  message     TEXT,
  wa_link     TEXT,
  lu          BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_merchant ON notifications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_notifs_lu       ON notifications(lu);
