import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState, useEffect } from 'react';

const STATS = [
  { val: '47 000', label: 'FCFA récupérés en moyenne / mois' },
  { val: '3 min',  label: 'Pour envoyer la 1ère relance' },
  { val: '68%',    label: 'Des dettes relancées sont payées' },
];

export default function Landing() {
  const router = useRouter();
  const [statIdx, setStatIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStatIdx(i => (i + 1) % STATS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Head>
        <title>RecouvPro — Récupère ton argent bloqué</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="page" style={{ background: 'var(--dark)', color: '#fff' }}>

        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--green)' }}>
            💸 RecouvPro
          </span>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: '1px solid #333', color: '#888', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}
          >Connexion</button>
        </div>

        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.25)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>💰</span>
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)', lineHeight: 1 }}>
                {STATS[statIdx].val}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>
                {STATS[statIdx].label}
              </div>
            </div>
          </div>
        </div>

        <div className="fade-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '28px 24px' }}>

          <div style={{ background: 'var(--green)', borderRadius: '16px', padding: '5px 12px', display: 'inline-block', marginBottom: '16px', width: 'fit-content' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--dark)' }}>
              🇸🇳 Pour les commerçants sénégalais
            </span>
          </div>

          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '14px' }}>
            Récupère<br/>
            <span style={{ color: 'var(--green)' }}>ton argent</span><br/>
            bloqué
          </h1>

          <p style={{ color: '#A0AEC0', fontSize: '1rem', lineHeight: 1.6, marginBottom: '10px' }}>
            Tes clients te doivent de l'argent ?<br/>
            Relances WhatsApp automatiques en 1 clic.
          </p>

          <div style={{ background: 'rgba(255,109,0,0.12)', border: '1px solid rgba(255,109,0,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '28px' }}>
            <p style={{ color: 'var(--orange)', fontSize: '0.9rem', fontWeight: 600 }}>
              📈 Tu peux récupérer{' '}
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '1rem' }}>
                20 000 à 100 000 FCFA/mois
              </span>
            </p>
            <p style={{ color: '#888', fontSize: '0.72rem', marginTop: '4px' }}>
              On ne vend pas un logiciel — on t'aide à récupérer ton argent
            </p>
          </div>

          <button
            className="btn btn-primary"
            style={{ fontSize: '1.05rem', padding: '20px' }}
            onClick={() => router.push('/ajouter')}
          >
            Récupère ton argent →
          </button>
          <p style={{ textAlign: 'center', color: '#555', fontSize: '0.78rem', marginTop: '10px' }}>
            Gratuit pour commencer • Sans inscription • Sans carte
          </p>
        </div>

        <div style={{ padding: '0 24px 16px' }}>
          <p style={{ color: '#444', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Comment ça marche
          </p>
          {[
            { n: '1', t: 'Ajoute un débiteur',  s: 'Nom + montant en 30 secondes. Sans compte.' },
            { n: '2', t: 'Envoie la relance',    s: 'Message WhatsApp pré-écrit Français ou Wolof.' },
            { n: '3', t: 'Récupère ton argent',  s: 'Relances auto J+1, J+3, J+7 si pas de paiement.' },
          ].map(({ n, t, s }) => (
            <div key={n} style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: 'var(--dark)', flexShrink: 0 }}>{n}</div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{t}</p>
                <p style={{ color: '#666', fontSize: '0.78rem' }}>{s}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '0 24px 48px' }}>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #1e1e1e', marginBottom: '14px' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Gratuit</p>
                <p style={{ color: '#666', fontSize: '0.75rem' }}>5 créances actives</p>
              </div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#fff' }}>0 FCFA</span>
            </div>
            <div style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Premium</p>
                    <span style={{ background: 'var(--green)', color: 'var(--dark)', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>RECOMMANDÉ</span>
                  </div>
                  <p style={{ color: '#888', fontSize: '0.75rem' }}>Créances + relances illimitées</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>
                    2 500<span style={{ fontSize: '0.7rem', color: '#666' }}> FCFA</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#555' }}>par mois</div>
                </div>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,200,83,0.15)', fontSize: '0.75rem', color: 'var(--green)' }}>
                💡 Récupère 20 000 FCFA = tu récupères 8× l'abonnement
              </div>
            </div>
            <p style={{ color: '#444', fontSize: '0.68rem', textAlign: 'center' }}>
              Paiement Wave • Orange Money • PayDunya
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
