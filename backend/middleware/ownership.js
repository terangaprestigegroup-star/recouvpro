const pool  = require('../db');
const audit = require('../services/audit');

const requireOwnership = (resourceType = 'creance') => async (req, res, next) => {
  const resourceId = req.params.id || req.params.creanceId;
  if (!resourceId) return next();

  try {
    const table = resourceType === 'client' ? 'clients' : 'creances';
    const { rows } = await pool.query(
      `SELECT merchant_id, session_id FROM ${table} WHERE id=$1`,
      [resourceId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ressource introuvable' });
    const row = rows[0];
    if (req.merchantId) {
      if (row.merchant_id !== req.merchantId) {
        await audit.logAccessDenied(req, `${resourceType}:${resourceId}`);
        return res.status(403).json({ error: 'Accès refusé' });
      }
      return next();
    }
    if (req.sessionId && row.session_id === req.sessionId) return next();
    await audit.logAccessDenied(req, `no session match ${resourceType}:${resourceId}`);
    return res.status(403).json({ error: 'Accès refusé' });
  } catch (err) {
    console.error('requireOwnership:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const sanitize = (req, res, next) => {
  const clean = (val) => {
    if (typeof val !== 'string') return val;
    return val.replace(/<[^>]*>/g, '').replace(/['"`;\\]/g, '').trim().substring(0, 500);
  };
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? clean(v) : v])
    );
  };
  req.body  = sanitizeObj(req.body);
  req.query = sanitizeObj(req.query);
  next();
};

const validateMontant = (req, res, next) => {
  const montant = Number(req.body.montant);
  if (isNaN(montant) || montant <= 0 || montant > 100_000_000) {
    return res.status(400).json({ error: 'Montant invalide (1–100 000 000 FCFA)' });
  }
  req.body.montant = Math.floor(montant);
  next();
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  const c = String(phone).replace(/\D/g, '');
  if (c.length === 9)                          return `221${c}`;
  if (c.length === 12 && c.startsWith('221')) return c;
  return c.length >= 8 ? c : null;
};

module.exports = { requireOwnership, sanitize, validateMontant, normalizePhone };
