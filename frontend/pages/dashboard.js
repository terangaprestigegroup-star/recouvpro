import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getStats, getCreances, envoyerRelance, payerCreance, formatFCFA, isLoggedIn, getNotifsCount } from '../lib/api';
import { HEADLINE_DASHBOARD, SECTEURS, MESSAGES_WA } from '../lib/secteurs';

const fmtF = (n) => Number(n || 0).toLocaleString('fr-FR');

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats]           = useState(null);
  const [creances, setCreances]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState('');
  const [paywall, setPaywall]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [payModal, setPayModal]     = useState(false);
  const [payMontant, setPayMontant] = useState('');
  const [viaRecouvpro, setViaRecouvpro] = useState(false);
  const [secteur, setSecteur]       = useState('autre');
  const [secteurEmoji, setSecteurEmoji] = useState('🏪');
  const [nbNotifs, setNbNotifs]     = useState(0);
  const [shopName, setShopName]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const load = async () => {
    try {
      const [s, c] = await Promise.all([getStats(), getCreances()]);
      setStats(s);
      setCreances(c.creances.filter(cr => cr.statut === 'actif'));
      if (isLoggedIn()) {
        const n = await getNotifsCount();
        setNbNotifs(n.count || 0);
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => {
    const s  = localStorage.getItem('rp_secteur') : 'autre' || 'autre';
    const em = localStorage.getItem('rp_secteur_emoji') || '🏪';
    const sh = localStorage.getItem('rp_shop') || '';
    setSecteur(s);
    setSecteurEmoji(em);
    setShopName(sh);
    load();
  }, []);

  const handleRelance = async (creance) => {
    try {
      // Générer lien wa.me local selon secteur + lang stockée
      const lang     = 'fr';
      const shopName = localStorage.getItem('rp_shop') || 'Votre boutique';
      const templates = MESSAGES_WA[lang]?.soft;
      const fn = templates?.[secteur] || templates?.autre;
      const msg  = fn ? fn(creance.client_name, fmtF(creance.montant_restant)) : `Salam ${creance.client_name} 👋\nRappel pour les ${fmtF(creance.montant_restant)} FCFA. Merci 🙏`;
      const phone = creance.client_phone?.replace(/\D/g, '');

      if (phone) {
        const link = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(link, '_blank');
      }

      // Logger via API
      await envoyerRelance(creance.id, lang, shopName).catch(() => {});
      showToast('📲 Relance ouverte !');
    } catch (err) {
      if (err.error === 'LIMIT_REACHED') return setPaywall(true);
      showToast('❌ Erreur');
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

  const getBadge = (rec) => {
    if (!rec || rec.action === 'wait') return null;
    const cfg = {
      soft:   { bg: '#FEF9C3', color: '#854D0E', label: '🟡 Relancer' },
      normal: { bg: '#FEF3C7', color: '#92400E', label: '🟠 Urgent' },
      firm:   { bg: '#FEE2E2', color: '#991B1B', label: '🔴 Très urgent' },
    };
    const c = cfg[rec.action];
    if (!c) return null;
    return (
      <span style={{ background: c.bg, color: c.color, display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: 700, marginTop: '3px' }}>
        {c.label} · J+{rec.days}
      </span>
    );
  };

  if (loading) return (
    <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💸</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chargement...</p>
      </div>
    </div>
  );

  const totalRestant = Number(stats?.total_restant || 0);
  const totalRecupere = Number(stats?.total_recupere || 0);
  const nbRetard = Number(stats?.nb_retard || 0);

  return (
    <>
      <Head>
        <title>Fluxio — Mon argent</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="page">

        {/* ── HEADER DARK ── */}
        <div style={{ background: 'var(--dark)', padding: '20px 20px 24px' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>⚡ Fluxio</span>
              <span style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: '20px',
                padding: '2px 8px', fontSize: '0.65rem', color: '#888',
              }}>{secteurEmoji}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {nbNotifs > 0 && (
                <div style={{
                  background: 'var(--orange)', borderRadius: '50%',
                  width: '22px', height: '22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800, color: '#fff', cursor: 'pointer',
                }} onClick={() => router.push('/notifications')}>
                  {nbNotifs}
                </div>
              )}
              {!isLoggedIn() && (
                <button onClick={() => router.push('/wow')} style={{ background: 'none', border: '1px solid #333', color: '#888', borderRadius: '8px', padding: '5px 10px', fontSize: '0.72rem', cursor: 'pointer' }}>
                  Connexion
                </button>
              )}
            </div>
          </div>

          {/* Titre émotionnel par secteur */}
          <p style={{ color: '#666', fontSize: '0.72rem', marginBottom: '6px' }}>
            {HEADLINE_DASHBOARD[secteur] || '💰 Argent à récupérer'}
          </p>

          {/* Montant principal — GROS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontFamily: 'Sora', fontWeight: 900,
              fontSize: totalRestant > 999999 ? '2rem' : '2.6rem',
              color: totalRestant > 0 ? 'var(--orange)' : 'var(--green)',
              lineHeight: 1,
            }}>
              {fmtF(totalRestant)}
            </div>
            <div style={{ color: '#666', fontSize: '0.72rem', marginTop: '4px' }}>
              FCFA à récupérer
            </div>
          </div>

          {/* Stats secondaires */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '0.9rem', color: 'var(--green)' }}>
                {fmtF(totalRecupere)}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#555', marginTop: '2px' }}>✅ Récupéré</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '0.9rem', color: nbRetard > 0 ? '#FCA5A5' : '#fff' }}>
                {nbRetard}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#555', marginTop: '2px' }}>⏰ En retard</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                {creances.length}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#555', marginTop: '2px' }}>📋 Créances</div>
            </div>
          </div>

          {/* Alerte retard */}
          {nbRetard > 0 && (
            <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>⏰</span>
              <span style={{ color: '#FCA5A5', fontSize: '0.8rem', fontWeight: 600 }}>
                {nbRetard} client{nbRetard > 1 ? 's' : ''} n'a{nbRetard > 1 ? '' : 's'} pas payé depuis +7 jours
              </span>
            </div>
          )}
        </div>

        {/* ── LISTE CRÉANCES ── */}
        <div style={{ padding: '16px 20px', flex: 1 }}>

          {creances.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '48px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ marginBottom: '8px', color: 'var(--text-dark)' }}>
                {totalRecupere > 0 ? 'Tout est à jour !' : 'Aucune créance'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {totalRecupere > 0
                  ? `Tu as récupéré ${fmtF(totalRecupere)} FCFA 💪`
                  : 'Ajoute ton premier client qui te doit de l\'argent'
                }
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                  {creances.length} client{creances.length > 1 ? 's' : ''} à relancer
                </p>
              </div>

              <div className="card" style={{ padding: '4px 0' }}>
                {creances.map((cr) => (
                  <div key={cr.id} style={{
                    display: 'flex', alignItems: 'center',
                    padding: '14px 16px', borderBottom: '1px solid #F5F5F5',
                    gap: '12px',
                  }}>
                    {/* Avatar lettre */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'var(--green-lt)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Sora', fontWeight: 800, fontSize: '0.9rem',
                      color: 'var(--green-dk)', flexShrink: 0,
                    }}>
                      {cr.client_name[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-dark)', marginBottom: '2px' }}>
                        {cr.client_name}
                      </div>
                      {cr.description && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cr.description}
                        </div>
                      )}
                      {getBadge(cr.recommendation)}
                    </div>

                    {/* Montant + actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <span style={{
                        fontFamily: 'Sora', fontWeight: 800,
                        fontSize: '0.9rem', color: 'var(--orange)',
                      }}>
                        {fmtF(cr.montant_restant)}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleRelance(cr)}
                          style={{
                            background: 'var(--green)', color: '#0D1B0F',
                            border: 'none', borderRadius: '8px',
                            padding: '6px 10px', fontSize: '0.75rem',
                            fontWeight: 700, cursor: 'pointer',
                          }}
                        >📲</button>
                        <button
                          onClick={() => { setSelected(cr); setPayModal(true); }}
                          style={{
                            background: '#FEF3C7', color: '#92400E',
                            border: 'none', borderRadius: '8px',
                            padding: '6px 10px', fontSize: '0.75rem',
                            fontWeight: 700, cursor: 'pointer',
                          }}
                        >💰</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── CTA STICKY ── */}
        <div className="cta-sticky">
          <button className="btn btn-primary" onClick={() => router.push('/ajouter')} style={{ fontSize: '1rem' }}>
            + Ajouter une créance
          </button>
        </div>

        {/* Toast */}
        {toast && <div className="toast">{toast}</div>}

        {/* ── MODAL PAYER ── */}
        {payModal && selected && (
          <div className="paywall" onClick={() => setPayModal(false)}>
            <div className="paywall-sheet" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--green-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora', fontWeight: 800, fontSize: '1rem', color: 'var(--green-dk)' }}>
                  {selected.client_name[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selected.client_name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Reste : {fmtF(selected.montant_restant)} FCFA
                  </p>
                </div>
              </div>

              <div className="input-group">
                <label>Montant reçu (FCFA)</label>
                <input type="number" inputMode="numeric" placeholder={selected.montant_restant} value={payMontant} onChange={e => setPayMontant(e.target.value)} autoFocus />
              </div>

              <div style={{ background: 'var(--green-lt)', border: '1px solid var(--green)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
                  ⚡ Payé grâce à Fluxio ?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ val: true, label: '✅ Oui, relance a marché' }, { val: false, label: '🤝 Non, il est venu seul' }].map(({ val, label }) => (
                    <button key={String(val)} onClick={() => setViaRecouvpro(val)} style={{ flex: 1, padding: '8px 6px', borderRadius: '8px', border: `2px solid ${viaRecouvpro === val ? 'var(--green)' : '#E5E7EB'}`, background: viaRecouvpro === val ? 'var(--green-lt)' : '#fff', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', lineHeight: 1.3 }}>{label}</button>
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

        {/* ── PAYWALL ── */}
        {paywall && (
          <div className="paywall" onClick={() => setPaywall(false)}>
            <div className="paywall-sheet" onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔒</div>
                <h3 style={{ marginBottom: '8px' }}>Limite gratuite atteinte</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Tu as <strong style={{ color: 'var(--orange)' }}>{fmtF(totalRestant)} FCFA</strong> à récupérer.<br/>
                  Passe Premium pour continuer.
                </p>
              </div>
              {['Créances illimitées', 'Relances illimitées', 'Rappels J+1 J+3 J+7'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F5F5F5', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 800 }}>✓</span>{f}
                </div>
              ))}
              <div style={{ textAlign: 'center', margin: '16px 0', fontFamily: 'Sora', fontSize: '1.8rem', fontWeight: 900 }}>
                2 500 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>FCFA/mois</span>
              </div>
              <p style={{ textAlign: 'center', color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '12px' }}>
                💡 = récupère 8× l'abonnement dès le 1er mois
              </p>
              <button className="btn btn-primary" onClick={() => router.push('/abonnement')}>
                Passer Premium →
              </button>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '10px' }}>
                Sans engagement • Wave / Orange Money
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
