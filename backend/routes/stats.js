const express = require('express');
const pool    = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const mid = req.merchantId;
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(SUM(montant_restant)
          FILTER (WHERE statut='actif'),0)               AS total_pending,
        COALESCE(SUM(montant_initial-montant_restant)
          FILTER (WHERE statut='solde'),0)               AS total_recovered,
        COALESCE(SUM(montant_initial)
          FILTER (WHERE statut='solde'
            AND recovered_via='recouvpro'),0)            AS total_recovered_recouvpro,
        COALESCE(SUM(montant_initial)
          FILTER (WHERE statut='solde'
            AND recovered_via='manual'),0)               AS total_recovered_manual,
        COUNT(*) FILTER (WHERE statut='actif')           AS nb_actif,
        COUNT(*) FILTER (WHERE statut='solde')           AS nb_solde,
        ROUND(100.0 * COUNT(*) FILTER (WHERE statut='solde')
          / NULLIF(COUNT(*),0),1)                        AS taux_recouvrement
      FROM creances WHERE merchant_id=$1
    `, [mid]);

    const { rows: relRows } = await pool.query(`
      SELECT COUNT(*) AS nb_relances_mois
      FROM relances r
      JOIN creances cr ON cr.id = r.creance_id
      WHERE cr.merchant_id=$1
        AND r.sent_at >= date_trunc('month',NOW())
    `, [mid]);

    const { rows: remRows } = await pool.query(`
      SELECT COUNT(*) AS nb_reminders_pending
      FROM reminders
      WHERE merchant_id=$1 AND sent=FALSE
    `, [mid]);

    res.json({
      ...rows[0],
      nb_relances_mois:     parseInt(relRows[0]?.nb_relances_mois || 0),
      nb_reminders_pending: parseInt(remRows[0]?.nb_reminders_pending || 0),
      roi_message: rows[0]?.total_recovered_recouvpro > 0
        ? `RecouvPro vous a aidé à récupérer ${
            Number(rows[0].total_recovered_recouvpro).toLocaleString('fr-FR')
          } FCFA`
        : null,
    });
  } catch (err) {
    console.error('GET /stats:', err.message);
    res.status(500).json({ error: 'Erreur stats' });
  }
});

module.exports = router;
