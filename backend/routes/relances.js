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
    `la am ci
