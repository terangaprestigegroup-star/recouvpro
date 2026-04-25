const express = require('express');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { signAccessToken, signRefreshToken } = require('../middleware/auth');
const { logLoginSuccess, logLoginFailed, logCompteCreé } = require('../services/audit');
const { limitOTP } = require('../services/rateLimiter');

const router = express.Router();

const genOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('rp_token', accessToken, {
    maxAge:   7 * 24 * 60 * 60 * 1000,
    httpOnly: true, sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  });
  res.cookie('rp_refresh', refreshToken, {
    maxAge:   365 * 24 * 60 * 60 * 1000,
    httpOnly: true, sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    path:     '/api/auth/refresh',
  });
};

const otpWALink = (phone, code) => {
  const msg = `RecouvPro — ton code : *${code}*\nValable 10 minutes.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

router.post('/save', limitOTP, async (req, res) => {
  const { phone, email, shop_name, session_id } = req.body;
  if (!phone && !email) {
    return res.status(400).json({ error: 'phone ou email requis' });
  }
  try {
    const existing = await pool.query(
      `SELECT id FROM merchants WHERE phone=$1 OR email=$2`,
      [phone || null, email || null]
    );
    const otp     = genOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    if (existing.rows.length > 0) {
      const merchantId = existing.rows[0].id;
      await pool.query(
        `UPDATE merchants SET otp_code=$1, otp_expires=$2 WHERE id=$3`,
        [otp, expires, merchantId]
      );
      const waLink = phone ? otpWALink(phone, otp) : null;
      return res.json({ exists: true, merchant_id: merchantId, otp_wa_link: waLink });
    }

    const { rows } = await pool.query(
      `INSERT INTO merchants (phone, email, shop_name, otp_code, otp_expires)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [phone || null, email || null, shop_name || null, otp, expires]
    );
    const merchantId = rows[0].id;
    await logCompteCreé(req, merchantId);
    const waLink = phone ? otpWALink(phone, otp) : null;
    res.json({ exists: false, merchant_id: merchantId, otp_wa_link: waLink, session_id });
  } catch (err) {
    console.error('auth/save:', err.message);
    res.status(500).json({ error: 'Erreur création compte' });
  }
});

router.post('/otp/verify', limitOTP, async (req, res) => {
  const { merchant_id, code } = req.body;
  if (!merchant_id || !code) {
    return res.status(400).json({ error: 'merchant_id et code requis' });
  }
  const { rows } = await pool.query(
    `SELECT id, otp_code, otp_expires FROM merchants WHERE id=$1`,
    [merchant_id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Compte introuvable' });
  const m = rows[0];
  if (m.otp_code !== String(code)) {
    await logLoginFailed(req, `merchant:${merchant_id}`);
    return res.status(401).json({ error: 'Code incorrect' });
  }
  if (new Date() > new Date(m.otp_expires)) {
    return res.status(401).json({ error: 'Code expiré' });
  }
  await pool.query(
    `UPDATE merchants SET otp_code=NULL, otp_expires=NULL WHERE id=$1`,
    [merchant_id]
  );
  const accessToken  = signAccessToken(merchant_id);
  const refreshToken = signRefreshToken(merchant_id);
  setTokenCookies(res, accessToken, refreshToken);
  await logLoginSuccess(req, merchant_id);
  res.json({ success: true, token: accessToken, merchant_id });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.rp_refresh;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token manquant' });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') throw new Error('bad type');
    const { rows } = await pool.query(
      `SELECT id FROM merchants WHERE id=$1`, [decoded.merchantId]
    );
    if (!rows.length) return res.status(401).json({ error: 'Compte introuvable' });
    const newAccessToken = signAccessToken(decoded.merchantId);
    setTokenCookies(res, newAccessToken, refreshToken);
    res.json({ success: true, token: newAccessToken });
  } catch (err) {
    res.clearCookie('rp_token');
    res.clearCookie('rp_refresh');
    res.status(401).json({ error: 'SESSION_EXPIRED' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('rp_token');
  res.clearCookie('rp_refresh');
  res.json({ success: true });
});

module.exports = router;
