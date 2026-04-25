const pool = require('../db');

const LIMITE_FREE = 5;

const checkFreemiumLimit = async (req, res, next) => {
  if (!req.merchantId) return next();

  const { rows } = await pool.query(
    `SELECT plan FROM merchants WHERE id=$1`,
    [req.merchantId]
  );

  if (!rows.length) return next();
  if (rows[0].plan === 'premium') return next();

  const count = await pool.query(
    `SELECT COUNT(*) FROM creances
     WHERE merchant_id=$1 AND statut='actif'`,
    [req.merchantId]
  );

  if (parseInt(count.rows[0].count) >= LIMITE_FREE) {
    return res.status(403).json({
      error:       'LIMIT_REACHED',
      message:     `Limite de ${LIMITE_FREE} créances actives atteinte`,
      upgrade_url: '/abonnement',
      limite:      LIMITE_FREE,
    });
  }

  next();
};

module.exports = { checkFreemiumLimit };
