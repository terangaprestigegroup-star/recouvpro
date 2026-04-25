const pool = require('../db');

const getOrCreateSession = async (req, res, next) => {
  let sessionId = req.cookies.rp_session;

  if (sessionId) {
    const { rows } = await pool.query(
      `SELECT id FROM sessions WHERE id=$1 AND expires_at > NOW()`,
      [sessionId]
    );
    if (rows.length > 0) {
      req.sessionId = sessionId;
      return next();
    }
  }

  const deviceId = req.headers['user-agent']?.substring(0, 200) || 'unknown';
  const { rows } = await pool.query(
    `INSERT INTO sessions (device_id) VALUES ($1) RETURNING id`,
    [deviceId]
  );

  sessionId = rows[0].id;
  res.cookie('rp_session', sessionId, {
    maxAge:   7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  });

  req.sessionId = sessionId;
  next();
};

module.exports = { getOrCreateSession };
