import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { envoyerRelance, saveAccount, verifyOTP, migrateSession, setToken, formatFCFA } from '../lib/api';

const STEPS = { WOW: 'wow', SAVE: 'save', OTP: 'otp', DONE: 'done' };

export default function Wow() {
  const router = useRouter();
  const [step, setStep]       = useState(STEPS.WOW);
  const [creance, setCreance] = useState(null);
  const [waLink, setWaLink]   = useState('');
  const [relanceSent, setRelanceSent] = useState(false);
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [merchantId, setMerchantId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [lang, setLang]       = useState('fr');

  useEffect(() => {
    const stored = localStorage.getItem('rp_last_creance');
    if (!stored) return router.replace('/ajouter');
    setCreance(JSON.parse(stored));
  }, []);

  const handleRelance = async () => {
    if (!creance) return;
    setLoading(true);
    try {
      const shopName = localStorage.getItem('rp_shop') || 'Votre boutique';
      const data = await envoyerRelance(creance.id, lang, shopName);
      setWaLink(data.wa_link);
      setRelanceSent(true);
      window.open(data.wa_link, '_blank');
      setTimeout(() => setStep(STEPS.SAVE), 1500);
    } catch {
      setError('Erreur, réessaie');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!phone && !email) return setError('Entre ton numéro ou email');
    setLoading(true);
    setError('');
    try {
      const data = await saveAccount({ phone: phone || null, email: email || null });
      setMerchantId(data.merchant_id);
      if (data.otp_wa_link) window.open(data.otp_wa_link, '_blank');
      setStep(STEPS.OTP);
    } catch {
      setError('Erreur, réessaie');
    } finally {
      setLoading(false);
    }
  };

  const handleOTP = async () => {
    if (otp.length !== 6) return setError('Code à 6 chiffres');
    setLoading(true);
    setError('');
    try {
      const data = await verifyOTP(merchantId, otp);
      setToken(data.token);
      const sessionCookie = document.cookie
        .split(';').find(c => c.trim().startsWith('rp_session='))?.split('=')[1];
      if (sessionCookie) await migrateSession(sessionCookie, merchantId);
      setStep(STEPS.DONE);
      setTimeout(() => router.push('/dashboard'), 1800);
    } catch {
      setError('Code incorrect ou expiré');
    } finally {
      setLoading(false);
    }
  };

  if (!creance) return null;

  if (step === STEPS.WOW) return (
    <>
      <Head><title>RecouvPro — Relance</title></Head>
      <div className="page">
        <div style={{ padding: '24px 20px 0' }}>
          <div className="progress-bar"><div className="fill" style={{ width: '66%' }} /></div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Étape 2 sur 3</p>
        </div>
        <div className="page-pad fade-up">
          <div className="card pop" style={{ background: 'var(--green-lt)', border: '2px solid var(--green)', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✅</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Créance enregistrée !</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong>{creance.client_name}</strong> te doit{' '}
              <strong style={{ color: 'var(--green-dk)' }}>{formatFCFA(creance.montant)}</strong>
            </p>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Langue de la relance</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            {[{ v: 'fr', l: '🇫🇷 Français' }, { v: 'wo', l: '🇸🇳 Wolof' }].map(({ v, l }) => (
              <button key={v} onClick={() => setLang(v)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `2px solid ${lang === v ? 'var(--green)' : '#E5E7EB'}`, background: lang === v ? 'var(--green-lt)' : '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>{l}</button>
            ))}
          </div>
          {error && <p style={{ color: 'var(--red)', marginBottom: '12px' }}>⚠️ {error}</p>}
        </div>
        <div className="cta-sticky">
          {creance.phone ? (
            <button className="btn btn-orange" onClick={handleRelance} disabled={loading}>
              {loading ? 'Ouverture WhatsApp...' : '📲 Envoyer la relance WhatsApp'}
            </button>
          ) : (
            <button className="btn btn-outline" onClick={() => { setRelanceSent(true); setStep(STEPS.SAVE); }}>
              Continuer sans relancer →
            </button>
          )}
        </div>
      </div>
    </>
  );

  if (step === STEPS.SAVE) return (
    <>
      <Head><title>RecouvPro — Sauvegarde</title></Head>
      <div className="page">
        <div style={{ padding: '24px 20px 0' }}>
          <div className="progress-bar"><div className="fill" style={{ width: '90%' }} /></div>
        </div>
        <div className="page-pad fade-up">
          {relanceSent && (
            <div style={{ background: 'var(--green)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ color: '#fff', fontWeight: 600 }}>🚀 Relance envoyée à {creance.client_name} !</p>
            </div>
          )}
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Sauvegarde tes données</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>Retrouve tes créances partout. Sans mot de passe.</p>
          <div className="input-group">
            <label>Ton numéro WhatsApp</label>
            <input type="tel" inputMode="tel" placeholder="+221 77 000 00 00" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="divider">ou</div>
          <div className="input-group">
            <label>Ton adresse email</label>
            <input type="email" inputMode="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {error && <p style={{ color: 'var(--red)', marginBottom: '12px' }}>⚠️ {error}</p>}
        </div>
        <div className="cta-sticky">
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Envoi du code...' : 'Sauvegarder →'}
          </button>
          <button className="btn btn-ghost" style={{ marginTop: '8px' }} onClick={() => router.push('/dashboard')}>
            Pas maintenant
          </button>
        </div>
      </div>
    </>
  );

  if (step === STEPS.OTP) return (
    <>
      <Head><title>RecouvPro — Code</title></Head>
      <div className="page">
        <div className="page-pad fade-up">
          <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📲</div>
            <h2 style={{ marginBottom: '8px' }}>Code envoyé !</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Entre le code à 6 chiffres reçu sur WhatsApp</p>
          </div>
          <div className="input-group">
            <input type="number" inputMode="numeric" placeholder="_ _ _ _ _ _" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.slice(0, 6))} style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '0.3em', fontFamily: 'Sora, sans-serif' }} />
          </div>
          {error && <p style={{ color: 'var(--red)', textAlign: 'center' }}>⚠️ {error}</p>}
        </div>
        <div className="cta-sticky">
          <button className="btn btn-primary" onClick={handleOTP} disabled={loading || otp.length !== 6}>
            {loading ? 'Vérification...' : 'Confirmer →'}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="page" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div className="pop">
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
        <h2>Compte créé !</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Redirection...</p>
      </div>
    </div>
  );
}
