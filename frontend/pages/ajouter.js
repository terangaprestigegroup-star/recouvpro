import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createCreance } from '../lib/api';

export default function Ajouter() {
  const router = useRouter();
  const [form, setForm]       = useState({ client_name: '', phone: '', montant: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.client_name.trim()) return setError('Écris le nom du client');
    if (!form.montant || isNaN(form.montant) || Number(form.montant) <= 0) {
      return setError('Entre un montant valide');
    }
    setLoading(true);
    setError('');
    try {
      const { creance } = await createCreance({
        client_name: form.client_name.trim(),
        phone:       form.phone.trim() || null,
        montant:     Number(form.montant),
        description: form.description.trim() || null,
      });
      localStorage.setItem('rp_last_creance', JSON.stringify({
        id:          creance.id,
        client_name: creance.client_name,
        montant:     creance.montant_initial,
        phone:       form.phone.trim(),
      }));
      router.push('/wow');
    } catch (err) {
      if (err.error === 'LIMIT_REACHED') return router.push('/abonnement?reason=limit');
      setError(err.message || 'Erreur, réessaie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>RecouvPro — Nouvelle créance</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="page">
        <div className="topbar">
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>←</button>
          <span className="logo">💸 RecouvPro</span>
          <div style={{ width: '32px' }} />
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <div className="progress-bar">
            <div className="fill" style={{ width: '33%' }} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Étape 1 sur 3</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>Qui te doit de l'argent ?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>Moins de 30 secondes</p>
        </div>

        <div className="page-pad fade-up" style={{ paddingTop: 0 }}>
          <div className="input-group">
            <label>Nom du client *</label>
            <input type="text" placeholder="ex : Mamadou Diallo" value={form.client_name} onChange={set('client_name')} autoFocus />
          </div>
          <div className="input-group">
            <label>Montant dû (FCFA) *</label>
            <input type="number" inputMode="numeric" placeholder="ex : 15000" value={form.montant} onChange={set('montant')} />
          </div>
          <div className="input-group">
            <label>WhatsApp du client (optionnel)</label>
            <input type="tel" inputMode="tel" placeholder="ex : 221 77 000 00 00" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="input-group">
            <label>Note (optionnel)</label>
            <input type="text" placeholder="ex : tissu acheté en janvier" value={form.description} onChange={set('description')} />
          </div>
          {error && (
            <div style={{ background: '#FEE2E2', color: 'var(--red)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="cta-sticky">
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer →'}
          </button>
        </div>
      </div>
    </>
  );
}
