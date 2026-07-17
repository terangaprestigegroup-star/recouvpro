import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createCreance } from '../lib/api';
import { EXEMPLES_CREANCES, PLACEHOLDER_MONTANT, SECTEURS } from '../lib/secteurs';

export default function Ajouter() {
  const router = useRouter();
  const [form, setForm]         = useState({ client_name: '', phone: '', montant: '', description: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [secteur, setSecteur]   = useState('autre');
  const [secteurLabel, setSecteurLabel] = useState('');
  const [exemples, setExemples] = useState([]);
  const [showExemples, setShowExemples] = useState(false);

  useEffect(() => {
    const s = typeof window !== 'undefined' ? localStorage.getItem('rp_secteur') : 'autre' || 'autre';
    const l = typeof window !== 'undefined' ? localStorage.getItem('rp_secteur_label') : 'Commerce' || 'Commerce';
    setSecteur(s);
    setSecteurLabel(l);
    setExemples(EXEMPLES_CREANCES[s] || EXEMPLES_CREANCES.autre);
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const pickExemple = (ex) => {
    setForm(f => ({ ...f, description: ex }));
    setShowExemples(false);
  };

  const submit = async () => {
    if (!form.client_name.trim()) return setError('Entre le nom du client');
    if (!form.montant || isNaN(form.montant) || Number(form.montant) <= 0) {
      return setError('Entre un montant valide en FCFA');
    }
    setLoading(true);
    setError('');
    try {
      const { creance } = await createCreance({
        client_name: form.client_name.trim(),
        phone:       form.phone.replace(/\s/g, '') || null,
        montant:     Number(form.montant),
        description: form.description.trim() || exemples[0] || null,
        secteur,
      });
      localStorage.setItem('rp_last_creance', JSON.stringify({
        id:          creance.id,
        client_name: creance.client_name,
        montant:     creance.montant_initial,
        phone:       form.phone.replace(/\s/g, ''),
        description: creance.description,
        secteur,
      }));
      router.push('/wow');
    } catch (err) {
      if (err.error === 'LIMIT_REACHED') return router.push('/abonnement?reason=limit');
      setError('Problème de connexion. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  const secteurInfo = SECTEURS.find(s => s.id === secteur) || SECTEURS[0];

  return (
    <>
      <Head>
        <title>Fluxio — Qui te doit ?</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="page">

        {/* Header */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', padding: '4px' }}
            >←</button>
            <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1rem', color: 'var(--green)' }}>
              ⚡ Fluxio
            </span>
            <button
              onClick={() => router.push('/secteur')}
              style={{
                background: 'rgba(0,200,83,0.1)', border: '1px solid var(--green)',
                borderRadius: '20px', padding: '4px 10px',
                fontSize: '0.72rem', color: 'var(--green-dk)',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              {secteurInfo.emoji} {secteurLabel}
            </button>
          </div>

          {/* Progress */}
          <div className="progress-bar">
            <div className="fill" style={{ width: '33%' }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Étape 1 sur 3
          </p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '4px', color: 'var(--text-dark)' }}>
            Qui te doit de l'argent ?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '24px' }}>
            30 secondes — sans inscription
          </p>
        </div>

        {/* Formulaire */}
        <div className="page-pad fade-up" style={{ paddingTop: 0 }}>

          {/* Nom client */}
          <div className="input-group">
            <label>Nom du client *</label>
            <input
              type="text"
              placeholder="ex : Mamadou Diallo"
              value={form.client_name}
              onChange={set('client_name')}
              autoFocus
              style={{ fontSize: '1.05rem' }}
            />
          </div>

          {/* Montant */}
          <div className="input-group">
            <label>Montant dû (FCFA) *</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder={PLACEHOLDER_MONTANT[secteur] || 'ex : 15 000'}
              value={form.montant}
              onChange={set('montant')}
              style={{ fontSize: '1.05rem' }}
            />
          </div>

          {/* Description avec exemples rapides */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ marginBottom: 0 }}>Pour quoi ?</label>
              <button
                onClick={() => setShowExemples(!showExemples)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--green-dk)', fontSize: '0.72rem',
                  fontWeight: 600, cursor: 'pointer', padding: 0,
                }}
              >
                Exemples rapides ▾
              </button>
            </div>
            <input
              type="text"
              placeholder={exemples[0] || 'ex : tissu janvier'}
              value={form.description}
              onChange={set('description')}
            />

            {/* Chips exemples */}
            {showExemples && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {exemples.map(ex => (
                  <button
                    key={ex}
                    onClick={() => pickExemple(ex)}
                    style={{
                      background: 'var(--green-lt)',
                      border: '1px solid var(--green)',
                      borderRadius: '20px', padding: '5px 12px',
                      fontSize: '0.75rem', color: 'var(--green-dk)',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >{ex}</button>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp */}
          <div className="input-group">
            <label>WhatsApp du client (pour la relance)</label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="77 000 00 00"
              value={form.phone}
              onChange={set('phone')}
            />
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              📲 On lui enverra la relance directement
            </p>
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2', color: 'var(--red)',
              padding: '12px 16px', borderRadius: '10px',
              fontSize: '0.85rem', marginBottom: '16px',
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* CTA sticky */}
        <div className="cta-sticky">
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading}
            style={{ fontSize: '1rem' }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer →'}
          </button>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '8px' }}>
            Tes données sont sauvegardées localement
          </p>
        </div>

      </div>
    </>
  );
}
