const express = require('express');
const pool    = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { limit = 20, action_type } = req.query;
  const params = [req.merchantId];
  let where = 'merchant_id=$1';

  if (action_type) {
    params.push(action_type);
    where += ` AND action_type=$${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT id, action_type, target_type, target_id, metadata, created_at
     FROM audit_logs WHERE ${where}
     ORDER BY created_at DESC LIMIT $${params.length + 1}`,
    [...params, Math.min(Number(limit), 100)]
  );

  res.json({ logs: rows });
});

module.exports = router;
