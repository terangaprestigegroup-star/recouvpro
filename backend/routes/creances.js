const express = require('express');
const pool    = require('../db');
const { getOrCreateSession }       = require('../middleware/session');
const { optionalAuth }             = require('../middleware/auth');
const { checkFreemiumLimit }       = require('../middleware/limiter');
const { createReminderSequence,
        cancelReminders,
        getRecommendation,
        buildRelanceLink }         = require('../services/reminders');
const { logCreanceCree, logCreancePaye } = require('../services/audit');

const router = express.Router();
router.use(getOrCreateSession, optionalAuth);

router.post('/', checkFreemiumLimit, async (req, res) => {
  const { client_name, phone, montant, description } = req.body;
  if (!client_name || !montant) {
    return res.status(400).json({ error: 'client_name et montant requis' });
  }
  const montantInt = parseInt(montant);
  if (isNaN(montantInt) || montantInt <= 0) {
    return res.status(400).json({ error: 'Montant invalide' });
  }
  try {
    let clientId = null;
    if (req.merchantId) {
      const existing = await pool.query(
        `SELECT id FROM clients WHERE merchant_id=$1 AND name ILIKE $2 LIMIT 1`,
        [req.merchantId, client_name]
      );
      if (existing.rows.length > 0) {
        clientId = existing.rows[0].id;
      } else {
        const newClient = await pool.query(
          `INSERT INTO clients (merchant_id, name, phone) VALUES ($1,$2,$3) RETURNING id`,
          [req.merchantId, client_name, phone || null]
        );
        clientId = newClient.rows[0].id;
      }
    } else {
      const newClient = await pool.query(
        `INSERT INTO clients (session_id, name, phone) VALUES ($1,$2,$3) RETURNING id`,
        [req.sessionId, client_name, phone || null]
      );
      clientId = newClient.rows[0].id;
    }

    const { rows } = await pool.query(
      `INSERT INTO creances
         (merchant_id, session_id, client_id, client_name,
          montant_initial, montant_restant, description)
       VALUES ($1,$2,$3,$4,$5,$5,$6) RETURNING *`,
      [req.merchantId || null, req.merchantId ? null : req.sessionId,
       clientId, client_name, montantInt, description || null]
    );

    const creance = rows[0];

    if (req.merchantId && phone) {
      try {
        await createReminderSequence({
          id: creance.id, merchant_id: req.merchantId,
          client_name, montant_restant: montantInt, client_phone: phone,
        });
      } catch (e) { console.error('reminder seq:', e.message); }
    }

    await logCreanceCree(req, creance.id, montantInt);
    res.status(201).json({ creance });
  } catch (err) {
    console.error('POST /creances:', err.message);
    res.status(500).json({ error: 'Erreur création créance' });
  }
});

router.get('/', async (req, res) => {
  try {
    const condition = req.merchantId
      ? `c.merchant_id=${req.merchantId}`
      : `c.session_id='${req.sessionId}'`;
    const { rows } = await pool.query(
      `SELECT c.*, cl.phone AS client_phone
       FROM creances c LEFT JOIN clients cl ON cl.id = c.client_id
       WHERE ${condition} ORDER BY c.created_at DESC`
    );
    const enriched = rows.map(cr => ({
      ...cr,
      recommendation:   getRecommendation(cr),
      relance_suggeree: cr.statut === 'actif' ? buildRelanceLink(cr) : null,
    }));
    res.json({ creances: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const condition = req.merchantId
      ? `merchant_id=${req.merchantId}`
      : `session_id='${req.sessionId}'`;
    const { rows } = await pool.query(`
      SELECT
        COALESCE(SUM(montant_initial),0)                   AS total_initial,
        COALESCE(SUM(montant_restant),0)                   AS total_restant,
        COALESCE(SUM(montant_initial-montant_restant),0)   AS total_recupere,
        COUNT(*) FILTER (WHERE statut='actif')             AS nb_actif,
        COUNT(*) FILTER (WHERE statut='solde')             AS nb_solde,
        COUNT(*) FILTER (WHERE montant_restant>0
          AND created_at < NOW()-INTERVAL '7 days'
          AND statut='actif')                              AS nb_retard
      FROM creances WHERE ${condition}
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur stats' });
  }
});

router.patch('/:id/payer', async (req, res) => {
  const { id } = req.params;
  const { montant, note, via_recouvpro = false } = req.body;
  const montantInt = parseInt(montant);
  if (isNaN(montantInt) || montantInt <= 0) {
    return res.status(400).json({ error: 'Montant invalide' });
  }
  try {
    const { rows } = await pool.query(`SELECT * FROM creances WHERE id=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Créance introuvable' });
    const creance = rows[0];
    if (req.merchantId && creance.merchant_id !== req.merchantId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const paye       = Math.min(montantInt, creance.montant_restant);
    const newRestant = creance.montant_restant - paye;
    const newStatut  = newRestant === 0 ? 'solde' : 'actif';
    const recoveredVia = newStatut === 'solde'
      ? (via_recouvpro ? 'recouvpro' : 'manual') : null;
    await pool.query(
      `UPDATE creances SET montant_restant=$1, statut=$2, recovered_via=$3 WHERE id=$4`,
      [newRestant, newStatut, recoveredVia, id]
    );
    await pool.query(
      `INSERT INTO paiements (creance_id, montant, note) VALUES ($1,$2,$3)`,
      [id, paye, note || null]
    );
    if (newStatut === 'solde') await cancelReminders(id);
    await logCreancePaye(req, id, paye);
    res.json({ montant_paye: paye, montant_restant: newRestant, statut: newStatut });
  } catch (err) {
    console.error('PATCH /payer:', err.message);
    res.status(500).json({ error: 'Erreur paiement' });
  }
});

module.exports = router;
