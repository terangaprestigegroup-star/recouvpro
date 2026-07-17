import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { initierPaiement, getAbonnement } from '../lib/api';

// Blueprint Fluxio V1.1 §12-13
// Mensuel : 5 000 FCFA | Annuel : 55 000 FCFA (recommandé)
// Offre Fondateur : 3 500 FCFA/mois à vie pour les 100 premiers
// RÈGLE : afficher 5 000 FCFA comme prix officiel
// Fondateur = encart séparé, privilège exceptionnel
// Jamais de faux compteur places restantes

const PLANS = [
  {
    id:        'mensuel',
    label:     'Premium Mensuel',
    prix:      '5 000',
    duree:     'par mois',
    desc:      'Sans engagement',
    economie:  null,
    highlight: false,
  },
  {
    id:        'annuel',
    label:     'Premium Annuel',
    prix:      '55 000',
    duree:     'par an',
    desc:      '2 mois offerts',
    economie:  'Économisez 5 000 FCFA',
    highlight: true,
  },
];

export default function Abonnement() {
  const router  = useRouter();
  const [loading, setLoading]       = useState(false);
  const [plan, setPlan]             = useState(null);
  const [planChoisi, setPlanChoisi] = useState('annuel'); // annuel par défaut — recommandé
  const { reason, status }          = router.query;

  useEffect(() => {
    getAbonnement().then(d => setPlan(d)).catch(() => {});
  }, []);

  const payer = async () => {
    setLoading(true);
    try {
      const { invoice_url } = await initierPaiement(planChoisi);
      window.location.href = invoice_url;
    } catch {
      setLoading(false);
      alert('Erreur de paiement. Réessayez.');
    }
  };

  const isPremium = plan?.plan === 'premium';

  return (
    <>
      <Head>
        <title>Fluxio — Premium</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="page">
        <div className="topbar">
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>←</button>
          <span className="logo">⚡ Fluxio</span>
          <div style={{ width: '32px' }} />
        </div>

        <div className="page-pad fade-up">

          {/* Succès */}
          {status === 'success' && (
            <div className="card pop" style={{ background: 'var(--green-lt)', border: '2px solid var(--green)', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ marginBottom: '6px' }}>Premium activé !</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Historique illimité · Statistiques avancées · Relances automatiques</p>
            </div>
          )}

          {/* Annulé */}
          {status === 'cancel' && (
            <div className="card" style={{ background: '#FEF3C7', border: '1px solid #F59E0B', textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontWeight: 600 }}>Paiement annulé</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>Vous pouvez réessayer à tout moment. Le Starter reste disponible.</p>
            </div>
          )}

          {/* Limite (ne bloque plus le Starter — juste une invitation) */}
          {reason === 'upgrade' && !status && (
            <div style={{ background: 'var(--dark)', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '24px', color: '#fff' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⭐</div>
              <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '1rem' }}>
                Passez au niveau supérieur
              </p>
              <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '6px' }}>
                Statistiques avancées, historique illimité, relances automatiques.
              </p>
            </div>
          )}

          {isPremium ? (
            /* ── DÉJÀ PREMIUM ── */
            <div className="card" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⭐</div>
              <h3 style={{ marginBottom: '4px' }}>Vous êtes Premium</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                {plan?.type_plan === 'annuel' ? '📅 Abonnement annuel' : '📅 Abonnement mensuel'}
                {plan?.fin && ` · jusqu'au ${new Date(plan.fin).toLocaleDateString('fr-FR')}`}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '10px', lineHeight: 1.5 }}>
                À expiration : retour automatique au Starter.<br/>
                Aucune suppression de vos données.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>
                Passer au Premium
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Pilotez mieux votre trésorerie
              </p>

              {/* Fonctionnalités Premium */}
              <div className="card" style={{ marginBottom: '20px' }}>
                {[
                  { i: '📊', t: 'Statistiques avancées',   s: 'Taux de recouvrement, ROI, tendances' },
                  { i: '📋', t: 'Historique illimité',      s: 'Toutes vos créances sans limite' },
                  { i: '⚡', t: 'Relances automatiques',    s: 'J+1, J+3, J+7 — sans action de votre part' },
                  { i: '💬', t: 'Plusieurs modèles',        s: 'Douce, normale, ferme — Français ou Wolof' },
                ].map(({ i, t, s }, idx) => (
                  <div key={t} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px 0', borderBottom: idx < 3 ? '1px solid #F5F5F5' : 'none' }}>
                    <span style={{ fontSize: '1.3rem', width: '28px', textAlign: 'center' }}>{i}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Starter conservé */}
              <div style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--green-dk)', fontWeight: 600 }}>
                  ✅ Le plan Starter reste disponible gratuitement
                </p>
                <p style={{ fontSize: '0.72rem', color: '#555', marginTop: '3px' }}>
                  Créances, paiements, relances WhatsApp — sans limite. Toujours gratuit.
                </p>
              </div>

              {/* Choix plan */}
              <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '0.85rem', marginBottom: '12px' }}>
                Choisir un plan
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {PLANS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlanChoisi(p.id)}
                    style={{
                      padding: '16px', borderRadius: '14px',
                      border: `2px solid ${planChoisi === p.id ? 'var(--green)' : '#E5E7EB'}`,
                      background: planChoisi === p.id ? 'var(--green-lt)' : '#fff',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', textAlign: 'left', position: 'relative',
                    }}
                  >
                    {p.highlight && (
                      <span style={{ position: 'absolute', top: '-10px', right: '14px', background: 'var(--green)', color: '#0D1B0F', fontSize: '0.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: '10px' }}>
                        ⭐ RECOMMANDÉ
                      </span>
                    )}
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{p.label}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{p.desc}</p>
                      {p.economie && (
                        <p style={{ color: 'var(--green-dk)', fontSize: '0.72rem', fontWeight: 700, marginTop: '3px' }}>✅ {p.economie}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Sora', fontWeight: 900, fontSize: '1.1rem', color: planChoisi === p.id ? 'var(--green-dk)' : 'var(--text-dark)' }}>
                        {p.prix}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>FCFA {p.duree}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* OFFRE FONDATEUR — prix officiel 5000, fondateur encart séparé */}
              <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '14px', padding: '16px', marginBottom: '8px' }}>
                <p style={{ fontWeight: 800, fontSize: '0.88rem', color: '#FB923C', marginBottom: '8px' }}>
                  🔥 Offre Fondateur
                </p>
                <p style={{ fontSize: '0.78rem', color: '#888', lineHeight: 1.6, marginBottom: '10px' }}>
                  Les <strong style={{ color: '#FB923C' }}>100 premiers abonnés</strong> bénéficient du tarif Fondateur :{' '}
                  <strong style={{ color: '#FB923C' }}>3 500 FCFA/mois à vie</strong>.
                </p>
                <p style={{ fontSize: '0.72rem', color: '#666', lineHeight: 1.5 }}>
                  Conservez ce tarif tant que votre abonnement reste actif.<br/>
                  En cas de résiliation, le tarif fondateur est définitivement perdu.
                </p>
              </div>
            </>
          )}
        </div>

        {!isPremium && (
          <div className="cta-sticky">
            <button className="btn btn-primary" onClick={payer} disabled={loading}>
              {loading ? 'Redirection en cours...' : `Payer ${planChoisi === 'annuel' ? '55 000' : '5 000'} FCFA →`}
            </button>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '8px' }}>
              Wave • Orange Money • Sans engagement
            </p>
          </div>
        )}

        {isPremium && status === 'success' && (
          <div className="cta-sticky">
            <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
              Aller au tableau de bord →
            </button>
          </div>
        )}

      </div>
    </>
  );
}
