import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { initierPaiement, getAbonnement, formatFCFA } from '../lib/api';

export default function Abonnement() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan]       = useState(null);
  const { reason, status }    = router.query;

  useEffect(() => {
    getAbonnement().then(d => setPlan(d)).catch(() => {});
  }, []);

  const payer = async () => {
    setLoading(true);
    try {
      const { invoice_url } = await initierPaiement();
      window.location.href = invoice_url;
    } catch {
      setLoading(false);
      alert('Erreur paiement. Réessaie.');
    }
  };

  const isPremium = plan?.plan === 'premium';

  return (
    <>
      <Head>
        <title>RecouvPro — Premium</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="page">
        <div className="topbar">
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>←</button>
          <span className="logo">💸 RecouvPro</span>
          <div style={{ width: '32px' }} />
        </div>

        <div className="page-pad fade-up">
          {status === 'success' && (
            <div className="card pop" style={{ background: 'var(--green-lt)', border: '2px solid var(--green)', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
              <h3>Premium activé !</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Toutes les fonctionnalités sont débloquées.</p>
            </div>
          )}

          {status === 'cancel' && (
            <div className="card" style={{ background: '#FEF3C7', border: '2px solid #F59E0B', textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontWeight: 600 }}>Paiement annulé</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Tu peux réessayer à tout moment.</p>
            </div>
          )}

          {reason === 'limit' && !status && (
            <div style={{ background: 'var(--dark)', borderRadius: '14px', padding: '20px', textAlign: 'center', marginBottom: '24px', color: '#fff' }}>
              <p style={{ fontSize: '0.85rem', color: '#AAA', marginBottom: '4px' }}>Limite gratuite atteinte</p>
              <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '1.1rem' }}>
                Passe Premium pour continuer
              </p>
            </div>
          )}

          {isPremium ? (
            <div className="card" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⭐</div>
              <h3>Tu es Premium !</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Abonnement actif jusqu'au{' '}
                {plan.fin ? new Date(plan.fin).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ background: 'var(--dark)', borderRadius: '20px', padding: '28px 24px', textAlign: 'center', marginBottom: '20px', color: '#fff' }}>
                <span className="badge badge-green" style={{ marginBottom: '12px' }}>PREMIUM</span>
                <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '2.8rem', color: 'var(--green)', lineHeight: 1 }}>
                  2 500<span style={{ fontSize: '1rem', color: '#AAA', fontWeight: 400 }}> FCFA</span>
                </div>
                <p style={{ color: '#AAA', fontSize: '0.85rem', marginTop: '4px' }}>par mois • Sans engagement</p>
              </div>

              <div className="card" style={{ marginBottom: '20px' }}>
                {[
                  { i: '♾️', t: 'Créances illimitées',  s: 'Plus de limite de 5' },
                  { i: '📲', t: 'Relances illimitées',  s: 'Envoie autant que tu veux' },
                  { i: '📊', t: 'Historique complet',   s: 'Tous tes recouvrements' },
                  { i: '⚡', t: 'Relances auto',        s: 'J+1, J+3, J+7 automatiques' },
                ].map(({ i, t, s }) => (
                  <div key={t} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F0F0F0' }}>
                    <span style={{ fontSize: '1.4rem' }}>{i}</span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!isPremium && (
          <div className="cta-sticky">
            <button className="btn btn-primary" onClick={payer} disabled={loading}>
              {loading ? 'Redirection...' : 'Payer avec Wave / Orange Money →'}
            </button>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '8px' }}>
              Paiement sécurisé via PayDunya • Sans engagement
            </p>
          </div>
        )}

        {isPremium && status === 'success' && (
          <div className="cta-sticky">
            <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
              Aller au dashboard →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
