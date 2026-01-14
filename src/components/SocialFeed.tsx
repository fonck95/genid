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
  bio?: string;
}

type TabId = 'all' | 'twitter' | 'facebook' | 'instagram' | 'youtube';

// ============================================
// SOCIAL NETWORKS DATA - DATOS VERIFICADOS
// ============================================

const socialNetworks: SocialNetwork[] = [
  {
    name: 'X (Twitter)',
    icon: 'twitter',
    url: 'https://x.com/JairoComunes',
    username: '@JairoComunes',
    color: '#000000',
    followers: '6.7K',
    posts: '6,745',
    description: 'Posiciones políticas y noticias en tiempo real',
    bio: 'Representante a la Cámara por Santander | Partido Comunes | Defensor del Acuerdo de Paz'
  },
  {
    name: 'Facebook',
    icon: 'facebook',
    url: 'https://www.facebook.com/jairo.cala.50',
    username: 'jairo.cala.50',
    color: '#1877F2',
    followers: '5K+',
    posts: '500+',
    description: 'Eventos, fotos y actualizaciones de campaña',
    bio: 'Representante a la Cámara por Santander del Partido Comunes'
  },
  {
    name: 'Instagram',
    icon: 'instagram',
    url: 'https://www.instagram.com/jairocalasantander',
    username: '@jairocalasantander',
    color: '#E4405F',
    followers: '2K+',
    posts: '200+',
    description: 'Galería visual y momentos de la gestión',
    bio: 'Representante a la Cámara por Santander | Partido Comunes'
  },
  {
    name: 'YouTube',
    icon: 'youtube',
    url: 'https://www.youtube.com/@jairocala5746',
    username: '@jairocala5746',
    color: '#FF0000',
    followers: '500+',
    posts: '50+',
    description: 'Entrevistas, discursos y contenido audiovisual',
    bio: 'Canal oficial del Representante Jairo Cala'
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
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
    document: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
    )
  };

  return <>{icons[network] || null}</>;
};

// ============================================
// SOCIAL CARD COMPONENT - ENHANCED
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
          <span className="social-verified-badge">
            <SocialIcon network="verified" size={14} />
          </span>
        </div>
        <span className="social-username">{network.username}</span>
        <div className="social-stats-row">
          <div className="social-stat">
            <SocialIcon network="users" size={14} />
            <span>{network.followers}</span>
          </div>
          <div className="social-stat">
            <SocialIcon network="document" size={14} />
            <span>{network.posts}</span>
          </div>
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
// TWITTER/X EMBED COMPONENT - USANDO IFRAME
// ============================================

const TwitterEmbed: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar el widget de Twitter
    const loadTwitterWidget = () => {
      const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = () => {
          setTimeout(() => {
            if (window.twttr?.widgets) {
              window.twttr.widgets.load(containerRef.current);
            }
          }, 300);
        };
        script.onerror = () => console.error('Failed to load Twitter widget');
        document.body.appendChild(script);
      } else {
        setTimeout(() => {
          if (window.twttr?.widgets) {
            window.twttr.widgets.load(containerRef.current);
          }
        }, 300);
      }
    };

    loadTwitterWidget();
  }, []);

  return (
    <div className="embedded-feed twitter-embedded">
      <div className="embedded-feed-header">
        <div className="feed-title">
          <SocialIcon network="twitter" size={24} />
          <h3>X (Twitter)</h3>
          <LiveIndicator />
        </div>
        <a
          href="https://x.com/JairoComunes"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-btn follow-btn-twitter"
        >
          <SocialIcon network="twitter" size={16} />
          Seguir @JairoComunes
        </a>
      </div>

      <div className="embed-content-wrapper" ref={containerRef}>
        {/* Profile Header */}
        <div className="twitter-profile-header">
          <div className="twitter-profile-banner"></div>
          <div className="twitter-profile-info">
            <div className="twitter-avatar">
              <span>JC</span>
            </div>
            <div className="twitter-name-section">
              <h4>Jairo Cala <SocialIcon network="verified" size={16} /></h4>
              <span className="twitter-handle">@JairoComunes</span>
            </div>
          </div>
          <p className="twitter-bio">
            Representante a la Cámara por Santander | Partido Comunes |
            Defensor del Acuerdo de Paz | Protector del Páramo de Santurbán
          </p>
          <div className="twitter-stats">
            <span><strong>6,745</strong> Posts</span>
            <span><strong>156</strong> Siguiendo</span>
            <span><strong>6.7K</strong> Seguidores</span>
          </div>
        </div>

        {/* Timeline Embed usando Widget */}
        <div className="twitter-timeline-container">
          <a
            className="twitter-timeline"
            data-height="500"
            data-theme="light"
            data-chrome="noheader nofooter transparent"
            data-lang="es"
            data-dnt="true"
            href="https://twitter.com/JairoComunes?ref_src=twsrc%5Etfw"
          >
            <div className="embed-loading">
              <div className="loading-spinner"></div>
              <p>Cargando tweets...</p>
            </div>
          </a>
        </div>

        {/* Fallback con iframe de Publish */}
        <div className="twitter-fallback">
          <iframe
            src="https://syndication.twitter.com/srv/timeline-profile/screen-name/JairoComunes?dnt=true&embedId=twitter-widget-0&frame=false&hideBorder=true&hideFooter=true&hideHeader=true&hideScrollBar=false&lang=es&maxHeight=500px&transparent=true&widgetsVersion=2615f7e52b7e0%3A1702314776716"
            style={{ border: 'none', width: '100%', height: '500px', overflow: 'hidden' }}
            title="Twitter Timeline de @JairoComunes"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>

        <a
          href="https://x.com/JairoComunes"
          target="_blank"
          rel="noopener noreferrer"
          className="view-more-link"
        >
          <SocialIcon network="twitter" size={18} />
          Ver perfil completo en X
        </a>
      </div>
    </div>
  );
};

// ============================================
// FACEBOOK EMBED COMPONENT - MEJORADO
// ============================================

const FacebookEmbed: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar Facebook SDK
    const loadFB = () => {
      if (window.FB) {
        window.FB.XFBML.parse(containerRef.current);
        return;
      }

      // @ts-ignore
      window.fbAsyncInit = function() {
        // @ts-ignore
        FB.init({
          xfbml: true,
          version: 'v18.0'
        });
      };

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/es_LA/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    };

    loadFB();
  }, []);

  return (
    <div className="embedded-feed facebook-embedded">
      <div className="embedded-feed-header">
        <div className="feed-title">
          <SocialIcon network="facebook" size={24} />
          <h3>Facebook</h3>
          <LiveIndicator />
        </div>
        <a
          href="https://www.facebook.com/jairo.cala.50"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-btn follow-btn-facebook"
        >
          <SocialIcon network="facebook" size={16} />
          Me gusta
        </a>
      </div>

      <div className="embed-content-wrapper facebook-wrapper" ref={containerRef}>
        {/* Facebook Profile Header */}
        <div className="facebook-profile-header">
          <div className="facebook-cover"></div>
          <div className="facebook-profile-info">
            <div className="facebook-avatar">
              <span>JC</span>
            </div>
            <div className="facebook-name-section">
              <h4>Jairo Cala</h4>
              <span className="facebook-subtitle">Representante a la Cámara por Santander</span>
            </div>
          </div>
          <p className="facebook-bio">
            Representante a la Cámara por Santander del Partido Comunes.
            Defensor de los derechos humanos, la paz y la justicia social.
          </p>
        </div>

        <div id="fb-root"></div>

        {/* Facebook Page Plugin - Using iframe for better compatibility */}
        <div className="facebook-embed-container">
          <iframe
            src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fjairo.cala.50&tabs=timeline&width=500&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true"
            width="100%"
            height="500"
            style={{ border: 'none', overflow: 'hidden', borderRadius: '12px' }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen={true}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title="Facebook Page - Jairo Cala"
            loading="lazy"
          />
        </div>

        <a
          href="https://www.facebook.com/jairo.cala.50"
          target="_blank"
          rel="noopener noreferrer"
          className="view-more-link facebook-link"
        >
          <SocialIcon network="facebook" size={18} />
          Ver página completa en Facebook
        </a>
      </div>
    </div>
  );
};

// ============================================
// INSTAGRAM EMBED COMPONENT - MEJORADO
// ============================================

const InstagramEmbed: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Instagram embed script
    const loadInstagram = () => {
      const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = () => {
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        };
        document.body.appendChild(script);
      } else {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      }
    };

    loadInstagram();
  }, []);

  return (
    <div className="embedded-feed instagram-embedded">
      <div className="embedded-feed-header">
        <div className="feed-title">
          <SocialIcon network="instagram" size={24} />
          <h3>Instagram</h3>
          <LiveIndicator />
        </div>
        <a
          href="https://www.instagram.com/jairocalasantander"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-btn follow-btn-instagram"
        >
          <SocialIcon network="instagram" size={16} />
          Seguir
        </a>
      </div>

      <div className="embed-content-wrapper instagram-wrapper" ref={containerRef}>
        {/* Instagram Profile Preview - Profesional */}
        <div className="instagram-profile-card">
          <div className="instagram-gradient-bg"></div>
          <div className="instagram-profile-content">
            <div className="instagram-avatar-ring">
              <div className="instagram-avatar">
                <span>JC</span>
              </div>
            </div>
            <div className="instagram-profile-details">
              <div className="instagram-name-row">
                <h4>jairocalasantander</h4>
                <span className="instagram-verified">
                  <SocialIcon network="verified" size={16} />
                </span>
              </div>
              <span className="instagram-category">Político</span>
            </div>
            <div className="instagram-stats-grid">
              <div className="ig-stat">
                <strong>200+</strong>
                <span>Publicaciones</span>
              </div>
              <div className="ig-stat">
                <strong>2K+</strong>
                <span>Seguidores</span>
              </div>
              <div className="ig-stat">
                <strong>150</strong>
                <span>Siguiendo</span>
              </div>
            </div>
            <div className="instagram-bio-section">
              <p className="instagram-bio-text">
                <strong>Jairo Cala</strong><br/>
                Representante a la Cámara por Santander<br/>
                Partido Comunes<br/>
                Defensor del Acuerdo de Paz y los derechos humanos<br/>
                Protector del Páramo de Santurbán
              </p>
            </div>
          </div>
        </div>

        {/* Instagram Embed Widget */}
        <div className="instagram-embed-container">
          <blockquote
            className="instagram-media"
            data-instgrm-permalink="https://www.instagram.com/jairocalasantander/"
            data-instgrm-version="14"
            style={{
              background: '#FFF',
              border: 0,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              margin: '0 auto',
              maxWidth: '100%',
              minWidth: '280px',
              padding: 0,
              width: '100%'
            }}
          >
            <div className="instagram-feed-preview">
              <div className="ig-loading-placeholder">
                <div className="loading-spinner"></div>
                <p>Cargando contenido de Instagram...</p>
              </div>
            </div>
          </blockquote>
        </div>

        {/* Call to action */}
        <div className="instagram-cta-section">
          <p>Descubre más contenido visual y momentos de la gestión del Representante Jairo Cala</p>
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
// YOUTUBE EMBED COMPONENT - MEJORADO
// ============================================

const YouTubeEmbed: React.FC = () => {
  const channelUrl = 'https://www.youtube.com/@jairocala5746';
  // ID del canal obtenido del handle
  const channelId = 'jairocala5746';

  return (
    <div className="embedded-feed youtube-embedded">
      <div className="embedded-feed-header">
        <div className="feed-title">
          <SocialIcon network="youtube" size={24} />
          <h3>YouTube</h3>
          <LiveIndicator />
        </div>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="follow-btn follow-btn-youtube"
        >
          <SocialIcon network="youtube" size={16} />
          Suscribirse
        </a>
      </div>

      <div className="embed-content-wrapper youtube-wrapper">
        {/* YouTube Channel Header */}
        <div className="youtube-channel-card">
          <div className="youtube-channel-banner"></div>
          <div className="youtube-channel-content">
            <div className="youtube-channel-avatar">
              <SocialIcon network="youtube" size={36} />
            </div>
            <div className="youtube-channel-details">
              <h4>Jairo Cala</h4>
              <span className="youtube-handle">@jairocala5746</span>
              <p className="youtube-channel-desc">
                Canal oficial del Representante a la Cámara por Santander.
                Videos sobre gestión legislativa, visitas a comunidades, entrevistas y discursos.
              </p>
              <div className="youtube-channel-stats">
                <span>500+ suscriptores</span>
                <span>•</span>
                <span>50+ videos</span>
              </div>
            </div>
          </div>
        </div>

        {/* YouTube Video Embed - Canal */}
        <div className="youtube-embed-container">
          <h5 className="youtube-section-title">Videos del Canal</h5>

          {/* Embed del canal usando el nuevo formato */}
          <div className="youtube-iframe-wrapper">
            <iframe
              src={`https://www.youtube.com/embed?listType=user_uploads&list=${channelId}`}
              width="100%"
              height="400"
              style={{ border: 'none', borderRadius: '12px' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="Canal de YouTube de Jairo Cala"
              loading="lazy"
            />
          </div>

          {/* Video destacado usando iframe de YouTube */}
          <div className="youtube-featured-section">
            <h5 className="youtube-section-title">Contenido Destacado</h5>
            <div className="youtube-video-grid">
              <div className="youtube-video-card">
                <div className="youtube-thumbnail">
                  <div className="youtube-thumbnail-overlay">
                    <div className="youtube-play-button">
                      <SocialIcon network="play" size={32} />
                    </div>
                  </div>
                  <div className="youtube-thumbnail-bg">
                    <SocialIcon network="youtube" size={48} />
                  </div>
                </div>
                <div className="youtube-video-info">
                  <h6>Gestión Legislativa 2024</h6>
                  <p>Balance de actividades en el Congreso</p>
                </div>
              </div>
              <div className="youtube-video-card">
                <div className="youtube-thumbnail">
                  <div className="youtube-thumbnail-overlay">
                    <div className="youtube-play-button">
                      <SocialIcon network="play" size={32} />
                    </div>
                  </div>
                  <div className="youtube-thumbnail-bg">
                    <SocialIcon network="youtube" size={48} />
                  </div>
                </div>
                <div className="youtube-video-info">
                  <h6>Defensa del Páramo de Santurbán</h6>
                  <p>Trabajo por la protección ambiental</p>
                </div>
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
    }, 600);

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

    // Reload widgets
    if (window.twttr?.widgets) {
      window.twttr.widgets.load();
    }
    if (window.FB?.XFBML) {
      window.FB.XFBML.parse();
    }
    if (window.instgrm?.Embeds) {
      window.instgrm.Embeds.process();
    }

    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
      setIsLoading(false);
    }, 1000);
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
      init: (config: object) => void;
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
