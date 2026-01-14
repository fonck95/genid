import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../styles/SocialFeed.css';

// ============================================
// TYPES & INTERFACES
// ============================================

interface SocialNetwork {
  name: string;
  icon: string;
  url: string;
  username: string;
  color: string;
  followers?: string;
  posts?: string;
  description?: string;
}

type TabId = 'all' | 'twitter' | 'facebook' | 'instagram' | 'youtube';

// ============================================
// SOCIAL NETWORKS DATA - CUENTAS REALES VERIFICADAS
// ============================================

const socialNetworks: SocialNetwork[] = [
  {
    name: 'X (Twitter)',
    icon: 'twitter',
    url: 'https://x.com/JairoComunes',
    username: '@JairoComunes',
    color: '#000000',
    followers: '1.2K',
    posts: '890+',
    description: 'Posiciones políticas y noticias en tiempo real'
  },
  {
    name: 'Facebook',
    icon: 'facebook',
    url: 'https://www.facebook.com/jairo.cala.50',
    username: 'jairo.cala.50',
    color: '#1877F2',
    followers: '3.8K',
    posts: '420+',
    description: 'Eventos, fotos y actualizaciones de campaña'
  },
  {
    name: 'Instagram',
    icon: 'instagram',
    url: 'https://www.instagram.com/jairocalasantander',
    username: '@jairocalasantander',
    color: '#E4405F',
    followers: '2.1K',
    posts: '185+',
    description: 'Galería visual y momentos de la gestión'
  },
  {
    name: 'YouTube',
    icon: 'youtube',
    url: 'https://www.youtube.com/@jairocala5746',
    username: '@jairocala5746',
    color: '#FF0000',
    followers: '410+',
    posts: '35+',
    description: 'Entrevistas, discursos y contenido audiovisual'
  }
];

// ============================================
// SVG ICONS COMPONENT
// ============================================

const SocialIcon: React.FC<{ network: string; size?: number }> = ({ network, size = 24 }) => {
  const icons: Record<string, React.ReactNode> = {
    facebook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    instagram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    twitter: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    youtube: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    heart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
    refresh: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
    ),
    external: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
      </svg>
    ),
    live: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="8"/>
      </svg>
    ),
    play: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    ),
    verified: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    )
  };

  return <>{icons[network] || null}</>;
};

// ============================================
// SOCIAL CARD COMPONENT
// ============================================

const SocialCard: React.FC<{ network: SocialNetwork; index: number }> = ({ network, index }) => {
  return (
    <a
      href={network.url}
      target="_blank"
      rel="noopener noreferrer"
      className="social-card"
      style={{
        '--card-color': network.color,
        '--animation-delay': `${index * 0.1}s`
      } as React.CSSProperties}
    >
      <div className="social-card-icon">
        <SocialIcon network={network.icon} size={28} />
      </div>
      <div className="social-card-content">
        <div className="social-card-header">
          <h4>{network.name}</h4>
          <span className="social-followers-badge">{network.followers} seguidores</span>
        </div>
        <span className="social-username">{network.username}</span>
        <div className="social-stats-mini">
          <span>{network.posts} publicaciones</span>
        </div>
        {network.description && (
          <p className="social-description">{network.description}</p>
        )}
      </div>
      <div className="social-card-arrow">
        <SocialIcon network="external" size={18} />
      </div>
    </a>
  );
};

// ============================================
// LIVE FEED INDICATOR
// ============================================

const LiveIndicator: React.FC = () => (
  <div className="live-indicator">
    <span className="live-dot"></span>
    <span className="live-text">En vivo</span>
  </div>
);

// ============================================
// TWITTER EMBED COMPONENT
// ============================================

const TwitterEmbed: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadTwitterWidget = () => {
      // Check if script is already loaded
      const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = () => {
          setLoaded(true);
          setTimeout(() => {
            if (window.twttr?.widgets) {
              window.twttr.widgets.load(containerRef.current);
            }
          }, 100);
        };
        script.onerror = () => setError(true);
        document.body.appendChild(script);
      } else {
        setLoaded(true);
        if (window.twttr?.widgets) {
          window.twttr.widgets.load(containerRef.current);
        }
      }
    };

    loadTwitterWidget();
  }, []);

  useEffect(() => {
    if (loaded && window.twttr?.widgets && containerRef.current) {
      window.twttr.widgets.load(containerRef.current);
    }
  }, [loaded]);

  return (
    <div className="embedded-feed twitter-embedded">
      <div className="embedded-feed-header">
        <div className="feed-title">
          <SocialIcon network="twitter" size={22} />
          <h3>X (Twitter)</h3>
          <LiveIndicator />
        </div>
        <a
          href="https://x.com/JairoComunes"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-btn follow-btn-twitter"
        >
          Seguir @JairoComunes
        </a>
      </div>

      <div className="embed-content-wrapper" ref={containerRef}>
        {error ? (
          <div className="embed-error">
            <SocialIcon network="twitter" size={48} />
            <p>No se pudo cargar el timeline</p>
            <a
              href="https://x.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="embed-error-link"
            >
              Ver en X directamente
            </a>
          </div>
        ) : (
          <>
            <a
              className="twitter-timeline"
              data-height="600"
              data-theme="light"
              data-chrome="noheader nofooter noborders"
              data-lang="es"
              data-dnt="true"
              data-tweet-limit="5"
              href="https://twitter.com/JairoComunes?ref_src=twsrc%5Etfw"
            >
              <div className="embed-loading">
                <div className="loading-spinner"></div>
                <p>Cargando tweets de @JairoComunes...</p>
              </div>
            </a>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// FACEBOOK EMBED COMPONENT
// ============================================

const FacebookEmbed: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Initialize Facebook SDK
    const initFB = () => {
      if (window.FB) {
        window.FB.XFBML.parse(containerRef.current);
        setLoaded(true);
      }
    };

    // Load Facebook SDK if not loaded
    if (!window.FB) {
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/es_LA/sdk.js#xfbml=1&version=v18.0';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        setTimeout(initFB, 500);
      };
      document.body.appendChild(script);
    } else {
      initFB();
    }
  }, []);

  return (
    <div className="embedded-feed facebook-embedded">
      <div className="embedded-feed-header">
        <div className="feed-title">
          <SocialIcon network="facebook" size={22} />
          <h3>Facebook</h3>
          <LiveIndicator />
        </div>
        <a
          href="https://www.facebook.com/jairo.cala.50"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-btn follow-btn-facebook"
        >
          Me gusta
        </a>
      </div>

      <div className="embed-content-wrapper" ref={containerRef}>
        <div id="fb-root"></div>

        {/* Facebook Page Plugin */}
        <div
          className="fb-page"
          data-href="https://www.facebook.com/jairo.cala.50"
          data-tabs="timeline"
          data-width="500"
          data-height="600"
          data-small-header="false"
          data-adapt-container-width="true"
          data-hide-cover="false"
          data-show-facepile="true"
        >
          <blockquote
            cite="https://www.facebook.com/jairo.cala.50"
            className="fb-xfbml-parse-ignore"
          >
            <div className="embed-loading">
              <div className="loading-spinner"></div>
              <p>Cargando contenido de Facebook...</p>
            </div>
          </blockquote>
        </div>

        {/* Fallback iframe alternative */}
        {!loaded && (
          <div className="facebook-iframe-container">
            <iframe
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fjairo.cala.50&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
              width="500"
              height="600"
              style={{ border: 'none', overflow: 'hidden' }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title="Facebook Page Plugin"
            ></iframe>
          </div>
        )}

        <a
          href="https://www.facebook.com/jairo.cala.50"
          target="_blank"
          rel="noopener noreferrer"
          className="view-more-link"
        >
          <SocialIcon network="facebook" size={18} />
          Ver página completa en Facebook
        </a>
      </div>
    </div>
  );
};

// ============================================
// INSTAGRAM EMBED COMPONENT
// ============================================

const InstagramEmbed: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load Instagram embed script
    const loadInstagramEmbed = () => {
      const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = () => {
          setLoaded(true);
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        };
        document.body.appendChild(script);
      } else {
        setLoaded(true);
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      }
    };

    loadInstagramEmbed();
  }, []);

  useEffect(() => {
    if (loaded && window.instgrm) {
      window.instgrm.Embeds.process();
    }
  }, [loaded]);

  return (
    <div className="embedded-feed instagram-embedded">
      <div className="embedded-feed-header">
        <div className="feed-title">
          <SocialIcon network="instagram" size={22} />
          <h3>Instagram</h3>
          <LiveIndicator />
        </div>
        <a
          href="https://www.instagram.com/jairocalasantander"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-btn follow-btn-instagram"
        >
          Seguir
        </a>
      </div>

      <div className="embed-content-wrapper instagram-wrapper" ref={containerRef}>
        {/* Instagram Profile Preview */}
        <div className="instagram-profile-preview">
          <div className="instagram-header">
            <div className="instagram-avatar-container">
              <div className="instagram-avatar">JC</div>
            </div>
            <div className="instagram-info">
              <h4>
                jairocalasantander
                <span className="verified-icon">
                  <SocialIcon network="verified" size={14} />
                </span>
              </h4>
              <p>Representante a la Cámara por Santander</p>
            </div>
          </div>

          {/* Instagram Stats */}
          <div className="instagram-stats-row">
            <div className="ig-stat">
              <strong>185</strong>
              <span>publicaciones</span>
            </div>
            <div className="ig-stat">
              <strong>2.1K</strong>
              <span>seguidores</span>
            </div>
            <div className="ig-stat">
              <strong>156</strong>
              <span>seguidos</span>
            </div>
          </div>

          {/* Instagram Bio */}
          <div className="instagram-bio">
            <p>
              Representante a la Cámara por Santander<br/>
              Defensor de los derechos humanos y la paz<br/>
              Protector del páramo de Santurbán<br/>
              Partido Comunes
            </p>
          </div>
        </div>

        {/* Instagram Posts Grid - Using iframes */}
        <div className="instagram-posts-container">
          <h5>Publicaciones recientes</h5>
          <div className="instagram-grid">
            {/* We'll embed actual Instagram posts using oEmbed */}
            <blockquote
              className="instagram-media"
              data-instgrm-captioned
              data-instgrm-permalink="https://www.instagram.com/jairocalasantander/"
              data-instgrm-version="14"
              style={{
                background: '#FFF',
                border: 0,
                borderRadius: '3px',
                boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                margin: '1px',
                maxWidth: '540px',
                minWidth: '326px',
                padding: 0,
                width: 'calc(100% - 2px)'
              }}
            >
              <div className="embed-loading">
                <div className="loading-spinner"></div>
                <p>Cargando publicaciones de Instagram...</p>
              </div>
            </blockquote>
          </div>
        </div>

        <a
          href="https://www.instagram.com/jairocalasantander"
          target="_blank"
          rel="noopener noreferrer"
          className="view-more-link instagram-link"
        >
          <SocialIcon network="instagram" size={18} />
          Ver perfil completo en Instagram
        </a>
      </div>
    </div>
  );
};

// ============================================
// YOUTUBE EMBED COMPONENT
// ============================================

const YouTubeEmbed: React.FC = () => {
  // Using the channel ID format for proper embedding
  const channelUrl = 'https://www.youtube.com/@jairocala5746';

  return (
    <div className="embedded-feed youtube-embedded">
      <div className="embedded-feed-header">
        <div className="feed-title">
          <SocialIcon network="youtube" size={22} />
          <h3>YouTube</h3>
          <LiveIndicator />
        </div>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="follow-btn follow-btn-youtube"
        >
          Suscribirse
        </a>
      </div>

      <div className="embed-content-wrapper youtube-wrapper">
        {/* YouTube Channel Header */}
        <div className="youtube-channel-header">
          <div className="youtube-avatar">
            <SocialIcon network="youtube" size={32} />
          </div>
          <div className="youtube-channel-info">
            <h4>Jairo Cala</h4>
            <p>@jairocala5746 • Videos sobre gestión política y actividades</p>
          </div>
        </div>

        {/* YouTube Videos Container */}
        <div className="youtube-videos-container">
          <h5>Videos del canal</h5>

          {/* YouTube Channel Embed using iframe */}
          <div className="youtube-embed-container">
            <iframe
              src="https://www.youtube.com/embed?listType=user_uploads&list=jairocala5746"
              width="100%"
              height="400"
              style={{ border: 'none', borderRadius: '12px' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="Canal de YouTube de Jairo Cala"
            ></iframe>
          </div>

          {/* Alternative: Embed Latest Video Placeholder */}
          <div className="youtube-latest-section">
            <div className="youtube-video-card">
              <div className="video-thumbnail">
                <div className="play-overlay">
                  <div className="play-icon">
                    <SocialIcon network="play" size={40} />
                  </div>
                </div>
                <div className="video-duration">Ver canal</div>
              </div>
              <div className="video-info">
                <h6>Gestión del Representante Jairo Cala</h6>
                <p>Videos sobre actividad legislativa, visitas a comunidades y trabajo por Santander</p>
              </div>
            </div>
          </div>
        </div>

        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="view-more-link youtube-link"
        >
          <SocialIcon network="youtube" size={18} />
          Ver canal completo en YouTube
        </a>
      </div>
    </div>
  );
};

// ============================================
// EMBEDDED FEEDS SECTION
// ============================================

const EmbeddedFeeds: React.FC<{ activeTab: TabId }> = ({ activeTab }) => {
  return (
    <div className="embedded-feeds-container">
      {(activeTab === 'all' || activeTab === 'twitter') && <TwitterEmbed />}
      {(activeTab === 'all' || activeTab === 'facebook') && <FacebookEmbed />}
      {(activeTab === 'all' || activeTab === 'instagram') && <InstagramEmbed />}
      {(activeTab === 'all' || activeTab === 'youtube') && <YouTubeEmbed />}
    </div>
  );
};

// ============================================
// MAIN SOCIAL FEED COMPONENT
// ============================================

const SocialFeed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setIsLoading(true);

    // Reload Twitter widget
    if (window.twttr?.widgets) {
      window.twttr.widgets.load();
    }

    // Reload Facebook plugin
    if (window.FB?.XFBML) {
      window.FB.XFBML.parse();
    }

    // Reload Instagram embeds
    if (window.instgrm?.Embeds) {
      window.instgrm.Embeds.process();
    }

    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
      setIsLoading(false);
    }, 1500);
  }, []);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'all', label: 'Todas', icon: 'all' },
    { id: 'twitter', label: 'X', icon: 'twitter' },
    { id: 'facebook', label: 'Facebook', icon: 'facebook' },
    { id: 'instagram', label: 'Instagram', icon: 'instagram' },
    { id: 'youtube', label: 'YouTube', icon: 'youtube' }
  ];

  const formatLastUpdated = (date: Date): string => {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section id="redes-sociales" className="social-feed">
      <div className="social-feed-container">
        {/* Header Section */}
        <header className="social-feed-header">
          <div className="header-badge">
            <LiveIndicator />
            <span className="update-time">
              Actualizado: {formatLastUpdated(lastUpdated)}
            </span>
            <button
              className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              aria-label="Actualizar feeds"
            >
              <SocialIcon network="refresh" size={18} />
            </button>
          </div>
          <h2>Redes Sociales en Tiempo Real</h2>
          <p>
            Mantente al día con las últimas publicaciones, posiciones políticas y actividades
            del Representante Jairo Cala. Conéctate y participa en la conversación.
          </p>
        </header>

        {/* Social Networks Grid */}
        <div className="social-cards-grid">
          {socialNetworks.map((network, index) => (
            <SocialCard key={network.name} network={network} index={index} />
          ))}
        </div>

        {/* Tab Navigation */}
        <nav className="feed-tabs" role="tablist" aria-label="Filtrar por red social">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`feed-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon === 'all' ? (
                <span className="tab-icon-all">📱</span>
              ) : (
                <SocialIcon network={tab.icon} size={18} />
              )}
              <span className="tab-label">{tab.label}</span>
              {activeTab === tab.id && <span className="tab-indicator"></span>}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        {isLoading ? (
          <div className="feed-loading">
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <div className="loading-pulse"></div>
            </div>
            <p>Cargando contenido de redes sociales...</p>
          </div>
        ) : (
          <div className="feed-main-content">
            {/* Embedded Feeds Section */}
            <section className="embedded-feeds-section">
              <div className="section-title">
                <h3>Feeds en Vivo</h3>
                <span className="live-badge">
                  <span className="live-dot-small"></span>
                  Contenido actualizado automáticamente
                </span>
              </div>
              <EmbeddedFeeds activeTab={activeTab} />
            </section>
          </div>
        )}

        {/* CTA Banner */}
        <div className="social-cta-banner">
          <div className="cta-background-elements">
            <div className="cta-circle cta-circle-1"></div>
            <div className="cta-circle cta-circle-2"></div>
            <div className="cta-circle cta-circle-3"></div>
          </div>
          <div className="cta-content">
            <h3>¡Únete a nuestra comunidad digital!</h3>
            <p>
              Sé parte del movimiento por un Santander más justo y próspero.
              Síguenos, comparte y participa en la construcción de un mejor futuro.
            </p>
          </div>
          <div className="cta-buttons">
            <a
              href="https://x.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-primary"
            >
              <SocialIcon network="twitter" size={20} />
              Seguir en X
            </a>
            <a
              href="https://www.facebook.com/jairo.cala.50"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-secondary"
            >
              <SocialIcon network="facebook" size={20} />
              Facebook
            </a>
            <a
              href="https://www.instagram.com/jairocalasantander"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-tertiary"
            >
              <SocialIcon network="instagram" size={20} />
              Instagram
            </a>
            <a
              href="https://www.youtube.com/@jairocala5746"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-youtube"
            >
              <SocialIcon network="youtube" size={20} />
              YouTube
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// TYPE DECLARATIONS FOR EXTERNAL LIBRARIES
// ============================================

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement | null) => void;
      };
    };
    FB?: {
      XFBML: {
        parse: (element?: HTMLElement | null) => void;
      };
    };
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export default SocialFeed;
