const pool = require('../db');

const MESSAGES = {
  soft: (nom, montant) =>
    `Bonjour ${nom} 👋\n\nPetit rappel pour votre paiement de *${fmtF(montant)} FCFA*.\n\nMerci 🙏`,
  normal: (nom, montant) =>
    `Bonjour ${nom},\n\nVotre paiement de *${fmtF(montant)} FCFA* est en attente.\n\nMerci de régulariser dès que possible.`,
  firm: (nom, montant) =>
    `Bonjour ${nom},\n\n⚠️ Dernier rappel concernant *${fmtF(montant)} FCFA*.\n\nMerci de régulariser aujourd'hui.`,
};

const fmtF = (n) => Number(n).toLocaleString('fr-FR');

const waLink = (phone, msg) =>
  `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

const createReminderSequence = async (creance) => {
  const { id, merchant_id, client_name, montant_restant, client_phone } = creance;
  const sequence = [
    { type: 'soft',   days: 1 },
    { type: 'normal', days: 3 },
    { type: 'firm',   days: 7 },
  ];
  const inserts = sequence.map(({ type, days }) => {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + days);
    scheduledAt.setHours(9, 0, 0, 0);
    const msg  = MESSAGES[type](client_name, montant_restant);
    const link = client_phone ? waLink(client_phone, msg) : null;
    return pool.query(
      `INSERT INTO reminders (creance_id, merchant_id, type, scheduled_at, message, wa_link)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, merchant_id, type, scheduledAt, msg, link]
    );
  });
  await Promise.all(inserts);
};

const cancelReminders = async (creanceId) => {
  await pool.query(
    `UPDATE reminders SET sent=TRUE, sent_at=NOW()
     WHERE creance_id=$1 AND sent=FALSE`,
    [creanceId]
  );
};

const getRecommendation = (creance) => {
  const created  = new Date(creance.created_at);
  const daysLate = Math.floor((Date.now() - created.getTime()) / 86400000);
  if (daysLate < 1)  return { label: '🟢 Attendre',        action: 'wait',   days: daysLate };
  if (daysLate <= 3) return { label: '🟡 Relance douce',   action: 'soft',   days: daysLate };
  if (daysLate <= 7) return { label: '🟠 Relance normale', action: 'normal', days: daysLate };
  return               { label: '🔴 Urgent',              action: 'firm',   days: daysLate };
};

const buildRelanceLink = (creance, type = null) => {
  const rec  = type || getRecommendation(creance).action;
  if (rec === 'wait') return null;
  const msg  = MESSAGES[rec]?.(creance.client_name, creance.montant_restant) || '';
  const link = creance.client_phone ? waLink(creance.client_phone, msg) : null;
  return { type: rec, message: msg, wa_link: link };
};

module.exports = {
  createReminderSequence,
  cancelReminders,
  getRecommendation,
  buildRelanceLink,
  MESSAGES,
};
