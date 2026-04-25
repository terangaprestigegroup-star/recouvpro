const express = require('express');
const pool    = require('../db');
const { getOrCreateSession } = require('../middleware/session');

const router = express.Router();

router.post('/init', getOrCreateSession, (req, res) => {
  res.json({ session_id: req.sessionId });
});

router.post('/migrate', async (req, res) => {
  const { session_id, merchant_id } = req.body;

  if (!session_id || !merchant_id) {
    return res.status(400).json({ error: 'session_id et merchant_id requis' });
  }

  try {
    await pool.query(
      `UPDATE clients  SET merchant_id=$1, session_id=NULL WHERE session_id=$2`,
      [merchant_id, session_id]
    );
    await pool.query(
      `UPDATE creances SET merchant_id=$1, session_id=NULL WHERE session_id=$2`,
      [merchant_id, session_id]
    );
    await pool.query(
      `UPDATE merchants SET session_id=$1 WHERE id=$2`,
      [session_id, merchant_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('migrate error:', err.message);
    res.status(500).json({ error: 'Erreur migration' });
  }
});

module.exports = router;
