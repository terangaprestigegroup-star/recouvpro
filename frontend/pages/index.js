import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState, useEffect } from 'react';

const METIERS = [
  '🏪 Boutique',     '🧵 Tissus & Bazin', '💄 Cosmétique',
  '🍽️ Restaurant',   '📱 Téléphones',     '🔧 Quincaillerie',
  '✂️ Tailleur',     '📦 Grossiste',      '💊 Pharmacie',
];

export default function Landing() {
  const router = useRouter();
  const [metierIdx, setMetierIdx] = useState(0);
  const [visible, setVisible]     = useState(false);

  useEffect(() => {
    setVisible(true);
    const m = setInterval(() => setMetierIdx(i => (i + 1) % METIERS.length), 1400);
    return () => clearInterval(m);
  }, []);

  const handleStart = () => {
    const secteur = typeof window !== 'undefined'
      ? localStorage.getItem('rp_secteur') : null;
    router.push(secteur ? '/ajouter' : '/secteur');
  };

  return (
    <>
      <Head>
        <title>Fluxio — Gérez vos créances et votre trésorerie</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content="Suivez vos paiements, récupérez vos créances, maîtrisez votre trésorerie." />
      </Head>

      <div style={{
        background: '#0A1A0C', minHeight: '100vh',
        maxWidth: '480px', margin: '0 auto',
        fontFamily: "'DM Sans', sans-serif", color: '#fff',
      }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>⚡</div>
            <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>Fluxio</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', borderRadius: '20px', padding: '6px 14px', fontSize: '0.72rem', cursor: 'pointer' }}
          >Connexion</button>
        </div>

        <div style={{
          padding: '32px 20px 24px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all .5s ease',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '20px', padding: '5px 12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.8rem' }}>{METIERS[metierIdx]}</span>
          </div>

          <h1 style={{ fontFamily: 'Sora', fontWeight: 900, fontSize: '2.1rem', lineHeight: 1.12, marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Suivez vos paiements.<br/>
            Récupérez vos créances.<br/>
            <span style={{ color: 'var(--green)' }}>Maîtrisez votre trésorerie.</span>
          </h1>

          <p style={{ color: '#7A8A7A', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '24px' }}>
            Un outil simple pour commerçants sénégalais.<br/>
            Enregistrez, suivez, relancez. En 30 secondes.
          </p>

          <div style={{ background: 'rgba(230,81,0,0.1)', border: '1px solid rgba(230,81,0,0.25)', borderRadius: '12px', padding: '14px 16px', marginBottom: '28px' }}>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FB923C', marginBottom: '6px' }}>
              💡 Le coût de l'abonnement est souvent inférieur au montant d'une seule créance oubliée.
            </p>
            <p style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.5 }}>
              Une seule créance récupérée peut rentabiliser plusieurs mois d'abonnement.
            </p>
          </div>

          <button onClick={handleStart} style={{ display: 'block', width: '100%', padding: '18px', background: 'var(--green)', color: '#0A1A0C', border: 'none', borderRadius: '14px', fontFamily: 'Sora', fontWeight: 900, fontSize: '1.05rem', cursor: 'pointer', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,200,83,0.3)' }}>
            Commencer gratuitement →
          </button>
          <p style={{ textAlign: 'center', color: '#333', fontSize: '0.72rem', marginTop: '10px' }}>
            Gratuit • Sans engagement • Sans carte bancaire
          </p>
        </div>

        <div style={{ padding: '0 20px 24px' }}>
          <p style={{ fontSize: '0.65rem', color: '#3D5C3D', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>Le plan Starter vous permet de</p>
          {[
            { e: '➕', t: 'Créer vos créances',         s: 'Nom, montant, description — 30 secondes' },
            { e: '✏️', t: 'Modifier et supprimer',      s: 'Mettez à jour vos données à tout moment' },
            { e: '💰', t: 'Enregistrer les paiements',  s: 'Paiement total, partiel ou promesse' },
            { e: '📲', t: 'Relancer sur WhatsApp',      s: 'Message pré-rempli en Français ou Wolof' },
            { e: '📊', t: 'Consulter votre dashboard',  s: 'Argent dû, récupéré, clients en retard' },
          ].map(({ e, t, s }) => (
            <div key={t} style={{ display: 'flex', gap: '14px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{e}</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.83rem', marginBottom: '2px' }}>{t}</p>
                <p style={{ color: '#666', fontSize: '0.73rem' }}>{s}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '0 20px 0' }}>
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '0.65rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Tarifs</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #1a1a1a', marginBottom: '12px' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Starter</p>
                <p style={{ color: '#555', fontSize: '0.72rem', marginTop: '2px' }}>Toutes les fonctions essentielles</p>
              </div>
              <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1rem' }}>Gratuit</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #1a1a1a', marginBottom: '12px' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Premium</p>
                <p style={{ color: '#555', fontSize: '0.72rem' }}>Stats avancées · Historique illimité</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1rem' }}>5 000</div>
                <div style={{ fontSize: '0.6rem', color: '#555' }}>FCFA/mois</div>
              </div>
            </div>
            <div style={{ background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.18)', borderRadius: '10px', padding: '12px', marginBottom: '12px', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-10px', right: '12px', background: 'var(--green)', color: '#0A1A0C', fontSize: '0.58rem', fontWeight: 800, padding: '3px 8px', borderRadius: '10px' }}>⭐ RECOMMANDÉ</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Premium Annuel</p>
                  <p style={{ color: 'var(--green)', fontSize: '0.72rem', fontWeight: 600, marginTop: '2px' }}>Économisez 5 000 FCFA</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1rem', color: 'var(--green)' }}>55 000</div>
                  <div style={{ fontSize: '0.6rem', color: '#555' }}>FCFA/an</div>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: '10px', padding: '12px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#FB923C', marginBottom: '6px' }}>🔥 Offre Fondateur</p>
              <p style={{ fontSize: '0.75rem', color: '#888', lineHeight: 1.5 }}>
                Les 100 premiers abonnés Premium bénéficient de{' '}
                <strong style={{ color: '#FB923C' }}>3 500 FCFA/mois à vie</strong>.
              </p>
            </div>
            <p style={{ color: '#333', fontSize: '0.65rem', textAlign: 'center', marginTop: '12px' }}>Wave • Orange Money • PayDunya</p>
          </div>
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, #0A1A0C 70%, transparent)', padding: '20px 20px 32px', marginTop: '24px' }}>
          <button onClick={handleStart} style={{ display: 'block', width: '100%', padding: '18px', background: 'var(--green)', color: '#0A1A0C', border: 'none', borderRadius: '14px', fontFamily: 'Sora', fontWeight: 900, fontSize: '1.05rem', cursor: 'pointer', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,200,83,0.25)' }}>
            Commencer gratuitement →
          </button>
          <p style={{ textAlign: 'center', color: '#333', fontSize: '0.7rem', marginTop: '8px' }}>Sans carte • Sans engagement</p>
        </div>

      </div>
    </>
  );
}
