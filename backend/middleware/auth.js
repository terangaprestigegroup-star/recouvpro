const jwt  = require('jsonwebtoken');
const pool = require('../db');

const signAccessToken = (merchantId) =>
  jwt.sign({ merchantId, type: 'access' }, process.env.JWT_SECRET, { expiresIn: '7d' });

const signRefreshToken = (merchantId) =>
  jwt.sign({ merchantId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1y' });

const requireAuth = async (req, res, next) => {
  const token =
    req.headers.authorization?.split(' ')[1] ||
    req.cookies.rp_token;

  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    const { rows } = await pool.query(
      `SELECT id, plan FROM merchants WHERE id=$1`,
      [decoded.merchantId]
    );
    if (!rows.length) return res.status(401).json({ error: 'Compte introuvable' });
    req.merchantId   = decoded.merchantId;
    req.merchantPlan = rows[0].plan;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'SESSION_EXPIRED', refresh: true });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
};

const optionalAuth = (req, res, next) => {
  const token =
    req.headers.authorization?.split(' ')[1] ||
    req.cookies.rp_token;
  if (token) {
    try {
      const decoded  = jwt.verify(token, process.env.JWT_SECRET);
      req.merchantId = decoded.merchantId;
    } catch { }
  }
  next();
};

module.exports = { requireAuth, optionalAuth, signAccessToken, signRefreshToken };
