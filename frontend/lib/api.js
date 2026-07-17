const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
let isRefreshing = false;

const api = async (method, path, body = null, retry = true) => {
  const opts = {
    method, credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  const token = typeof window !== 'undefined' ? localStorage.getItem('rp_token') : null;
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);

  const res  = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();

  // Refresh silencieux
  if (res.status === 401 && data.error === 'SESSION_EXPIRED' && retry && !isRefreshing) {
    isRefreshing = true;
    try {
      const r = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      if (d.token) {
        localStorage.setItem('rp_token', d.token);
        isRefreshing = false;
        return api(method, path, body, false);
      }
    } catch {}
    isRefreshing = false;
    localStorage.removeItem('rp_token');
    window.location.href = '/';
    throw { status: 401, error: 'SESSION_EXPIRED' };
  }

  if (!res.ok) throw { status: res.status, ...data };
  return data;
};

// ── Session ──────────────────────────────────────
export const initSession     = ()              => api('POST', '/api/session/init').catch(() => {});
export const migrateSession  = (sid, mid)      => api('POST', '/api/session/migrate', { session_id: sid, merchant_id: mid });

// ── Auth ─────────────────────────────────────────
export const saveAccount     = (p)             => api('POST', '/api/auth/save', p);
export const verifyOTP       = (mid, code)     => api('POST', '/api/auth/otp/verify', { merchant_id: mid, code });
export const logout          = async () => {
  await api('POST', '/api/auth/logout').catch(() => {});
  localStorage.removeItem('rp_token');
  window.location.href = '/';
};

// ── Créances ─────────────────────────────────────
export const getCreances     = ()              => api('GET',  '/api/creances');
export const getHistorique   = ()              => api('GET',  '/api/creances/historique');
export const createCreance   = (p)             => api('POST', '/api/creances', p);
export const updateStatut    = (id, statut)    => api('PATCH', `/api/creances/${id}/statut`, { statut });
export const payerCreance    = (id, montant, note = '', via = false) =>
  api('PATCH', `/api/creances/${id}/payer`, { montant, note, via_recouvpro: via });
export const annulerCreance  = (id)            => api('DELETE', `/api/creances/${id}`);

// ── Stats ─────────────────────────────────────────
export const getStats        = ()              => api('GET', '/api/creances/stats');
export const getStatsROI     = ()              => api('GET', '/api/stats');

// ── Relances ─────────────────────────────────────
export const envoyerRelance  = (id, lang, shop) =>
  api('POST', `/api/relances/${id}`, { lang, shop_name: shop });

// ── Notifications ────────────────────────────────
export const getNotifications = ()             => api('GET',  '/api/notifications');
export const getNotifsCount  = ()              => api('GET',  '/api/notifications/count');
export const marquerToutLu   = ()              => api('PATCH', '/api/notifications/tout-lu');

// ── Abonnement ───────────────────────────────────
// type_plan : 'mensuel' (2500 FCFA) | 'annuel' (27500 FCFA)
export const initierPaiement = (type_plan = 'mensuel') =>
  api('POST', '/api/abonnement/initier', { type_plan });
export const getAbonnement   = ()              => api('GET', '/api/abonnement/statut');

// ── Clients ──────────────────────────────────────
export const getClients      = ()              => api('GET', '/api/clients');

// ── Helpers ──────────────────────────────────────
export const formatFCFA = (n) =>
  Number(n || 0).toLocaleString('fr-FR') + ' FCFA';

export const isLoggedIn = () =>
  typeof window !== 'undefined' && !!localStorage.getItem('rp_token');

export const setToken = (t) =>
  localStorage.setItem('rp_token', t);
