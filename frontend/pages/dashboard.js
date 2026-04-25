import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getStats, getCreances, envoyerRelance, payerCreance, formatFCFA, isLoggedIn } from '../lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats]       = useState(null);
  const [creances, setCreances] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');
  const [paywall, setPaywall]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [payMontant, setPayMontant] = useState('');
  const [viaRecouvpro, setViaRecouvpro] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const load = async () => {
    try {
      const [s, c] = await Promise.all([getStats(), getCreances()]);
      setStats(s);
      setCreances(c.creances.filter(cr => cr.statut === 'actif'));
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRelance = async (creance) => {
    try {
      const shopName = localStorage.getItem('rp_shop') || 'Votre boutique';
      const { wa_link } = await envoyerRelance(creance.id, 'fr', shopName);
      window.open(wa_link, '_blank');
      showToast('📲 Relance envoyée !');
    } catch (err) {
      if (err.error === 'LIMIT_REACHED') return setPaywall(true);
      showToast('❌ Erreur relance');
    }
  };

  const handlePayer = async () => {
    if (!selected || !payMontant) return;
    try {
      await payerCreance(selected.id, Number(payMontant), '', viaRecouvpro);
      showToast('✅ Paiement enregistré !');
      setPayModal(false); setPayMontant(''); setSelected(null); setViaRecouvpro(false);
      load();
    } catch { showToast('❌ Erreur'); }
  };

  const getBadgeRec = (rec) => {
    if (!rec) return null;
    const colors = { wait: { bg: '#E8F5E9', color: '#007E33' }, soft: { bg: '#FEF9C3', color: '#854D0E' }, normal: { bg: '#FEF3C7', color: '#92400E' }, firm: { bg: '#FEE2E2', color: '#991B1B' } };
    const s = colors[rec.action] || colors.wait;
    return <span style={{ ...s, display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '0.62rem', fontWeight: 700, marginTop: '3px' }}>{rec.label}{rec.days > 0 ? ` · J+${rec.days}` : ''}</span>;
  };

  if (loading) return (
    <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
    </div>
  );

  return (
    <>
      <Head>
        <title>RecouvPro — Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="page">
        <div style={{ background: 'var(--dark)', padding: '24px 20px 28px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1.2rem', color: 'var(--green)' }}>💸 RecouvPro</span>
            {!isLoggedIn() && (
              <button onClick={() => router.push('/wow')} style={{ background: 'none', border: '1.5px solid #444', color: '#AAA', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>
                Se connecter
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '0.95rem', color: 'var(--orange)' }}>{formatFCFA(stats?.total_restant)}</div>
              <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '3px' }}>💸 À récupérer</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '0.95rem', color: 'var(--green)' }}>{formatFCFA(stats?.total_recupere)}</div>
              <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '3px' }}>✅ Récupéré</div>
            </div>
          </div>
          {stats?.nb_retard > 0 && (
            <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏰</span>
              <span style={{ color: '#FCA5A5', fontSize: '0.85rem', fontWeight: 500 }}>
                {stats.nb_retard} client{stats.nb_retard > 1 ? 's' : ''} en retard
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Créances actives ({creances.length})</h3>
          </div>
          {creances.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Aucune créance</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ajoute ton premier débiteur</p>
            </div>
          ) : (
            <div className="card">
              {creances.map((cr) => (
                <div key={cr.id} className="creance-item">
                  <div className="info" style={{ flex: 1 }}>
                    <div className="name">{cr.client_name}</div>
                    {getBadgeRec(cr.recommendation)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className="montant">{formatFCFA(cr.montant_restant)}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleRelance(cr)} style={{ background: 'var(--green-lt)', color: 'var(--green-dk)', border: 'none', borderRadius: '7px', padding: '5px 9px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>📲</button>
                      <button onClick={() => { setSelected(cr); setPayModal(true); }} style={{ background: '#FEF3C7', color: '#92400E', border: 'none', borderRadius: '7px', padding: '5px 9px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>💰</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cta-sticky">
          <button className="btn btn-primary" onClick={() => router.push('/ajouter')}>+ Nouvelle créance</button>
        </div>

        {toast && <div className="toast">{toast}</div>}

        {payModal && selected && (
          <div className="paywall" onClick={() => setPayModal(false)}>
            <div className="paywall-sheet" onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: '4px' }}>Paiement reçu</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                {selected.client_name} · Restant : {formatFCFA(selected.montant_restant)}
              </p>
              <div className="input-group">
                <label>Montant reçu (FCFA)</label>
                <input type="number" inputMode="numeric" placeholder={selected.montant_restant} value={payMontant} onChange={e => setPayMontant(e.target.value)} autoFocus />
              </div>
              <div style={{ background: 'var(--green-lt)', border: '1px solid var(--green)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '10px' }}>⚡ Payé grâce à RecouvPro ?</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ val: true, label: '✅ Oui' }, { val: false, label: '🤝 Non' }].map(({ val, label }) => (
                    <button key={String(val)} onClick={() => setViaRecouvpro(val)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `2px solid ${viaRecouvpro === val ? 'var(--green)' : '#E5E7EB'}`, background: viaRecouvpro === val ? 'var(--green-lt)' : '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => setPayModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handlePayer}>Confirmer ✓</button>
              </div>
            </div>
          </div>
        )}

        {paywall && (
          <div className="paywall" onClick={() => setPaywall(false)}>
            <div className="paywall-sheet" onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔒</div>
                <h3 style={{ marginBottom: '6px' }}>Limite atteinte</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Tu as <strong style={{ color: 'var(--orange)' }}>{formatFCFA(stats?.total_restant)}</strong> à récupérer.
                </p>
              </div>
              {['Créances illimitées', 'Relances illimitées', 'Historique complet'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>{f}
                </div>
              ))}
              <div style={{ textAlign: 'center', margin: '16px 0', fontFamily: 'Sora', fontSize: '1.6rem', fontWeight: 800 }}>
                2 500 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>FCFA/mois</span>
              </div>
              <button className="btn btn-primary" onClick={() => router.push('/abonnement')}>Passer Premium →</button>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '10px' }}>Sans engagement</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
