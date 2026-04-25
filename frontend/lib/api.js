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

export const initSession     = ()                       => api('POST', '/api/session/init').catch(() => {});
export const migrateSession  = (sid, mid)               => api('POST', '/api/session/migrate', { session_id: sid, merchant_id: mid });
export const saveAccount     = (p)                      => api('POST', '/api/auth/save', p);
export const verifyOTP       = (merchant_id, code)      => api('POST', '/api/auth/otp/verify', { merchant_id, code });
export const logout          = async () => { await api('POST', '/api/auth/logout').catch(() => {}); localStorage.removeItem('rp_token'); window.location.href = '/'; };
export const getCreances     = ()                       => api('GET',  '/api/creances');
export const createCreance   = (p)                      => api('POST', '/api/creances', p);
export const payerCreance    = (id, montant, note, via) => api('PATCH', `/api/creances/${id}/payer`, { montant, note: note || '', via_recouvpro: !!via });
export const getStats        = ()                       => api('GET',  '/api/creances/stats');
export const getStatsROI     = ()                       => api('GET',  '/api/stats');
export const envoyerRelance  = (id, lang, shop)         => api('POST', `/api/relances/${id}`, { lang, shop_name: shop });
export const getNotifications = ()                      => api('GET',  '/api/notifications');
export const getNotifsCount  = ()                       => api('GET',  '/api/notifications/count');
export const marquerToutLu   = ()                       => api('PATCH', '/api/notifications/tout-lu');
export const initierPaiement = ()                       => api('POST', '/api/abonnement/initier');
export const getAbonnement   = ()                       => api('GET',  '/api/abonnement/statut');
export const getClients      = ()                       => api('GET',  '/api/clients');
export const formatFCFA      = (n)                      => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
export const isLoggedIn      = ()                       => typeof window !== 'undefined' && !!localStorage.getItem('rp_token');
export const setToken        = (t)                      => localStorage.setItem('rp_token', t);
