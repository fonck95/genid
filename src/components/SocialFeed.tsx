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
  hasEmbed?: boolean;
}

type TabId = 'all' | 'facebook' | 'instagram';

// ============================================
// SOCIAL NETWORKS DATA - DATOS VERIFICADOS
// ============================================

const socialNetworks: SocialNetwork[] = [
  {
    name: 'Facebook',
    icon: 'facebook',
    url: 'https://www.facebook.com/jairo.cala.50',
    username: 'jairo.cala.50',
    color: '#1877F2',
    followers: '5K+',
    posts: '500+',
    description: 'Eventos, fotos y actualizaciones de campaña',
    bio: 'Representante a la Cámara por Santander del Partido Comunes',
    hasEmbed: true
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
    bio: 'Representante a la Cámara por Santander | Partido Comunes',
    hasEmbed: true
  },
  {
    name: 'X (Twitter)',
    icon: 'twitter',
    url: 'https://x.com/JairoComunes',
    username: '@JairoComunes',
    color: '#000000',
    followers: '6.7K',
    posts: '6,745',
    description: 'Posiciones políticas y noticias en tiempo real',
    bio: 'Representante a la Cámara por Santander | Partido Comunes',
    hasEmbed: false
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
    bio: 'Canal oficial del Representante Jairo Cala',
    hasEmbed: false
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
    ),
    arrowRight: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
      </svg>
    ),
    comment: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    ),
    share: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
      </svg>
    ),
    bookmark: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
      </svg>
    ),
    grid: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
      </svg>
    ),
    image: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
    )
  };

  return <>{icons[network] || null}</>;
};

// ============================================
// LIVE INDICATOR COMPONENT
// ============================================

const LiveIndicator: React.FC = () => (
  <div className="live-indicator">
    <span className="live-dot"></span>
    <span className="live-text">En vivo</span>
  </div>
);

// ============================================
// COMPACT LINK CARD - Para X y YouTube
// ============================================

const CompactLinkCard: React.FC<{ network: SocialNetwork }> = ({ network }) => {
  return (
    <a
      href={network.url}
      target="_blank"
      rel="noopener noreferrer"
      className="compact-link-card"
      style={{ '--card-accent': network.color } as React.CSSProperties}
    >
      <div className="compact-link-icon" style={{ backgroundColor: network.color }}>
        <SocialIcon network={network.icon} size={28} />
      </div>
      <div className="compact-link-content">
        <div className="compact-link-header">
          <h4>{network.name}</h4>
          <span className="compact-link-username">{network.username}</span>
        </div>
        <p className="compact-link-desc">{network.description}</p>
        <div className="compact-link-stats">
          <span><SocialIcon network="users" size={14} /> {network.followers} seguidores</span>
          <span><SocialIcon network="document" size={14} /> {network.posts}</span>
        </div>
      </div>
      <div className="compact-link-action">
        <span>Visitar</span>
        <SocialIcon network="arrowRight" size={18} />
      </div>
    </a>
  );
};

// ============================================
// FACEBOOK EMBED COMPONENT - MEJORADO
// ============================================

const FacebookEmbed: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    <div className="social-embed-card facebook-embed-card" ref={containerRef}>
      {/* Header del perfil */}
      <div className="embed-profile-header facebook-profile">
        <div className="embed-cover facebook-cover-bg"></div>
        <div className="embed-profile-info">
          <div className="embed-avatar facebook-avatar-ring">
            <div className="avatar-inner">
              <span>JC</span>
            </div>
          </div>
          <div className="embed-profile-details">
            <div className="profile-name-row">
              <h3>Jairo Cala</h3>
              <span className="verified-badge facebook-verified">
                <SocialIcon network="verified" size={18} />
              </span>
            </div>
            <span className="profile-category">Representante a la Cámara por Santander</span>
            <p className="profile-bio">
              Partido Comunes | Defensor de los derechos humanos, la paz y la justicia social.
            </p>
          </div>
        </div>
        <div className="embed-stats facebook-stats">
          <div className="stat-item">
            <strong>5K+</strong>
            <span>Me gusta</span>
          </div>
          <div className="stat-item">
            <strong>500+</strong>
            <span>Publicaciones</span>
          </div>
          <div className="stat-item">
            <strong>4.8K</strong>
            <span>Seguidores</span>
          </div>
        </div>
      </div>

      {/* Sección de acciones */}
      <div className="embed-actions">
        <a
          href="https://www.facebook.com/jairo.cala.50"
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn primary facebook-primary"
        >
          <SocialIcon network="facebook" size={18} />
          Me gusta
        </a>
        <a
          href="https://www.facebook.com/jairo.cala.50"
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn secondary"
        >
          <SocialIcon network="share" size={18} />
          Compartir
        </a>
      </div>

      {/* Feed de publicaciones */}
      <div className="embed-feed-section">
        <div className="feed-section-header">
          <h4>Publicaciones Recientes</h4>
          <LiveIndicator />
        </div>

        <div id="fb-root"></div>
        <div className="facebook-feed-container">
          <iframe
            src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fjairo.cala.50&tabs=timeline&width=500&height=600&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false"
            width="100%"
            height="600"
            style={{ border: 'none', overflow: 'hidden', borderRadius: '12px' }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen={true}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title="Facebook Page - Jairo Cala"
            loading="lazy"
          />
        </div>
      </div>

      {/* Footer con CTA */}
      <div className="embed-footer">
        <a
          href="https://www.facebook.com/jairo.cala.50"
          target="_blank"
          rel="noopener noreferrer"
          className="embed-footer-link facebook-footer-link"
        >
          <SocialIcon network="external" size={16} />
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
    <div className="social-embed-card instagram-embed-card" ref={containerRef}>
      {/* Header del perfil con gradiente de Instagram */}
      <div className="embed-profile-header instagram-profile">
        <div className="embed-cover instagram-gradient-bg"></div>
        <div className="embed-profile-info">
          <div className="embed-avatar instagram-avatar-ring">
            <div className="avatar-inner">
              <span>JC</span>
            </div>
          </div>
          <div className="embed-profile-details">
            <div className="profile-name-row">
              <h3>jairocalasantander</h3>
              <span className="verified-badge instagram-verified">
                <SocialIcon network="verified" size={18} />
              </span>
            </div>
            <span className="profile-fullname">Jairo Cala</span>
            <span className="profile-category">Representante a la Cámara</span>
          </div>
        </div>
        <div className="embed-stats instagram-stats">
          <div className="stat-item">
            <strong>200+</strong>
            <span>Publicaciones</span>
          </div>
          <div className="stat-item">
            <strong>2K+</strong>
            <span>Seguidores</span>
          </div>
          <div className="stat-item">
            <strong>150</strong>
            <span>Siguiendo</span>
          </div>
        </div>
        <div className="instagram-bio-section">
          <p>
            Representante a la Cámara por Santander<br/>
            Partido Comunes<br/>
            Defensor del Acuerdo de Paz<br/>
            Protector del Páramo de Santurbán
          </p>
        </div>
      </div>

      {/* Sección de acciones */}
      <div className="embed-actions">
        <a
          href="https://www.instagram.com/jairocalasantander"
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn primary instagram-primary"
        >
          <SocialIcon network="instagram" size={18} />
          Seguir
        </a>
        <a
          href="https://www.instagram.com/jairocalasantander"
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn secondary"
        >
          <SocialIcon network="comment" size={18} />
          Mensaje
        </a>
      </div>

      {/* Navegación de contenido */}
      <div className="instagram-content-nav">
        <button className="content-nav-btn active">
          <SocialIcon network="grid" size={20} />
          <span>Publicaciones</span>
        </button>
        <button className="content-nav-btn">
          <SocialIcon network="image" size={20} />
          <span>Reels</span>
        </button>
      </div>

      {/* Feed de publicaciones */}
      <div className="embed-feed-section">
        <div className="feed-section-header">
          <h4>Galería de Publicaciones</h4>
          <LiveIndicator />
        </div>

        <div className="instagram-feed-container">
          {/* Grid de preview de posts */}
          <div className="instagram-posts-preview">
            <div className="instagram-post-item">
              <div className="post-placeholder">
                <SocialIcon network="image" size={32} />
                <span>Gestión 2024</span>
              </div>
              <div className="post-overlay">
                <span><SocialIcon network="heart" size={16} /> 234</span>
                <span><SocialIcon network="comment" size={16} /> 45</span>
              </div>
            </div>
            <div className="instagram-post-item">
              <div className="post-placeholder">
                <SocialIcon network="image" size={32} />
                <span>Comunidades</span>
              </div>
              <div className="post-overlay">
                <span><SocialIcon network="heart" size={16} /> 189</span>
                <span><SocialIcon network="comment" size={16} /> 32</span>
              </div>
            </div>
            <div className="instagram-post-item">
              <div className="post-placeholder">
                <SocialIcon network="image" size={32} />
                <span>Santurbán</span>
              </div>
              <div className="post-overlay">
                <span><SocialIcon network="heart" size={16} /> 567</span>
                <span><SocialIcon network="comment" size={16} /> 89</span>
              </div>
            </div>
            <div className="instagram-post-item">
              <div className="post-placeholder">
                <SocialIcon network="image" size={32} />
                <span>Congreso</span>
              </div>
              <div className="post-overlay">
                <span><SocialIcon network="heart" size={16} /> 312</span>
                <span><SocialIcon network="comment" size={16} /> 56</span>
              </div>
            </div>
            <div className="instagram-post-item">
              <div className="post-placeholder">
                <SocialIcon network="image" size={32} />
                <span>Paz Total</span>
              </div>
              <div className="post-overlay">
                <span><SocialIcon network="heart" size={16} /> 445</span>
                <span><SocialIcon network="comment" size={16} /> 78</span>
              </div>
            </div>
            <div className="instagram-post-item view-more-post">
              <div className="view-more-content">
                <SocialIcon network="arrowRight" size={32} />
                <span>Ver más</span>
              </div>
            </div>
          </div>

          {/* Embed oficial de Instagram */}
          <div className="instagram-official-embed">
            <blockquote
              className="instagram-media"
              data-instgrm-permalink="https://www.instagram.com/jairocalasantander/"
              data-instgrm-version="14"
              style={{
                background: '#FFF',
                border: 0,
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                margin: '0 auto',
                maxWidth: '100%',
                minWidth: '280px',
                padding: 0,
                width: '100%'
              }}
            >
              <div className="instagram-embed-loading">
                <div className="loading-spinner"></div>
                <p>Cargando contenido de Instagram...</p>
              </div>
            </blockquote>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="instagram-cta">
        <p>Descubre momentos de la gestión y conecta con nuestra comunidad</p>
      </div>

      {/* Footer */}
      <div className="embed-footer">
        <a
          href="https://www.instagram.com/jairocalasantander"
          target="_blank"
          rel="noopener noreferrer"
          className="embed-footer-link instagram-footer-link"
        >
          <SocialIcon network="external" size={16} />
          Ver perfil completo en Instagram
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
    <div className="embedded-feeds-grid">
      {(activeTab === 'all' || activeTab === 'facebook') && <FacebookEmbed />}
      {(activeTab === 'all' || activeTab === 'instagram') && <InstagramEmbed />}
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

  // Redes sin embed (X, YouTube) - solo enlaces
  const networksWithoutEmbed = socialNetworks.filter(n => !n.hasEmbed);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setIsLoading(true);

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
    { id: 'facebook', label: 'Facebook', icon: 'facebook' },
    { id: 'instagram', label: 'Instagram', icon: 'instagram' }
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
          <h2>Redes Sociales</h2>
          <p>
            Mantente conectado con las últimas publicaciones y actividades
            del Representante Jairo Cala en sus redes sociales oficiales.
          </p>
        </header>

        {/* Enlaces a otras redes (X y YouTube) */}
        <div className="other-networks-section">
          <h3 className="section-subtitle">También en otras plataformas</h3>
          <div className="compact-links-grid">
            {networksWithoutEmbed.map((network) => (
              <CompactLinkCard key={network.name} network={network} />
            ))}
          </div>
        </div>

        {/* Tab Navigation - Solo para Facebook e Instagram */}
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
            <section className="embedded-feeds-section">
              <div className="section-title">
                <h3>Publicaciones en Vivo</h3>
                <span className="live-badge">
                  <span className="live-dot-small"></span>
                  Contenido actualizado automáticamente
                </span>
              </div>
              <EmbeddedFeeds activeTab={activeTab} />
            </section>
          </div>
        )}

        {/* CTA Banner Simplificado */}
        <div className="social-cta-banner">
          <div className="cta-content">
            <h3>Síguenos en redes sociales</h3>
            <p>
              Únete a nuestra comunidad y mantente informado sobre la gestión
              del Representante Jairo Cala por Santander.
            </p>
          </div>
          <div className="cta-buttons">
            <a
              href="https://www.facebook.com/jairo.cala.50"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-facebook"
            >
              <SocialIcon network="facebook" size={20} />
              Facebook
            </a>
            <a
              href="https://www.instagram.com/jairocalasantander"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-instagram"
            >
              <SocialIcon network="instagram" size={20} />
              Instagram
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
