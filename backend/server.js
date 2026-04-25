require('dotenv').config();

const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn:              process.env.SENTRY_DSN,
    environment:      process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
}

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');

const sessionRoutes       = require('./routes/session');
const authRoutes          = require('./routes/auth');
const creancesRoutes      = require('./routes/creances');
const clientsRoutes       = require('./routes/clients');
const relancesRoutes      = require('./routes/relances');
const abonnementRoutes    = require('./routes/abonnement');
const notificationsRoutes = require('./routes/notifications');
const statsRoutes         = require('./routes/stats');
const remindersRoutes     = require('./routes/reminders');
const auditRoutes         = require('./routes/audit');

const { startReminderWorker } = require('./services/worker');
const { limitGlobal }         = require('./services/rateLimiter');
const { sanitize }            = require('./middleware/ownership');

const app  = express();
const PORT = process.env.PORT || 4000;

if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.requestHandler());

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const ALLOWED = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} non autorisé`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(sanitize);
app.use('/api', limitGlobal);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
);

app.use('/api/session',       sessionRoutes);
app.use('/api/auth',          authRoutes);
app.use('/api/creances',      creancesRoutes);
app.use('/api/clients',       clientsRoutes);
app.use('/api/relances',      relancesRoutes);
app.use('/api/abonnement',    abonnementRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api/reminders',     remindersRoutes);
app.use('/api/audit',         auditRoutes);

if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.errorHandler());

app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

app.use((err, req, res, next) => {
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  console.error('[ERROR]', err.message);
  res.status(500).json({
    error:  'Erreur serveur',
    detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`✅ RecouvPro API → http://localhost:${PORT}`);
  startReminderWorker();
});
