ALTER TABLE creances
  ADD COLUMN IF NOT EXISTS recovered_via VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS due_date      DATE        DEFAULT NULL;

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

CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_at)
  WHERE sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminders_creance ON reminders(creance_id);
