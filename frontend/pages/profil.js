import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isLoggedIn, logout } from '../lib/api';
import { SECTEURS } from '../lib/secteurs';

export default function Profil() {
  const router = useRouter();
  const [shopName, setShopName]   = useState('');
  const [secteur, setSecteur]     = useState('autre');
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    setShopName(localStorage.getItem('rp_shop') || '');
    setSecteur(localStorage.getItem('rp_secteur') || 'autre');
  }, []);

  const save = () => {
    localStorage.setItem('rp_shop', shopName.trim());
    localStorage.setItem('rp_secteur', secteur);
    const s = SECTEURS.find(x => x.id === secteur);
    if (s) {
      localStorage.setItem('rp_secteur_emoji', s.emoji);
      localStorage.setItem('rp_secteur_label', s.label);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Fluxio — Mon profil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="page">

        <div className="topbar">
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>←</button>
          <span className="logo">⚡ Fluxio</span>
          <div style={{ width: '32px' }} />
        </div>

        <div className="page-pad fade-up">

          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>
            Mon commerce
          </h2>

          {/* Nom boutique */}
          <div className="input-group">
            <label>Nom de ta boutique</label>
            <input
              type="text"
              placeholder="ex : Boutique Aminata"
              value={shopName}
              onChange={e => setShopName(e.target.value)}
            />
          </div>

          {/* Secteur */}
          <div className="input-group">
            <label>Type de commerce</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
            {SECTEURS.map(s => (
              <button
                key={s.id}
                onClick={() => setSecteur(s.id)}
                style={{
                  padding: '12px 8px',
                  borderRadius: '12px',
                  border: `2px solid ${secteur === s.id ? 'var(--green)' : '#E5E7EB'}`,
                  background: secteur === s.id ? 'var(--green-lt)' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{s.emoji}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: secteur === s.id ? 'var(--green-dk)' : 'var(--text-dark)' }}>
                  {s.label}
                </div>
              </button>
            ))}
          </div>

          {/* Séparateur */}
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
              COMPTE
            </h3>

            {isLoggedIn() ? (
              <button
                onClick={() => {
                  if (confirm('Se déconnecter ?')) logout();
                }}
                style={{
                  width: '100%', padding: '14px',
                  background: '#FEE2E2', color: 'var(--red)',
                  border: '1px solid #FECACA',
                  borderRadius: '12px', fontWeight: 700,
                  fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                Se déconnecter
              </button>
            ) : (
              <button
                onClick={() => router.push('/wow')}
                style={{
                  width: '100%', padding: '14px',
                  background: 'var(--green-lt)', color: 'var(--green-dk)',
                  border: '1px solid var(--green)',
                  borderRadius: '12px', fontWeight: 700,
                  fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                Créer un compte pour sauvegarder
              </button>
            )}
          </div>

          {/* Version */}
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            Fluxio V1.0 • Dakar, Sénégal 🇸🇳
          </p>
        </div>

        <div className="cta-sticky">
          <button
            className="btn btn-primary"
            onClick={save}
          >
            {saved ? '✅ Sauvegardé !' : 'Sauvegarder →'}
          </button>
        </div>

      </div>
    </>
  );
}
