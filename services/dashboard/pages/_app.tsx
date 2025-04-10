import '../styles/globals.css';
import { AppProps } from 'next/app';
import Navbar from '../components/Navbar';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navbar />
      <div className="page-container">
        <Component {...pageProps} />
      </div>
      <style jsx global>{`
        .page-container {
          padding-top: 1rem;
        }
      `}</style>
    </>
  );
}

export default MyApp; 