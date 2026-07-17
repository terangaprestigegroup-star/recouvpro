import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getNotifications, marquerToutLu } from '../lib/api';

const fmtF    = (n)  => Number(n || 0).toLocaleString('fr-FR');
const fmtDate = (d)  => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1)   return 'À l\'instant';
  if (diff < 60)  return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff/60)}h`;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const TYPE_CONFIG = {
  relance_auto:   { emoji: '⏰', label: 'Rappel automatique',  color: '#3B82F6' },
  reminder_auto:  { emoji: '📅', label: 'Relance programmée',  color: '#8B5CF6' },
  auto_soft:      { emoji: '🟡', label: 'Relance douce J+1',   color: '#F59E0B' },
  auto_normal:    { emoji: '🟠', label: 'Relance normale J+3', color: '#F97316' },
  auto_firm:      { emoji: '🔴', label: 'Relance ferme J+7',   color: '#EF4444' },
};

export default function Notifications() {
  const router = useRouter();
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(d => { setNotifs(d.notifications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleToutLu = async () => {
    await marquerToutLu();
    setNotifs(notifs.map(n => ({ ...n, lu: true })));
  };

  const nonLues = notifs.filter(n => !n.lu).length;

  return (
    <>
      <Head>
        <title>Fluxio — Notifications</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="page">

        <div className="topbar">
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}
          >←</button>
          <span className="logo">🔔 Rappels</span>
          {nonLues > 0 && (
            <button
              onClick={handleToutLu}
              style={{
                background: 'none', border: 'none',
                color: 'var(--green-dk)', fontSize: '0.78rem',
                fontWeight: 600, cursor: 'pointer',
              }}
            >Tout lire</button>
          )}
        </div>

        <div style={{ padding: '16px 20px', flex: 1 }}>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '40px' }}>
              Chargement...
            </p>
          ) : notifs.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔕</div>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Aucun rappel</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Les rappels automatiques apparaissent ici
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifs.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.relance_auto;
                return (
                  <div
                    key={n.id}
                    style={{
                      background: n.lu ? '#fff' : 'rgba(0,200,83,0.04)',
                      border: `1px solid ${n.lu ? '#E5E7EB' : 'rgba(0,200,83,0.2)'}`,
                      borderRadius: '14px', padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{cfg.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            color: cfg.color, textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            {cfg.label}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {fmtDate(n.created_at)}
                          </span>
                        </div>

                        {n.client_name && (
                          <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                            {n.client_name}
                          </p>
                        )}

                        {n.montant_restant && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--orange)', fontWeight: 700, marginBottom: '8px' }}>
                            {fmtF(n.montant_restant)} FCFA en attente
                          </p>
                        )}

                        {/* Bouton envoyer relance via wa.me */}
                        {n.wa_link && (
                          <a
                            href={n.wa_link}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-block',
                              background: 'var(--green)', color: '#0D1B0F',
                              padding: '8px 16px', borderRadius: '20px',
                              fontSize: '0.78rem', fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            📲 Envoyer la relance
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
