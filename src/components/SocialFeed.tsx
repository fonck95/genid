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
  description?: string;
}

interface Post {
  id: string;
  platform: 'twitter' | 'facebook' | 'instagram';
  content: string;
  date: string;
  likes?: number;
  shares?: number;
  comments?: number;
  image?: string;
  url: string;
}

type TabId = 'all' | 'twitter' | 'facebook' | 'instagram';

// ============================================
// SOCIAL NETWORKS DATA - VERIFIED ACCOUNTS
// ============================================

const socialNetworks: SocialNetwork[] = [
  {
    name: 'X (Twitter)',
    icon: 'twitter',
    url: 'https://x.com/JairoComunes',
    username: '@JairoComunes',
    color: '#000000',
    followers: '7.2K',
    description: 'Noticias y posiciones políticas en tiempo real'
  },
  {
    name: 'Facebook',
    icon: 'facebook',
    url: 'https://www.facebook.com/JairoComunes',
    username: 'JairoComunes',
    color: '#1877F2',
    followers: '15K',
    description: 'Actualizaciones y eventos de campaña'
  },
  {
    name: 'Instagram',
    icon: 'instagram',
    url: 'https://www.instagram.com/jairocomunes',
    username: '@jairocomunes',
    color: '#E4405F',
    followers: '8.5K',
    description: 'Momentos y galería visual de actividades'
  },
  {
    name: 'TikTok',
    icon: 'tiktok',
    url: 'https://www.tiktok.com/@jairocalacomunes',
    username: '@jairocalacomunes',
    color: '#000000',
    followers: '5K',
    description: 'Contenido dinámico y cercano'
  },
  {
    name: 'YouTube',
    icon: 'youtube',
    url: 'https://www.youtube.com/@jairocala5746',
    username: '@jairocala5746',
    color: '#FF0000',
    followers: '2.3K',
    description: 'Entrevistas y discursos completos'
  }
];

// Sample posts for demonstration (in production, these would come from APIs)
const samplePosts: Post[] = [
  {
    id: '1',
    platform: 'twitter',
    content: '🏔️ Hoy seguimos defendiendo el Páramo de Santurbán. No permitiremos que intereses económicos destruyan nuestro patrimonio ambiental. #DefendamosSanturbán #AguaSíOroNo',
    date: 'Hace 2 horas',
    likes: 234,
    shares: 89,
    comments: 45,
    url: 'https://x.com/JairoComunes'
  },
  {
    id: '2',
    platform: 'facebook',
    content: '📢 Reunión con comunidades campesinas de Santander. Escuchamos sus necesidades y propuestas para el desarrollo rural sostenible. ¡Juntos construimos un mejor Santander!',
    date: 'Hace 5 horas',
    likes: 456,
    shares: 123,
    comments: 67,
    image: 'reunion-campesinos',
    url: 'https://www.facebook.com/JairoComunes'
  },
  {
    id: '3',
    platform: 'instagram',
    content: '✊ La paz se construye todos los días. Visitando las comunidades de Puerto Parra para verificar la implementación de los acuerdos. #PazTotal #Colombia',
    date: 'Hace 8 horas',
    likes: 567,
    comments: 34,
    image: 'visita-puerto-parra',
    url: 'https://www.instagram.com/jairocomunes'
  },
  {
    id: '4',
    platform: 'twitter',
    content: '🚫 El fracking NO es el futuro de Santander. Nuestra tierra, nuestra agua, nuestra vida. Seguiremos oponiéndonos a esta práctica destructiva. #NoAlFracking',
    date: 'Hace 12 horas',
    likes: 345,
    shares: 156,
    comments: 78,
    url: 'https://x.com/JairoComunes'
  },
  {
    id: '5',
    platform: 'facebook',
    content: '🏭 Debate en el Congreso sobre FERTICOL. Defendemos esta empresa pública que es patrimonio de los santandereanos. ¡La producción nacional debe fortalecerse!',
    date: 'Hace 1 día',
    likes: 678,
    shares: 234,
    comments: 89,
    url: 'https://www.facebook.com/JairoComunes'
  },
  {
    id: '6',
    platform: 'instagram',
    content: '🌾 El campo santandereano tiene futuro. Trabajando por políticas que apoyen a nuestros agricultores y fortalezcan la economía rural.',
    date: 'Hace 1 día',
    likes: 432,
    comments: 56,
    image: 'campo-santander',
    url: 'https://www.instagram.com/jairocomunes'
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
    tiktok: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
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
          <span className="social-followers-badge">{network.followers}</span>
        </div>
        <span className="social-username">{network.username}</span>
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
// POST CARD COMPONENT
// ============================================

const PostCard: React.FC<{ post: Post; index: number }> = ({ post, index }) => {
  const platformColors: Record<string, string> = {
    twitter: '#000000',
    facebook: '#1877F2',
    instagram: '#E4405F'
  };

  const platformNames: Record<string, string> = {
    twitter: 'X',
    facebook: 'Facebook',
    instagram: 'Instagram'
  };

  return (
    <article
      className={`post-card post-card-${post.platform}`}
      style={{ '--animation-delay': `${index * 0.1}s` } as React.CSSProperties}
    >
      <div className="post-card-header">
        <div
          className="post-platform-badge"
          style={{ backgroundColor: platformColors[post.platform] }}
        >
          <SocialIcon network={post.platform === 'twitter' ? 'twitter' : post.platform} size={14} />
          <span>{platformNames[post.platform]}</span>
        </div>
        <span className="post-date">{post.date}</span>
      </div>

      <div className="post-card-body">
        <p className="post-content">{post.content}</p>
        {post.image && (
          <div className="post-image-placeholder">
            <div className="image-skeleton">
              <SocialIcon network={post.platform === 'twitter' ? 'twitter' : post.platform} size={32} />
            </div>
          </div>
        )}
      </div>

      <div className="post-card-footer">
        <div className="post-stats">
          {post.likes !== undefined && (
            <span className="post-stat">
              <SocialIcon network="heart" size={16} />
              <span>{post.likes.toLocaleString()}</span>
            </span>
          )}
          {post.comments !== undefined && (
            <span className="post-stat">
              <SocialIcon network="comment" size={16} />
              <span>{post.comments.toLocaleString()}</span>
            </span>
          )}
          {post.shares !== undefined && (
            <span className="post-stat">
              <SocialIcon network="share" size={16} />
              <span>{post.shares.toLocaleString()}</span>
            </span>
          )}
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="post-view-link"
        >
          Ver publicación
          <SocialIcon network="external" size={14} />
        </a>
      </div>
    </article>
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
// EMBEDDED FEEDS SECTION
// ============================================

const EmbeddedFeeds: React.FC<{ activeTab: TabId }> = ({ activeTab }) => {
  const [twitterLoaded, setTwitterLoaded] = useState(false);
  const twitterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Twitter widget script
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    script.onload = () => {
      setTwitterLoaded(true);
      // Reload Twitter widget when script loads
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load(twitterRef.current);
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
    };
  }, []);

  useEffect(() => {
    // Reload Twitter widget when tab changes
    if (twitterLoaded && window.twttr && window.twttr.widgets && twitterRef.current) {
      window.twttr.widgets.load(twitterRef.current);
    }
  }, [activeTab, twitterLoaded]);

  return (
    <div className="embedded-feeds-container">
      {/* Twitter/X Embedded Timeline */}
      {(activeTab === 'all' || activeTab === 'twitter') && (
        <div className="embedded-feed twitter-embedded" ref={twitterRef}>
          <div className="embedded-feed-header">
            <div className="feed-title">
              <SocialIcon network="twitter" size={22} />
              <h3>Timeline de X</h3>
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
          <div className="twitter-embed-wrapper">
            <a
              className="twitter-timeline"
              data-height="600"
              data-theme="light"
              data-chrome="noheader nofooter noborders transparent"
              data-lang="es"
              data-dnt="true"
              href="https://twitter.com/JairoComunes?ref_src=twsrc%5Etfw"
            >
              Cargando tweets de @JairoComunes...
            </a>
          </div>
        </div>
      )}

      {/* Facebook Embedded Page */}
      {(activeTab === 'all' || activeTab === 'facebook') && (
        <div className="embedded-feed facebook-embedded">
          <div className="embedded-feed-header">
            <div className="feed-title">
              <SocialIcon network="facebook" size={22} />
              <h3>Página de Facebook</h3>
              <LiveIndicator />
            </div>
            <a
              href="https://www.facebook.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="follow-btn follow-btn-facebook"
            >
              Me gusta
            </a>
          </div>
          <div className="facebook-embed-wrapper">
            <iframe
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FJairoComunes&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
              width="100%"
              height="600"
              style={{ border: 'none', overflow: 'hidden' }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title="Facebook Page - Jairo Cala"
            />
          </div>
        </div>
      )}

      {/* Instagram Embedded Profile */}
      {(activeTab === 'all' || activeTab === 'instagram') && (
        <div className="embedded-feed instagram-embedded">
          <div className="embedded-feed-header">
            <div className="feed-title">
              <SocialIcon network="instagram" size={22} />
              <h3>Perfil de Instagram</h3>
              <LiveIndicator />
            </div>
            <a
              href="https://www.instagram.com/jairocomunes"
              target="_blank"
              rel="noopener noreferrer"
              className="follow-btn follow-btn-instagram"
            >
              Seguir
            </a>
          </div>
          <div className="instagram-embed-wrapper">
            <div className="instagram-profile-card">
              <div className="instagram-profile-top">
                <div className="instagram-avatar-large">
                  <span>JC</span>
                </div>
                <div className="instagram-stats">
                  <div className="instagram-stat">
                    <strong>8.5K</strong>
                    <span>Seguidores</span>
                  </div>
                  <div className="instagram-stat">
                    <strong>245</strong>
                    <span>Publicaciones</span>
                  </div>
                  <div className="instagram-stat">
                    <strong>156</strong>
                    <span>Siguiendo</span>
                  </div>
                </div>
              </div>
              <div className="instagram-profile-info">
                <h4>Jairo Cala</h4>
                <span className="instagram-category">Político</span>
                <p className="instagram-bio-text">
                  🏛️ Representante a la Cámara por Santander<br/>
                  ✊ Constructor de paz<br/>
                  🌿 Defensor del medio ambiente<br/>
                  🇨🇴 Partido Comunes
                </p>
              </div>
              <div className="instagram-grid-preview">
                <div className="instagram-grid-item">
                  <div className="grid-placeholder">
                    <SocialIcon network="instagram" size={24} />
                  </div>
                </div>
                <div className="instagram-grid-item">
                  <div className="grid-placeholder">
                    <SocialIcon network="instagram" size={24} />
                  </div>
                </div>
                <div className="instagram-grid-item">
                  <div className="grid-placeholder">
                    <SocialIcon network="instagram" size={24} />
                  </div>
                </div>
                <div className="instagram-grid-item">
                  <div className="grid-placeholder">
                    <SocialIcon network="instagram" size={24} />
                  </div>
                </div>
                <div className="instagram-grid-item">
                  <div className="grid-placeholder">
                    <SocialIcon network="instagram" size={24} />
                  </div>
                </div>
                <div className="instagram-grid-item">
                  <div className="grid-placeholder">
                    <SocialIcon network="instagram" size={24} />
                  </div>
                </div>
              </div>
              <a
                href="https://www.instagram.com/jairocomunes"
                target="_blank"
                rel="noopener noreferrer"
                className="instagram-view-full"
              >
                <SocialIcon network="instagram" size={18} />
                Ver perfil completo en Instagram
              </a>
            </div>
          </div>
        </div>
      )}
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

  // Filter posts based on active tab
  const filteredPosts = activeTab === 'all'
    ? samplePosts
    : samplePosts.filter(post => post.platform === activeTab);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1500);
  }, []);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'all', label: 'Todas', icon: 'all' },
    { id: 'twitter', label: 'X', icon: 'twitter' },
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
            <p>Cargando publicaciones en tiempo real...</p>
          </div>
        ) : (
          <div className="feed-main-content">
            {/* Recent Posts Section */}
            <section className="recent-posts-section">
              <div className="section-title">
                <h3>Publicaciones Recientes</h3>
                <span className="posts-count">{filteredPosts.length} publicaciones</span>
              </div>
              <div className="posts-grid">
                {filteredPosts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} />
                ))}
              </div>
            </section>

            {/* Embedded Feeds Section */}
            <section className="embedded-feeds-section">
              <div className="section-title">
                <h3>Feeds en Vivo</h3>
                <span className="live-badge">
                  <span className="live-dot-small"></span>
                  Actualización automática
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
              href="https://www.facebook.com/JairoComunes"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-secondary"
            >
              <SocialIcon network="facebook" size={20} />
              Facebook
            </a>
            <a
              href="https://www.instagram.com/jairocomunes"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn cta-btn-tertiary"
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

// Extend Window interface for Twitter widgets
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement | null) => void;
      };
    };
  }
}

export default SocialFeed;
