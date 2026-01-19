import { useEffect, useRef, useState } from 'react';
import '../styles/FacebookEmbed.css';

const FACEBOOK_PAGE_ID = '61586532852672';
const FACEBOOK_URL = `https://www.facebook.com/profile.php?id=${FACEBOOK_PAGE_ID}`;

declare global {
  interface Window {
    FB?: {
      XFBML: {
        parse: () => void;
      };
    };
  }
}

const FacebookEmbed = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadFacebookSDK = () => {
      if (document.getElementById('facebook-jssdk')) {
        if (window.FB) {
          window.FB.XFBML.parse();
          setIsLoading(false);
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/es_LA/sdk.js#xfbml=1&version=v18.0';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        setTimeout(() => {
          setIsLoading(false);
          if (window.FB) {
            window.FB.XFBML.parse();
          }
        }, 1000);
      };

      script.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };

      document.body.appendChild(script);
    };

    // Timeout para mostrar fallback si tarda mucho
    const timeout = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 10000);

    loadFacebookSDK();

    return () => clearTimeout(timeout);
  }, [isLoading]);

  return (
    <section id="redes" className="facebook-section">
      <div className="facebook-container">
        <div className="section-header">
          <h2 className="section-title">Síguenos en Facebook</h2>
        </div>

        <div className="facebook-content">
          <div className="facebook-info">
            <p>
              Mantente informado con las últimas noticias de Santander.
              Síguenos en nuestra página de Facebook para recibir actualizaciones
              en tiempo real sobre política, economía, seguridad y más.
            </p>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="facebook-cta"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Visitar página de Facebook
            </a>
          </div>

          <div className="facebook-embed-wrapper" ref={containerRef}>
            {isLoading && (
              <div className="facebook-loading">
                <div className="facebook-spinner"></div>
                <p>Cargando contenido de Facebook...</p>
              </div>
            )}

            {hasError ? (
              <div className="facebook-fallback">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <h3>Berraquera Santandereana</h3>
                <p>Medio digital de noticias de Santander</p>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="facebook-fallback-btn"
                >
                  Ir a Facebook
                </a>
              </div>
            ) : (
              <div
                className="fb-page"
                data-href={FACEBOOK_URL}
                data-tabs="timeline"
                data-width="500"
                data-height="600"
                data-small-header="false"
                data-adapt-container-width="true"
                data-hide-cover="false"
                data-show-facepile="true"
              >
                <blockquote cite={FACEBOOK_URL} className="fb-xfbml-parse-ignore">
                  <a href={FACEBOOK_URL}>Berraquera Santandereana</a>
                </blockquote>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FacebookEmbed;
