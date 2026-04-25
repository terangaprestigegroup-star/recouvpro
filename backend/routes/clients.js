const express = require('express');
const pool    = require('../db');
const { getOrCreateSession } = require('../middleware/session');
const { optionalAuth }       = require('../middleware/auth');

const router = express.Router();
router.use(getOrCreateSession, optionalAuth);

router.get('/', async (req, res) => {
  try {
    let rows;
    if (req.merchantId) {
      const r = await pool.query(
        `SELECT cl.*,
          COUNT(cr.id) FILTER (WHERE cr.statut='actif') AS nb_creances,
          COALESCE(SUM(cr.montant_restant),0)            AS total_du
         FROM clients cl
         LEFT JOIN creances cr ON cr.client_id = cl.id
         WHERE cl.merchant_id=$1
         GROUP BY cl.id ORDER BY cl.name`,
        [req.merchantId]
      );
      rows = r.rows;
    } else {
      const r = await pool.query(
        `SELECT cl.*,
          COUNT(cr.id) FILTER (WHERE cr.statut='actif') AS nb_creances,
          COALESCE(SUM(cr.montant_restant),0)            AS total_du
         FROM clients cl
         LEFT JOIN creances cr ON cr.client_id = cl.id
         WHERE cl.session_id=$1
         GROUP BY cl.id ORDER BY cl.name`,
        [req.sessionId]
      );
      rows = r.rows;
    }
    res.json({ clients: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur clients' });
  }
});

module.exports = router;
