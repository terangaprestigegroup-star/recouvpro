const express = require('express');
const pool    = require('../db');
const { getOrCreateSession }       = require('../middleware/session');
const { optionalAuth }             = require('../middleware/auth');
const { checkFreemiumLimit }       = require('../middleware/limiter');
const { createReminderSequence,
        cancelReminders,
        getRecommendation,
        buildRelanceLink }         = require('../services/reminders');
const { logCreanceCree,
        logCreancePaye }           = require('../services/audit');

const router = express.Router();

const STATUTS_VALIDES = [
  'nouvelle','relancee','paiement_promis',
  'partiellement_payee','payee','annulee',
];

router.use(getOrCreateSession, optionalAuth);

router.post('/', checkFreemiumLimit, async (req, res) => {
  const { client_name, phone, montant, description, secteur = 'autre' } = req.body;
  if (!client_name?.trim()) return res.status(400).json({ error: 'Nom du client requis' });
  const montantInt = parseInt(montant);
  if (isNaN(montantInt) || montantInt <= 0) return res.status(400).json({ error: 'Montant invalide' });

  try {
    let clientId = null;
    if (req.merchantId) {
      const ex = await pool.query(
        `SELECT id FROM clients WHERE merchant_id=$1 AND name ILIKE $2 LIMIT 1`,
        [req.merchantId, client_name.trim()]
      );
      if (ex.rows.length > 0) {
        clientId = ex.rows[0].id;
      } else {
        const r = await pool.query(
          `INSERT INTO clients (merchant_id, name, phone) VALUES ($1,$2,$3) RETURNING id`,
          [req.merchantId, client_name.trim(), phone || null]
        );
        clientId = r.rows[0].id;
      }
    } else {
      const r = await pool.query(
        `INSERT INTO clients (session_id, name, phone) VALUES ($1,$2,$3) RETURNING id`,
        [req.sessionId, client_name.trim(), phone || null]
      );
      clientId = r.rows[0].id;
    }

    const { rows } = await pool.query(
      `INSERT INTO creances
         (merchant_id, session_id, client_id, client_name,
          montant_initial, montant_restant, description, secteur, statut)
       VALUES ($1,$2,$3,$4,$5,$5,$6,$7,'nouvelle') RETURNING *`,
      [req.merchantId||null, req.merchantId?null:req.sessionId,
       clientId, client_name.trim(), montantInt, description||null, secteur]
    );
    const creance = rows[0];

    if (req.merchantId && phone) {
      try {
        await createReminderSequence({
          id: creance.id, merchant_id: req.merchantId,
          client_name: client_name.trim(),
          montant_restant: montantInt, client_phone: phone,
        });
      } catch(e) { console.error('reminder seq:', e.message); }
    }
    await logCreanceCree(req, creance.id, montantInt);
    res.status(201).json({ creance });
  } catch(err) {
    console.error('POST /creances:', err.message);
    res.status(500).json({ error: 'Erreur création créance' });
  }
});

router.get('/', async (req, res) => {
  try {
    let rows;
    if (req.merchantId) {
      const r = await pool.query(
        `SELECT c.*, cl.phone AS client_phone
         FROM creances c LEFT JOIN clients cl ON cl.id=c.client_id
         WHERE c.merchant_id=$1 AND c.statut NOT IN ('payee','annulee')
         ORDER BY c.created_at DESC`,
        [req.merchantId]
      );
      rows = r.rows;
    } else {
      const r = await pool.query(
        `SELECT c.*, cl.phone AS client_phone
         FROM creances c LEFT JOIN clients cl ON cl.id=c.client_id
         WHERE c.session_id=$1 AND c.statut NOT IN ('payee','annulee')
         ORDER BY c.created_at DESC`,
        [req.sessionId]
      );
      rows = r.rows;
    }
    const enriched = rows.map(cr => ({
      ...cr,
      recommendation:   getRecommendation(cr),
      relance_suggeree: buildRelanceLink(cr),
    }));
    res.json({ creances: enriched });
  } catch(err) {
    console.error('GET /creances:', err.message);
    res.status(500).json({ error: 'Erreur récupération' });
  }
});

router.get('/historique', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * 20;
    let rows;
    if (req.merchantId) {
      const r = await pool.query(
        `SELECT c.*, cl.phone AS client_phone
         FROM creances c LEFT JOIN clients cl ON cl.id=c.client_id
         WHERE c.merchant_id=$1 ORDER BY c.created_at DESC LIMIT 20 OFFSET $2`,
        [req.merchantId, offset]
      );
      rows = r.rows;
    } else {
      const r = await pool.query(
        `SELECT c.*, cl.phone AS client_phone
         FROM creances c LEFT JOIN clients cl ON cl.id=c.client_id
         WHERE c.session_id=$1 ORDER BY c.created_at DESC LIMIT 20 OFFSET $2`,
        [req.sessionId, offset]
      );
      rows = r.rows;
    }
    res.json({ creances: rows, page: parseInt(page) });
  } catch(err) { res.status(500).json({ error: 'Erreur historique' }); }
});

router.get('/stats', async (req, res) => {
  try {
    let rows;
    if (req.merchantId) {
      const r = await pool.query(
        `SELECT
          COALESCE(SUM(montant_restant) FILTER (WHERE statut NOT IN ('payee','annulee')),0) AS total_restant,
          COALESCE(SUM(montant_initial-montant_restant) FILTER (WHERE statut='payee'),0)    AS total_recupere,
          COUNT(*) FILTER (WHERE statut NOT IN ('payee','annulee'))                         AS nb_actif,
          COUNT(*) FILTER (WHERE statut='payee')                                            AS nb_solde,
          COUNT(*) FILTER (WHERE statut NOT IN ('payee','annulee')
            AND created_at < NOW()-INTERVAL '7 days')                                       AS nb_retard,
          ROUND(100.0*COUNT(*) FILTER (WHERE statut='payee')/NULLIF(COUNT(*),0),1)         AS taux_recouvrement
         FROM creances WHERE merchant_id=$1`,
        [req.merchantId]
      );
      rows = r.rows;
    } else {
      const r = await pool.query(
        `SELECT
          COALESCE(SUM(montant_restant) FILTER (WHERE statut NOT IN ('payee','annulee')),0) AS total_restant,
          COALESCE(SUM(montant_initial-montant_restant) FILTER (WHERE statut='payee'),0)    AS total_recupere,
          COUNT(*) FILTER (WHERE statut NOT IN ('payee','annulee'))                         AS nb_actif,
          COUNT(*) FILTER (WHERE statut='payee')                                            AS nb_solde,
          COUNT(*) FILTER (WHERE statut NOT IN ('payee','annulee')
            AND created_at < NOW()-INTERVAL '7 days')                                       AS nb_retard,
          ROUND(100.0*COUNT(*) FILTER (WHERE statut='payee')/NULLIF(COUNT(*),0),1)         AS taux_recouvrement
         FROM creances WHERE session_id=$1`,
        [req.sessionId]
      );
      rows = r.rows;
    }
    res.json(rows[0]);
  } catch(err) {
    console.error('GET /stats:', err.message);
    res.status(500).json({ error: 'Erreur stats' });
  }
});

router.patch('/:id/statut', async (req, res) => {
  const { statut } = req.body;
  if (!STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({ error: `Statut invalide` });
  }
  try {
    const { rows } = await pool.query(`SELECT * FROM creances WHERE id=$1`,[req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Créance introuvable' });
    const cr = rows[0];
    if (req.merchantId && cr.merchant_id !== req.merchantId) return res.status(403).json({ error: 'Accès refusé' });
    if (statut === 'payee') await cancelReminders(req.params.id);
    await pool.query(`UPDATE creances SET statut=$1 WHERE id=$2`,[statut, req.params.id]);
    res.json({ success: true, statut });
  } catch(err) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

router.patch('/:id/payer', async (req, res) => {
  const { montant, note, via_recouvpro = false } = req.body;
  const montantInt = parseInt(montant);
  if (isNaN(montantInt) || montantInt <= 0) return res.status(400).json({ error: 'Montant invalide' });
  try {
    const { rows } = await pool.query(`SELECT * FROM creances WHERE id=$1`,[req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Créance introuvable' });
    const cr = rows[0];
    if (req.merchantId && cr.merchant_id !== req.merchantId) return res.status(403).json({ error: 'Accès refusé' });
    const paye       = Math.min(montantInt, cr.montant_restant);
    const newRestant = cr.montant_restant - paye;
    const newStatut  = newRestant === 0 ? 'payee' : newRestant < cr.montant_initial ? 'partiellement_payee' : cr.statut;
    const recoveredVia = newStatut === 'payee' ? (via_recouvpro ? 'fluxio' : 'manual') : null;
    await pool.query(
      `UPDATE creances SET montant_restant=$1, statut=$2, recovered_via=$3 WHERE id=$4`,
      [newRestant, newStatut, recoveredVia, req.params.id]
    );
    await pool.query(`INSERT INTO paiements (creance_id, montant, note) VALUES ($1,$2,$3)`,[req.params.id, paye, note||null]);
    if (newStatut === 'payee') await cancelReminders(req.params.id);
    await logCreancePaye(req, req.params.id, paye);
    res.json({ montant_paye: paye, montant_restant: newRestant, statut: newStatut });
  } catch(err) {
    console.error('PATCH /payer:', err.message);
    res.status(500).json({ error: 'Erreur paiement' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM creances WHERE id=$1`,[req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Créance introuvable' });
    const cr = rows[0];
    if (req.merchantId && cr.merchant_id !== req.merchantId) return res.status(403).json({ error: 'Accès refusé' });
    await pool.query(`UPDATE creances SET statut='annulee' WHERE id=$1`,[req.params.id]);
    await cancelReminders(req.params.id);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: 'Erreur annulation' }); }
});

module.exports = router;
