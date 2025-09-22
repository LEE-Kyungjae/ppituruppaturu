import { AppProps } from 'next/app';
import '@/styles/globals.css';
import MaintenanceBanner from '@/components/admin/MaintenanceBanner';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <MaintenanceBanner />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;