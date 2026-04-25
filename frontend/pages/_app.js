import '../styles/globals.css';
import { useEffect } from 'react';
import { initSession } from '../lib/api';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    initSession();
  }, []);

  return <Component {...pageProps} />;
}
