-- ============================================================
-- MIGRATION : Secteurs + Statuts Blueprint V1.0
-- Coller dans Railway → PostgreSQL → Query
-- ============================================================

-- Champ secteur sur creances et merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS secteur    VARCHAR(30) DEFAULT 'autre',
  ADD COLUMN IF NOT EXISTS shop_name  VARCHAR(100);

ALTER TABLE creances
  ADD COLUMN IF NOT EXISTS secteur    VARCHAR(30) DEFAULT 'autre';

-- Mise à jour statuts selon Blueprint V1.0
-- Nouvelle | Relancée | Paiement promis | Partiellement payée | Payée | Annulée
-- Migrer les anciens statuts
UPDATE creances SET statut = 'payee'   WHERE statut = 'solde';
UPDATE creances SET statut = 'nouvelle' WHERE statut = 'actif';

-- Contrainte statuts valides
ALTER TABLE creances DROP CONSTRAINT IF EXISTS creances_statut_check;
ALTER TABLE creances ADD CONSTRAINT creances_statut_check
  CHECK (statut IN (
    'nouvelle',
    'relancee',
    'paiement_promis',
    'partiellement_payee',
    'payee',
    'annulee'
  ));

-- Plan annuel sur abonnements
ALTER TABLE abonnements
  ADD COLUMN IF NOT EXISTS type_plan VARCHAR(20) DEFAULT 'mensuel';
-- mensuel (2500 FCFA) | annuel (27500 FCFA)

-- Index secteur pour stats par métier
CREATE INDEX IF NOT EXISTS idx_creances_secteur  ON creances(secteur);
CREATE INDEX IF NOT EXISTS idx_merchants_secteur ON merchants(secteur);
