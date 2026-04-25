const pool = require('../db');

const ACTIONS = {
  CREANCE_CREATED:    'creance_created',
  CREANCE_UPDATED:    'creance_updated',
  CREANCE_PAID:       'creance_paid',
  RELANCE_SENT:       'relance_sent',
  ACCOUNT_CREATED:    'account_created',
  LOGIN_SUCCESS:      'login_success',
  LOGIN_FAILED:       'login_failed',
  ABONNEMENT_WEBHOOK: 'abonnement_webhook',
  ACCESS_DENIED:      'access_denied',
};

const log = async (req, actionType, { targetType, targetId, metadata } = {}) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs
         (merchant_id, session_id, action_type, target_type, target_id, metadata, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        req.merchantId || null,
        req.sessionId  || null,
        actionType,
        targetType     || null,
        targetId       || null,
        metadata ? JSON.stringify(metadata) : null,
        (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '').substring(0, 45),
        (req.headers['user-agent'] || '').substring(0, 300),
      ]
    );
  } catch (err) {
    console.error('audit silent error:', err.message);
  }
};

const logCreanceCree    = (req, id, montant) => log(req, ACTIONS.CREANCE_CREATED,    { targetType: 'creance',  targetId: id, metadata: { montant } });
const logCreancePaye    = (req, id, montant) => log(req, ACTIONS.CREANCE_PAID,       { targetType: 'creance',  targetId: id, metadata: { montant } });
const logRelanceEnvoyee = (req, id, type)    => log(req, ACTIONS.RELANCE_SENT,       { targetType: 'creance',  targetId: id, metadata: { type } });
const logCompteCreé     = (req, id)          => log(req, ACTIONS.ACCOUNT_CREATED,    { targetType: 'merchant', targetId: id });
const logLoginSuccess   = (req, id)          => log(req, ACTIONS.LOGIN_SUCCESS,      { targetType: 'merchant', targetId: id });
const logLoginFailed    = (req, phone)       => log(req, ACTIONS.LOGIN_FAILED,       { metadata: { phone } });
const logAccessDenied   = (req, reason)      => log(req, ACTIONS.ACCESS_DENIED,      { metadata: { reason } });
const logWebhook        = (req, ref, amount) => log(req, ACTIONS.ABONNEMENT_WEBHOOK, { metadata: { ref, amount } });

module.exports = {
  ACTIONS, log,
  logCreanceCree, logCreancePaye, logRelanceEnvoyee,
  logCompteCreé, logLoginSuccess, logLoginFailed,
  logAccessDenied, logWebhook,
};
