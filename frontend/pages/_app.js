import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { initSession } from '../lib/api';

const PAGES_LIBRES = ['/', '/secteur', '/abonnement'];

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // C10 FIX — localStorage uniquement côté client
    if (typeof window === 'undefined') return;

    initSession();

    // Redirect onboarding secteur si premier lancement
    const secteur = localStorage.getItem('rp_secteur');
    const path    = window.location.pathname;

    if (!secteur && !PAGES_LIBRES.includes(path) && path !== '/secteur') {
      if (path !== '/') router.replace('/secteur');
    }
  }, []);

  return <Component {...pageProps} />;
}
