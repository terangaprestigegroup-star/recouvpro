const pool = require('../db');

const processDueReminders = async () => {
  try {
    const { rows } = await pool.query(`
      SELECT
        r.*,
        cr.client_name,
        cr.montant_restant,
        cr.statut       AS creance_statut,
        cl.phone        AS client_phone,
        m.phone         AS merchant_phone,
        m.shop_name
      FROM reminders r
      JOIN creances  cr ON cr.id = r.creance_id
      LEFT JOIN clients cl ON cl.id = cr.client_id
      JOIN merchants m  ON m.id  = r.merchant_id
      WHERE
        r.scheduled_at <= NOW()
        AND r.sent      = FALSE
        AND cr.statut   = 'actif'
        AND cr.montant_restant > 0
      LIMIT 50
    `);

    if (!rows.length) return;

    console.log(`⏰ Worker → ${rows.length} reminders à traiter`);

    for (const reminder of rows) {
      try {
        await pool.query(
          `UPDATE reminders SET sent=TRUE, sent_at=NOW() WHERE id=$1`,
          [reminder.id]
        );

        const msgMarchand =
          `🔔 *Relance auto RecouvPro*\n\n` +
          `Type : ${reminder.type.toUpperCase()}\n` +
          `Client : *${reminder.client_name}*\n` +
          `Montant : *${Number(reminder.montant_restant).toLocaleString('fr-FR')} FCFA*\n\n` +
          `👉 Clique pour envoyer :\n${reminder.wa_link || '(pas de numéro)'}`;

        const waMarchand = reminder.merchant_phone
          ? `https://wa.me/${reminder.merchant_phone.replace(/\D/g,'')}` +
            `?text=${encodeURIComponent(msgMarchand)}`
          : null;

        await pool.query(
          `INSERT INTO notifications
             (merchant_id, creance_id, type, message, wa_link)
           VALUES ($1,$2,'reminder_auto',$3,$4)`,
          [reminder.merchant_id, reminder.creance_id, msgMarchand, waMarchand]
        );

        await pool.query(
          `INSERT INTO relances (creance_id, type) VALUES ($1,$2)`,
          [reminder.creance_id, `auto_${reminder.type}`]
        );

        console.log(`  ✅ [${reminder.type}] ${reminder.client_name}`);
      } catch (err) {
        console.error(`  ❌ Reminder #${reminder.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('processDueReminders error:', err.message);
  }
};

const startReminderWorker = () => {
  console.log('🔄 Worker relances démarré (60s)');
  processDueReminders();
  return setInterval(processDueReminders, 60 * 1000);
};

module.exports = { startReminderWorker, processDueReminders };
