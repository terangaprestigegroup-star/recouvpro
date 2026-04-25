const pool = require('../db');

const LIMITS = {
  otp:          { max: 3,   windowMs: 10 * 60 * 1000 },
  creance:      { max: 20,  windowMs: 60 * 60 * 1000 },
  relance:      { max: 5,   windowMs: 60 * 60 * 1000 },
  relance_jour: { max: 3,   windowMs: 24 * 60 * 60 * 1000 },
  api_global:   { max: 100, windowMs: 60 * 1000 },
};

const checkLimit = async (key, limitType) => {
  const { max, windowMs } = LIMITS[limitType] || LIMITS.api_global;
  const now       = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  try {
    if (Math.random() < 0.01) {
      await pool.query(`DELETE FROM rate_limits WHERE window_end < NOW()`);
    }
    const { rows } = await pool.query(
      `INSERT INTO rate_limits (key, count, window_end)
       VALUES ($1, 1, $2)
       ON CONFLICT (key) DO UPDATE
         SET count = CASE
           WHEN rate_limits.window_end < NOW() THEN 1
           ELSE rate_limits.count + 1
         END,
         window_end = CASE
           WHEN rate_limits.window_end < NOW() THEN $2
           ELSE rate_limits.window_end
         END
       RETURNING count, window_end`,
      [key, windowEnd]
    );
    const { count, window_end } = rows[0];
    const resetIn = Math.max(0, new Date(window_end).getTime() - now.getTime());
    return { allowed: count <= max, count, max, resetIn, resetInSec: Math.ceil(resetIn / 1000) };
  } catch (err) {
    console.error('rate_limit error:', err.message);
    return { allowed: true };
  }
};

const limitOTP = async (req, res, next) => {
  const ip  = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  const key = `otp:ip:${ip}`;
  const result = await checkLimit(key, 'otp');
  if (!result.allowed) {
    return res.status(429).json({
      error: 'RATE_LIMIT',
      message: `Trop de tentatives. Réessaie dans ${result.resetInSec}s.`,
    });
  }
  next();
};

const limitCreance = async (req, res, next) => {
  const id  = req.merchantId || req.sessionId || 'anon';
  const key = `creance:merchant:${id}`;
  const result = await checkLimit(key, 'creance');
  if (!result.allowed) {
    return res.status(429).json({
      error: 'RATE_LIMIT',
      message: `Limite atteinte. Réessaie dans ${result.resetInSec}s.`,
    });
  }
  next();
};

const limitRelance = async (req, res, next) => {
  const creanceId = req.params.creanceId || req.params.id;
  const key       = `relance:creance:${creanceId}:jour`;
  const result    = await checkLimit(key, 'relance_jour');
  if (!result.allowed) {
    return res.status(429).json({
      error:   'RELANCE_LIMIT',
      message: 'Maximum 3 relances par jour pour cette créance.',
    });
  }
  next();
};

const limitGlobal = async (req, res, next) => {
  const ip  = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  const key = `global:ip:${ip}`;
  const result = await checkLimit(key, 'api_global');
  if (!result.allowed) {
    return res.status(429).json({ error: 'RATE_LIMIT', message: 'Trop de requêtes.' });
  }
  next();
};

module.exports = { checkLimit, limitOTP, limitCreance, limitRelance, limitGlobal };
