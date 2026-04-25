const express  = require('express');
const crypto   = require('crypto');
const fetch    = require('node-fetch');
const pool     = require('../db');
const { requireAuth } = require('../middleware/auth');
const { logWebhook }  = require('../services/audit');

const router = express.Router();

const PD_BASE = process.env.NODE_ENV === 'production'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1';

const pdHeaders = () => ({
  'PAYDUNYA-MASTER-KEY':  process.env.PAYDUNYA_MASTER_KEY,
  'PAYDUNYA-PUBLIC-KEY':  process.env.PAYDUNYA_PUBLIC_KEY,
  'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
  'PAYDUNYA-TOKEN':       process.env.PAYDUNYA_TOKEN,
  'Content-Type':         'application/json',
});

const verifySignature = (payload, hash) => {
  if (!process.env.PAYDUNYA_MASTER_KEY || process.env.NODE_ENV !== 'production') return true;
  const expected = crypto
    .createHash('sha512')
    .update(process.env.PAYDUNYA_MASTER_KEY + JSON.stringify(payload))
    .digest('hex');
  return expected === hash;
};

router.post('/initier', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id FROM merchants WHERE id=$1`, [req.merchantId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Marchand introuvable' });
  const base = process.env.FRONTEND_URL || 'https://recouvpro.up.railway.app';
  const payload = {
    invoice: {
      items: { item_0: { name: 'RecouvPro Premium', quantity: 1,
        unit_price: '2500', total_price: '2500', description: 'Abonnement mensuel' } },
      total_amount: 2500, description: 'RecouvPro Premium — 1 mois',
    },
    store: { name: 'RecouvPro' },
    actions: {
      cancel_url:   `${base}/abonnement?status=cancel`,
      return_url:   `${base}/abonnement?status=success`,
      callback_url: `${process.env.BACKEND_URL || base}/api/abonnement/callback`,
    },
    custom_data: { merchant_id: req.merchantId },
  };
  try {
    const r = await fetch(`${PD_BASE}/checkout-invoice/create`,
      { method: 'POST', headers: pdHeaders(), body: JSON.stringify(payload) });
    const d = await r.json();
    if (d.response_code !== '00') return res.status(502).json({ error: 'PayDunya error' });
    res.json({ invoice_url: d.invoice_url, token: d.token });
  } catch (err) {
    res.status(500).json({ error: 'Erreur paiement' });
  }
});

router.post('/callback', async (req, res) => {
  const hash = req.headers['x-paydunya-signature'] || '';
  if (!verifySignature(req.body, hash)) {
    await logWebhook(req, 'INVALID_SIG', 0);
    return res.status(401).send('Signature invalide');
  }
  const { data } = req.body;
  if (!data || data.status !== 'completed') return res.sendStatus(200);
  const { merchant_id: merchantId } = data.custom_data || {};
  const invoiceToken = data.invoice_token;
  const montant      = data.invoice?.total_amount || 2500;
  if (!merchantId || !invoiceToken) return res.status(400).send('Données manquantes');
  try {
    const cr  = await fetch(`${PD_BASE}/checkout-invoice/confirm/${invoiceToken}`,
      { headers: pdHeaders() });
    const cdx = await cr.json();
    if (cdx.status !== 'completed') return res.sendStatus(200);
    const dup = await pool.query(
      `SELECT id FROM abonnements WHERE paydunya_ref=$1`, [invoiceToken]);
    if (dup.rows.length) return res.sendStatus(200);
    const debut = new Date();
    const fin   = new Date(); fin.setDate(fin.getDate() + 30);
    await pool.query(
      `INSERT INTO abonnements (merchant_id, paydunya_ref, debut, fin, verified_signature, raw_payload)
       VALUES ($1,$2,$3,$4,TRUE,$5)`,
      [merchantId, invoiceToken, debut, fin, JSON.stringify(req.body)]
    );
    await pool.query(`UPDATE merchants SET plan='premium' WHERE id=$1`, [merchantId]);
    await logWebhook(req, invoiceToken, montant);
    res.sendStatus(200);
  } catch (err) {
    console.error('callback error:', err.message);
    res.sendStatus(500);
  }
});

router.get('/statut', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT plan FROM merchants WHERE id=$1`, [req.merchantId]);
  const abo = await pool.query(
    `SELECT fin FROM abonnements WHERE merchant_id=$1 AND statut='actif'
     ORDER BY fin DESC LIMIT 1`, [req.merchantId]);
  res.json({ plan: rows[0]?.plan || 'free', fin: abo.rows[0]?.fin || null });
});

module.exports = router;
