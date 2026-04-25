const express = require('express');
const pool    = require('../db');
const { requireAuth }        = require('../middleware/auth');
const { getOrCreateSession } = require('../middleware/session');
const { optionalAuth }       = require('../middleware/auth');
const {
  getRecommendation,
  buildRelanceLink,
} = require('../services/reminders');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT r.*, cr.client_name, cr.montant_restant
    FROM reminders r
    JOIN creances cr ON cr.id = r.creance_id
    WHERE r.merchant_id=$1
    ORDER BY r.scheduled_at ASC LIMIT 50
  `, [req.merchantId]);
  res.json({ reminders: rows });
});

router.get('/pending', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT r.*, cr.client_name, cr.montant_restant
    FROM reminders r
    JOIN creances cr ON cr.id = r.creance_id
    WHERE r.merchant_id=$1
      AND r.sent=FALSE
      AND cr.statut='actif'
    ORDER BY r.scheduled_at ASC
  `, [req.merchantId]);
  res.json({ reminders: rows });
});

router.post('/relancer-tout', requireAuth, async (req, res) => {
  const { rows: creances } = await pool.query(`
    SELECT cr.*, cl.phone AS client_phone
    FROM creances cr
    LEFT JOIN clients cl ON cl.id = cr.client_id
    WHERE cr.merchant_id=$1
      AND cr.statut='actif'
      AND cr.montant_restant>0
  `, [req.merchantId]);

  if (!creances.length) return res.json({ success: true, count: 0, links: [] });

  const links = creances
    .map(cr => {
      const relance = buildRelanceLink(cr);
      return relance ? { ...relance, client_name: cr.client_name, creance_id: cr.id } : null;
    })
    .filter(Boolean);

  await Promise.all(links.map(l =>
    pool.query(
      `INSERT INTO relances (creance_id, type) VALUES ($1,'bulk_manual')`,
      [l.creance_id]
    )
  ));

  res.json({ success: true, count: links.length, links });
});

router.post('/recommander/:creanceId', getOrCreateSession, optionalAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT cr.*, cl.phone AS client_phone
    FROM creances cr
    LEFT JOIN clients cl ON cl.id = cr.client_id
    WHERE cr.id=$1
  `, [req.params.creanceId]);

  if (!rows.length) return res.status(404).json({ error: 'Créance introuvable' });

  const creance        = rows[0];
  const recommendation = getRecommendation(creance);
  const relance        = buildRelanceLink(creance, recommendation.action);

  res.json({ recommendation, relance });
});

module.exports = router;
