import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { SECTEURS } from '../lib/secteurs';

export default function Secteur() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleChoix = (secteur) => {
    setSelected(secteur.id);
    setLoading(true);
    localStorage.setItem('rp_secteur', secteur.id);
    localStorage.setItem('rp_secteur_emoji', secteur.emoji);
    localStorage.setItem('rp_secteur_label', secteur.label);
    setTimeout(() => router.push('/ajouter'), 600);
  };

  return (
    <>
      <Head>
        <title>Fluxio — Ton commerce</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="page" style={{ background: 'var(--dark)' }}>

        {/* Header */}
        <div style={{ padding: '32px 24px 0', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'var(--green)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
          }}>💸</div>
          <h1 style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 800,
            fontSize: '1.5rem', color: '#fff', marginBottom: '8px',
          }}>
            Quel est ton commerce ?
          </h1>
          <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.5 }}>
            On personnalise Fluxio pour vous
          </p>
        </div>

        {/* Grille secteurs */}
        <div style={{
          padding: '28px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          flex: 1,
        }}>
          {SECTEURS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleChoix(s)}
              disabled={loading}
              style={{
                background: selected === s.id
                  ? 'rgba(0,200,83,0.15)'
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${selected === s.id ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '14px',
                padding: '16px 12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all .2s',
                transform: selected === s.id ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{s.emoji}</div>
              <div style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700, fontSize: '0.78rem',
                color: selected === s.id ? 'var(--green)' : '#ccc',
                lineHeight: 1.3,
              }}>{s.label}</div>
              <div style={{
                fontSize: '0.65rem', color: '#555',
                marginTop: '2px', fontStyle: 'italic',
              }}>{s.label_wo}</div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 40px', textAlign: 'center' }}>
          <p style={{ color: '#444', fontSize: '0.72rem' }}>
            Tu pourras changer ça plus tard dans les paramètres
          </p>
        </div>

      </div>
    </>
  );
}
