const express = require('express');
const pool    = require('../db');
const { getOrCreateSession } = require('../middleware/session');
const { optionalAuth }       = require('../middleware/auth');
const { limitRelance }       = require('../services/rateLimiter');
const { logRelanceEnvoyee }  = require('../services/audit');

const router = express.Router();
router.use(getOrCreateSession, optionalAuth);

const MESSAGES = {
  fr: (shopName, clientName, montant) =>
    `Bonjour ${clientName} 👋\n\n` +
    `${shopName} vous rappelle qu'un montant de *${Number(montant).toLocaleString('fr-FR')} FCFA* ` +
    `est en attente de règlement.\n\nMerci de régulariser dès que possible 🙏`,
  wo: (shopName, clientName, montant) =>
    `Asalaa maalekum ${clientName} 👋\n\n` +
    `${shopName} dafa la wax ne *${Number(montant).toLocaleString('fr-FR')} FCFA* ` +
    `la am ci kanam.\n\nJërëjëf 🙏`,
};

router.post('/:creanceId', limitRelance, async (req, res) => {
  const { creanceId } = req.params;
  const { lang = 'fr', shop_name = 'Votre boutique' } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT cr.*, cl.phone AS client_phone
       FROM creances cr
       LEFT JOIN clients cl ON cl.id = cr.client_id
       WHERE cr.id=$1`,
      [creanceId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Créance introuvable' });
    const creance = rows[0];
    if (req.merchantId && creance.merchant_id !== req.merchantId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const msgFn   = MESSAGES[lang] || MESSAGES.fr;
    const message = msgFn(shop_name, creance.client_name, creance.montant_restant);
    const phone   = creance.client_phone?.replace(/\D/g, '') || null;
    const waLink  = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    await pool.query(
      `INSERT INTO relances (creance_id, type) VALUES ($1,'whatsapp')`,
      [creanceId]
    );
    await logRelanceEnvoyee(req, creanceId, lang);
    res.json({ wa_link: waLink, message, phone });
  } catch (err) {
    console.error('POST /relances:', err.message);
    res.status(500).json({ error: 'Erreur relance' });
  }
});

router.get('/:creanceId', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM relances WHERE creance_id=$1 ORDER BY sent_at DESC`,
    [req.params.creanceId]
  );
  res.json({ relances: rows });
});

module.exports = router;
