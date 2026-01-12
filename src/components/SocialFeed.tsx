import React, { useEffect, useState } from 'react';
import '../styles/SocialFeed.css';

// Interfaces para tipado
interface SocialNetwork {
  name: string;
  icon: string;
  url: string;
  username: string;
  color: string;
  followers?: string;
}

// Datos de redes sociales de Jairo Cala
const socialNetworks: SocialNetwork[] = [
  {
    name: 'Facebook',
    icon: 'facebook',
    url: 'https://www.facebook.com/JairoComunes',
    username: '@JairoComunes',
    color: '#1877F2',
    followers: '15K'
  },
  {
    name: 'Instagram',
    icon: 'instagram',
    url: 'https://www.instagram.com/jairocomunes',
    username: '@jairocomunes',
    color: '#E4405F',
    followers: '8.5K'
  },
  {
    name: 'X (Twitter)',
    icon: 'twitter',
    url: 'https://x.com/JairoComunes',
    username: '@JairoComunes',
    color: '#000000',
    followers: '7.2K'
  },
  {
    name: 'TikTok',
    icon: 'tiktok',
    url: 'https://www.tiktok.com/@jairocalacomunes',
    username: '@jairocalacomunes',
    color: '#000000',
    followers: '5K'
  },
  {
    name: 'YouTube',
    icon: 'youtube',
    url: 'https://www.youtube.com/@jairocala5746',
    username: '@jairocala5746',
    color: '#FF0000',
    followers: '2.3K'
  }
];

// Componente de icono SVG para redes sociales
const SocialIcon: React.FC<{ network: string; size?: number }> = ({ network, size = 24 }) => {
  const icons: { [key: string]: React.ReactNode } = {
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
    tiktok: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    youtube: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  };

  return icons[network] || null;
};

// Componente para tarjetas de red social
const SocialCard: React.FC<{ network: SocialNetwork }> = ({ network }) => {
  return (
    <a
      href={network.url}
      target="_blank"
      rel="noopener noreferrer"
      className="social-card"
      style={{ '--card-color': network.color } as React.CSSProperties}
    >
      <div className="social-card-icon">
        <SocialIcon network={network.icon} size={32} />
      </div>
      <div className="social-card-info">
        <h4>{network.name}</h4>
        <span className="social-username">{network.username}</span>
        {network.followers && (
          <span className="social-followers">{network.followers} seguidores</span>
        )}
      </div>
      <div className="social-card-arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
      </div>
    </a>
  );
};

// Componente principal del visor de redes sociales
const SocialFeed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Cargar el script de Twitter para widgets embebidos
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);

    // Simular carga
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      // Limpiar script si es necesario
    };
  }, []);

  const tabs = [
    { id: 'all', label: 'Todas', icon: '📱' },
    { id: 'twitter', label: 'X', icon: '𝕏' },
    { id: 'facebook', label: 'Facebook', icon: '📘' },
    { id: 'instagram', label: 'Instagram', icon: '📸' }
  ];

  return (
    <section id="redes-sociales" className="social-feed">
      <div className="social-feed-container">
        {/* Header de la sección */}
        <div className="social-feed-header">
          <span className="section-tag">En Tiempo Real</span>
          <h2>Síguenos en Redes Sociales</h2>
          <p>Mantente informado sobre las actividades, propuestas y el trabajo legislativo de Jairo Cala. Conéctate con nosotros en todas las plataformas.</p>
        </div>

        {/* Grid de tarjetas de redes sociales */}
        <div className="social-cards-grid">
          {socialNetworks.map((network) => (
            <SocialCard key={network.name} network={network} />
          ))}
        </div>

        {/* Pestañas del feed */}
        <div className="feed-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`feed-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Contenedor del feed en tiempo real */}
        <div className="feed-content">
          {isLoading ? (
            <div className="feed-loading">
              <div className="loading-spinner"></div>
              <p>Cargando publicaciones...</p>
            </div>
          ) : (
            <>
              {/* Feed de Twitter/X embebido */}
              {(activeTab === 'all' || activeTab === 'twitter') && (
                <div className="feed-section twitter-feed">
                  <div className="feed-section-header">
                    <SocialIcon network="twitter" size={20} />
                    <h3>Últimos posts en X</h3>
                    <a
                      href="https://x.com/JairoComunes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="follow-btn twitter-follow"
                    >
                      Seguir
                    </a>
                  </div>
                  <div className="twitter-timeline-container">
                    <a
                      className="twitter-timeline"
                      data-height="500"
                      data-theme="light"
                      data-chrome="noheader nofooter noborders transparent"
                      data-lang="es"
                      href="https://twitter.com/JairoComunes?ref_src=twsrc%5Etfw"
                    >
                      Cargando tweets de @JairoComunes...
                    </a>
                  </div>
                </div>
              )}

              {/* Feed de Facebook */}
              {(activeTab === 'all' || activeTab === 'facebook') && (
                <div className="feed-section facebook-feed">
                  <div className="feed-section-header">
                    <SocialIcon network="facebook" size={20} />
                    <h3>Publicaciones en Facebook</h3>
                    <a
                      href="https://www.facebook.com/JairoComunes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="follow-btn facebook-follow"
                    >
                      Me gusta
                    </a>
                  </div>
                  <div className="facebook-embed-container">
                    <iframe
                      src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FJairoComunes&tabs=timeline&width=500&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
                      width="100%"
                      height="500"
                      style={{ border: 'none', overflow: 'hidden' }}
                      scrolling="no"
                      frameBorder="0"
                      allowFullScreen={true}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      title="Facebook Page Plugin"
                    ></iframe>
                  </div>
                </div>
              )}

              {/* Feed de Instagram */}
              {(activeTab === 'all' || activeTab === 'instagram') && (
                <div className="feed-section instagram-feed">
                  <div className="feed-section-header">
                    <SocialIcon network="instagram" size={20} />
                    <h3>Galería de Instagram</h3>
                    <a
                      href="https://www.instagram.com/jairocomunes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="follow-btn instagram-follow"
                    >
                      Seguir
                    </a>
                  </div>
                  <div className="instagram-widget">
                    <div className="instagram-profile-header">
                      <div className="instagram-avatar">
                        <span>JC</span>
                      </div>
                      <div className="instagram-profile-info">
                        <h4>@jairocomunes</h4>
                        <p>Representante a la Cámara por Santander</p>
                        <p className="instagram-bio">Constructor de paz, activista por los derechos de las comunidades y el ambiente. 🇨🇴</p>
                      </div>
                    </div>
                    <div className="instagram-cta">
                      <a
                        href="https://www.instagram.com/jairocomunes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="instagram-view-profile"
                      >
                        <SocialIcon network="instagram" size={20} />
                        Ver perfil completo en Instagram
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Banner de llamado a la acción */}
        <div className="social-cta-banner">
          <div className="cta-content">
            <h3>¡Únete a nuestra comunidad digital!</h3>
            <p>Sé parte del cambio. Comparte nuestras propuestas y ayúdanos a construir un mejor Santander.</p>
          </div>
          <div className="cta-buttons">
            <a
              href="https://x.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-social-btn"
            >
              <SocialIcon network="twitter" size={18} />
              Síguenos en X
            </a>
            <a
              href="https://www.facebook.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-social-btn"
            >
              <SocialIcon network="facebook" size={18} />
              Dale Me gusta
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialFeed;
