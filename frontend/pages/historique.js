import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUTS = {
  nouvelle:           { label: 'Nouvelle',           color: '#3B82F6', bg: '#EFF6FF' },
  relancee:           { label: 'Relancée',            color: '#8B5CF6', bg: '#F5F3FF' },
  paiement_promis:    { label: 'Promis',              color: '#F59E0B', bg: '#FFFBEB' },
  partiellement_payee:{ label: 'Partiel',             color: '#F97316', bg: '#FFF7ED' },
  payee:              { label: 'Payée ✓',             color: '#16A34A', bg: '#F0FDF4' },
  annulee:            { label: 'Annulée',             color: '#9CA3AF', bg: '#F9FAFB' },
};

const fmtF = (n) => Number(n || 0).toLocaleString('fr-FR');
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export default function Historique() {
  const router = useRouter();
  const [creances, setCreances]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtre, setFiltre]       = useState('toutes');

  useEffect(() => {
    const token = localStorage.getItem('rp_token');
    fetch(`${API}/api/creances/historique`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => { setCreances(d.creances || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtres = [
    { id: 'toutes',    label: 'Toutes' },
    { id: 'payee',     label: 'Payées' },
    { id: 'active',    label: 'En cours' },
    { id: 'annulee',   label: 'Annulées' },
  ];

  const creancesFiltrees = creances.filter(cr => {
    if (filtre === 'toutes')  return true;
    if (filtre === 'active')  return !['payee', 'annulee'].includes(cr.statut);
    return cr.statut === filtre;
  });

  return (
    <>
      <Head>
        <title>Fluxio — Historique</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="page">

        <div className="topbar">
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>←</button>
          <span className="logo">💸 Historique</span>
          <div style={{ width: '32px' }} />
        </div>

        {/* Filtres */}
        <div style={{ padding: '16px 20px 0', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {filtres.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: `1.5px solid ${filtre === f.id ? 'var(--green)' : '#E5E7EB'}`,
                background: filtre === f.id ? 'var(--green-lt)' : '#fff',
                color: filtre === f.id ? 'var(--green-dk)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.78rem',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >{f.label}</button>
          ))}
        </div>

        <div style={{ padding: '16px 20px', flex: 1 }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '40px' }}>Chargement...</p>
          ) : creancesFiltrees.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '48px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
              <p style={{ color: 'var(--text-muted)' }}>Aucune créance ici</p>
            </div>
          ) : (
            <div className="card" style={{ padding: '4px 0' }}>
              {creancesFiltrees.map((cr, i) => {
                const s = STATUTS[cr.statut] || STATUTS.nouvelle;
                return (
                  <div key={cr.id} style={{
                    display: 'flex', alignItems: 'center',
                    padding: '13px 16px',
                    borderBottom: i < creancesFiltrees.length - 1 ? '1px solid #F5F5F5' : 'none',
                    gap: '12px',
                  }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: s.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Sora', fontWeight: 800, fontSize: '0.85rem',
                      color: s.color, flexShrink: 0,
                    }}>
                      {cr.client_name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                        {cr.client_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{
                          background: s.bg, color: s.color,
                          fontSize: '0.6rem', fontWeight: 700,
                          padding: '1px 6px', borderRadius: '10px',
                        }}>{s.label}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {fmtDate(cr.created_at)}
                        </span>
                      </div>
                      {cr.description && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cr.description}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: 'Sora', fontWeight: 800, fontSize: '0.85rem',
                        color: cr.statut === 'payee' ? 'var(--green-dk)' : 'var(--orange)',
                      }}>
                        {fmtF(cr.statut === 'payee' ? cr.montant_initial : cr.montant_restant)}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>FCFA</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
