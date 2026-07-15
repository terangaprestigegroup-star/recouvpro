const pool = require('../db');

// Blueprint Fluxio V1.1 §9
// Le Starter est réellement utilisable.
// Aucune frustration artificielle.
// Le cœur du produit n'est JAMAIS bloqué.
// Premium = gain de temps + stats avancées.

// Pour fonctionnalités Premium uniquement
const requirePremium = async (req, res, next) => {
  if (!req.merchantId) return next();
  const { rows } = await pool.query(
    `SELECT plan FROM merchants WHERE id=$1`, [req.merchantId]
  );
  if (!rows.length || rows[0].plan !== 'premium') {
    return res.status(403).json({
      error:       'PREMIUM_REQUIRED',
      message:     'Cette fonctionnalité est réservée aux abonnés Premium.',
      upgrade_url: '/abonnement',
    });
  }
  next();
};

// Starter = créances illimitées (Blueprint Fluxio V1.1 §9)
const checkFreemiumLimit = (req, res, next) => next();

module.exports = { checkFreemiumLimit, requirePremium };
