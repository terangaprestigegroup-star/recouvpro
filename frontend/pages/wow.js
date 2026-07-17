import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { envoyerRelance, saveAccount, verifyOTP, migrateSession, setToken, formatFCFA } from '../lib/api';
import { MESSAGES_WA } from '../lib/secteurs';

const STEPS = { WOW: 'wow', SAVE: 'save', OTP: 'otp', DONE: 'done' };

const fmtF = (n) => Number(n || 0).toLocaleString('fr-FR');

export default function Wow() {
  const router = useRouter();
  const [step, setStep]               = useState(STEPS.WOW);
  const [creance, setCreance]         = useState(null);
  const [relanceSent, setRelanceSent] = useState(false);
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [merchantId, setMerchantId]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [lang, setLang]               = useState('fr');
  const [secteur, setSecteur]         = useState('autre');
  const [msgPreview, setMsgPreview]   = useState('');

  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('rp_last_creance');
    if (!stored) return router.replace('/ajouter');
    const c = JSON.parse(stored);
    setCreance(c);
    const s = typeof window !== 'undefined' ? localStorage.getItem('rp_secteur') || 'autre' : 'autre';
    setSecteur(s);
    // Générer aperçu message
    genPreview(c, s, 'fr', 'soft');
  }, []);

  const genPreview = (c, s, l, type) => {
    const templates = MESSAGES_WA[l]?.[type];
    const fn = templates?.[s] || templates?.autre;
    if (fn) setMsgPreview(fn(c.client_name, fmtF(c.montant)));
  };

  useEffect(() => {
    if (creance) genPreview(creance, secteur, lang, 'soft');
  }, [lang, secteur, creance]);

  const handleRelance = async () => {
    if (!creance) return;
    setLoading(true);
    try {
      const shopName = localStorage.getItem('rp_shop') || 'Votre boutique';
      const data = await envoyerRelance(creance.id, lang, shopName);
      setRelanceSent(true);
      window.open(data.wa_link, '_blank');
      setTimeout(() => setStep(STEPS.SAVE), 1600);
    } catch {
      // Fallback — générer lien wa.me local si API échoue
      if (creance.phone) {
        const templates = MESSAGES_WA[lang]?.soft;
        const fn = templates?.[secteur] || templates?.autre;
        const msg = fn ? fn(creance.client_name, fmtF(creance.montant)) : `Salam ${creance.client_name} 👋 Rappel pour les ${fmtF(creance.montant)} FCFA. Merci 🙏`;
        const link = `https://wa.me/${creance.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
        setRelanceSent(true);
        window.open(link, '_blank');
        setTimeout(() => setStep(STEPS.SAVE), 1600);
      } else {
        setError('Ajoute le numéro WhatsApp pour relancer');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!phone && !email) return setError('Entre ton numéro WhatsApp');
    setLoading(true); setError('');
    try {
      const data = await saveAccount({ phone: phone || null, email: email || null });
      setMerchantId(data.merchant_id);
      if (data.otp_wa_link) window.open(data.otp_wa_link, '_blank');
      setStep(STEPS.OTP);
    } catch { setError('Erreur. Réessaie.'); }
    finally { setLoading(false); }
  };

  const handleOTP = async () => {
    if (otp.length !== 6) return setError('Code à 6 chiffres');
    setLoading(true); setError('');
    try {
      const data = await verifyOTP(merchantId, otp);
      setToken(data.token);
      const sessionCookie = document.cookie.split(';').find(c => c.trim().startsWith('rp_session='))?.split('=')[1];
      if (sessionCookie) await migrateSession(sessionCookie, merchantId);
      setStep(STEPS.DONE);
      setTimeout(() => router.push('/dashboard'), 1800);
    } catch { setError('Code incorrect ou expiré'); }
    finally { setLoading(false); }
  };

  if (!creance) return null;

  // ── STEP WOW ────────────────────────────────────
  if (step === STEPS.WOW) return (
    <>
      <Head><title>Fluxio — Envoyer la relance</title></Head>
      <div className="page">

        <div style={{ padding: '20px 20px 0' }}>
          <div className="progress-bar"><div className="fill" style={{ width: '66%' }} /></div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Étape 2 sur 3</p>
        </div>

        <div className="page-pad fade-up" style={{ paddingTop: '16px' }}>

          {/* Confirmation créance */}
          <div style={{
            background: 'var(--green-lt)', border: '2px solid var(--green)',
            borderRadius: '16px', padding: '20px', textAlign: 'center',
            marginBottom: '20px',
          }} className="pop">
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>✅</div>
            <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
              Enregistré !
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <strong style={{ color: 'var(--text-dark)' }}>{creance.client_name}</strong> te doit{' '}
              <strong style={{ color: 'var(--green-dk)', fontSize: '1.05rem' }}>
                {fmtF(creance.montant)} FCFA
              </strong>
            </p>
            {creance.description && (
              <span style={{
                display: 'inline-block', marginTop: '8px',
                background: '#fff', borderRadius: '20px',
                padding: '3px 10px', fontSize: '0.72rem',
                color: 'var(--text-muted)', border: '1px solid #E5E7EB',
              }}>
                📌 {creance.description}
              </span>
            )}
          </div>

          {/* Choix langue */}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            Langue de la relance
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[{ v: 'fr', l: '🇫🇷 Français' }, { v: 'wo', l: '🇸🇳 Wolof' }].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setLang(v)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  border: `2px solid ${lang === v ? 'var(--green)' : '#E5E7EB'}`,
                  background: lang === v ? 'var(--green-lt)' : '#fff',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem',
                  color: lang === v ? 'var(--green-dk)' : 'var(--text-dark)',
                }}
              >{l}</button>
            ))}
          </div>

          {/* Aperçu message */}
          <div style={{
            background: '#F0FDF4', borderRadius: '12px',
            padding: '14px 16px', marginBottom: '20px',
            border: '1px solid #D1FAE5',
          }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Aperçu WhatsApp
            </p>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--text-dark)', whiteSpace: 'pre-line' }}>
              {msgPreview || `Salam ${creance.client_name} 👋\nPetit rappel pour les ${fmtF(creance.montant)} FCFA. Merci 🙏`}
            </p>
          </div>

          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '12px' }}>⚠️ {error}</p>}
        </div>

        <div className="cta-sticky">
          {creance.phone ? (
            <button className="btn btn-orange" onClick={handleRelance} disabled={loading}>
              {loading ? 'Ouverture WhatsApp...' : '📲 Envoyer sur WhatsApp maintenant'}
            </button>
          ) : (
            <div>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Pas de numéro → relance manuelle
              </p>
              <button className="btn btn-outline" onClick={() => { setRelanceSent(true); setStep(STEPS.SAVE); }}>
                Continuer →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ── STEP SAVE ────────────────────────────────────
  if (step === STEPS.SAVE) return (
    <>
      <Head><title>Fluxio — Sauvegarde</title></Head>
      <div className="page">
        <div style={{ padding: '20px 20px 0' }}>
          <div className="progress-bar"><div className="fill" style={{ width: '90%' }} /></div>
        </div>
        <div className="page-pad fade-up">
          {relanceSent && (
            <div style={{ background: 'var(--green)', borderRadius: '14px', padding: '14px 16px', marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                🚀 Relance envoyée à {creance.client_name} !
              </p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', marginTop: '4px' }}>
                Tu seras notifié si ça fonctionne
              </p>
            </div>
          )}

          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px', fontWeight: 800 }}>
            Sauvegarde tes créances
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.5 }}>
            Sans compte, tes données disparaissent si tu fermes l'app.
            Entre ton numéro — c'est tout.
          </p>

          <div className="input-group">
            <label>Ton numéro WhatsApp</label>
            <input type="tel" inputMode="tel" placeholder="77 000 00 00" value={phone} onChange={e => setPhone(e.target.value)} autoFocus />
          </div>
          <div className="divider">ou</div>
          <div className="input-group">
            <label>Email (optionnel)</label>
            <input type="email" inputMode="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            🔒 Code WhatsApp envoyé • Pas de mot de passe
          </p>
          {error && <p style={{ color: 'var(--red)', marginTop: '12px', fontSize: '0.85rem' }}>⚠️ {error}</p>}
        </div>

        <div className="cta-sticky">
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Envoi du code...' : 'Sauvegarder mes créances →'}
          </button>
          <button className="btn btn-ghost" style={{ marginTop: '8px' }} onClick={() => router.push('/dashboard')}>
            Pas maintenant
          </button>
        </div>
      </div>
    </>
  );

  // ── STEP OTP ─────────────────────────────────────
  if (step === STEPS.OTP) return (
    <>
      <Head><title>Fluxio — Code</title></Head>
      <div className="page">
        <div className="page-pad fade-up">
          <div style={{ textAlign: 'center', marginTop: '48px', marginBottom: '36px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📲</div>
            <h2 style={{ marginBottom: '8px', fontSize: '1.3rem' }}>Code envoyé sur WhatsApp</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Entre les 6 chiffres reçus</p>
          </div>
          <div className="input-group">
            <input
              type="number" inputMode="numeric"
              placeholder="• • • • • •"
              maxLength={6} value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '0.4em', fontFamily: 'Sora' }}
            />
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

  // ── STEP DONE ─────────────────────────────────────
  return (
    <div className="page" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px' }}>
      <div className="pop">
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ marginBottom: '8px' }}>Compte créé !</h2>
        <p style={{ color: 'var(--text-muted)' }}>Redirection vers ton dashboard...</p>
      </div>
    </div>
  );
}
