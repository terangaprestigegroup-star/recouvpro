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
  const base = process.env.FRONTEND_URL || 'https://re
