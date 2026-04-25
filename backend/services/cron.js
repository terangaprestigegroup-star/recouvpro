const pool = require('../db');

const msgMarchand = (clientName, montant, jours) => {
  const montantStr = Number(montant).toLocaleString('fr-FR');
  return (
    `⏰ *RecouvPro — Rappel*\n\n` +
    `*${clientName}* n'a pas payé depuis *${jours} jour${jours > 1 ? 's' : ''}*.\n\n` +
    `💰 Montant restant : *${montantStr} FCFA*\n\n` +
    `👉 Envoie une relance :\n` +
    `https://recouvpro.up.railway.app/dashboard`
  );
};

const runRelancesCron = async () => {
  console.log(`🔄 Cron relances — ${new Date().toISOString()}`);
  let totalNotifs = 0;

  const RELANCE_JOURS = [1, 3, 7];

  for (const jours of RELANCE_JOURS) {
    const { rows: creances } = await pool.query(`
      SELECT
        cr.id, cr.merchant_id, cr.client_name, cr.montant_restant,
        cl.phone AS client_phone,
        m.phone  AS merchant_phone,
        m.shop_name,
        COUNT(r.id) AS nb_relances,
        MAX(r.sent_at) AS derniere_relance
      FROM creances cr
      LEFT JOIN clients   cl ON cl.id = cr.client_id
      LEFT JOIN merchants m  ON m.id  = cr.merchant_id
      LEFT JOIN relances  r  ON r.creance_id = cr.id
      WHERE
        cr.statut = 'actif'
        AND cr.montant_restant > 0
        AND cr.merchant_id IS NOT NULL
        AND cr.created_at <= NOW() - INTERVAL '${jours} days'
        AND cr.created_at >  NOW() - INTERVAL '${jours + 1} days'
      GROUP BY cr.id, cl.phone, m.phone, m.shop_name
      HAVING COUNT(r.id) < 3
    `);

    for (const cr of creances) {
      try {
        await pool.query(
          `INSERT INTO relances (creance_id, type) VALUES ($1,'auto_cron')`,
          [cr.id]
        );

        if (cr.merchant_phone) {
          const msg    = msgMarchand(cr.client_name, cr.montant_restant, jours);
          const waLink = `https://wa.me/${cr.merchant_phone.replace(/\D/g,'')}` +
            `?text=${encodeURIComponent(msg)}`;

          await pool.query(
            `INSERT INTO notifications
               (merchant_id, creance_id, type, message, wa_link)
             VALUES ($1,'relance_auto',$2,$3,$4)`,
            [cr.merchant_id, cr.id, msg, waLink]
          );
        }

        totalNotifs++;
        console.log(`  ✅ J+${jours} → ${cr.client_name}`);
      } catch (err) {
        console.error(`  ❌ créance #${cr.id}:`, err.message);
      }
    }
  }

  console.log(`✅ Cron terminé — ${totalNotifs} notifications`);
  return totalNotifs;
};

module.exports = { runRelancesCron };
