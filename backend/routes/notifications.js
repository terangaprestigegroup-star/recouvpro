const express = require('express');
const pool    = require('../db');
const { requireAuth }     = require('../middleware/auth');
const { runRelancesCron } = require('../services/cron');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.*, cr.client_name, cr.montant_restant
     FROM notifications n
     LEFT JOIN creances cr ON cr.id = n.creance_id
     WHERE n.merchant_id = $1
     ORDER BY n.created_at DESC LIMIT 20`,
    [req.merchantId]
  );
  res.json({ notifications: rows });
});

router.patch('/:id/lu', requireAuth, async (req, res) => {
  await pool.query(
    `UPDATE notifications SET lu=TRUE WHERE id=$1 AND merchant_id=$2`,
    [req.params.id, req.merchantId]
  );
  res.json({ success: true });
});

router.patch('/tout-lu', requireAuth, async (req, res) => {
  await pool.query(
    `UPDATE notifications SET lu=TRUE WHERE merchant_id=$1`,
    [req.merchantId]
  );
  res.json({ success: true });
});

router.get('/count', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM notifications WHERE merchant_id=$1 AND lu=FALSE`,
    [req.merchantId]
  );
  res.json({ count: parseInt(rows[0].count) });
});

router.post('/cron', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  const total = await runRelancesCron();
  res.json({ success: true, notifications_creees: total });
});

module.exports = router;
