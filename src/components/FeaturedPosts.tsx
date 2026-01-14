import React, { useState, useEffect, useRef } from 'react';
import { InstagramEmbed, TikTokEmbed } from 'react-social-media-embed';
import '../styles/FeaturedPosts.css';

// ============================================
// TYPES & INTERFACES
// ============================================

interface SocialProfile {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok';
  profileUrl: string;
  username: string;
  displayName: string;
  label: string;
  bio?: string;
  followers?: string;
  posts?: string;
  embedUrls?: string[]; // URLs de posts específicos para embeber
}

// ============================================
// CONFIGURACIÓN DE PERFILES Y POSTS
// Agregar URLs de posts reales para mostrar embeds
// ============================================

const socialProfiles: SocialProfile[] = [
  {
    id: 'fb-profile',
    platform: 'facebook',
    profileUrl: 'https://www.facebook.com/jairo.cala.50',
    username: 'jairo.cala.50',
    displayName: 'Jairo Cala',
    label: 'Facebook',
    bio: 'Candidato a la Cámara de Representantes por Santander',
    followers: '5K+',
    posts: '200+',
    embedUrls: [
      // Agregar URLs de posts de Facebook aquí
      // Ejemplo: 'https://www.facebook.com/jairo.cala.50/posts/123456789'
    ]
  },
  {
    id: 'ig-profile',
    platform: 'instagram',
    profileUrl: 'https://www.instagram.com/jairocalasantander',
    username: 'jairocalasantander',
    displayName: 'Jairo Cala Santander',
    label: 'Instagram',
    bio: 'Candidato a la Cámara | Propuestas para Santander | Sígueme para conocer nuestro trabajo',
    followers: '2K+',
    posts: '150+',
    embedUrls: [
      // Agregar URLs de posts de Instagram aquí
      // Ejemplo: 'https://www.instagram.com/p/ABC123/'
    ]
  },
  {
    id: 'tiktok-profile',
    platform: 'tiktok',
    profileUrl: 'https://www.tiktok.com/@jairocalacomunes',
    username: 'jairocalacomunes',
    displayName: 'Jairo Cala Comunes',
    label: 'TikTok',
    bio: 'Videos cortos sobre propuestas, eventos y actividades de campaña',
    followers: '1K+',
    posts: '50+',
    embedUrls: [
      // Agregar URLs de videos de TikTok aquí
      // Ejemplo: 'https://www.tiktok.com/@jairocalacomunes/video/123456789'
    ]
  }
];

// ============================================
// SVG ICONS
// ============================================

const PlatformIcon: React.FC<{ platform: 'facebook' | 'instagram' | 'tiktok'; size?: number }> = ({ platform, size = 20 }) => {
  if (platform === 'facebook') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    );
  }
  if (platform === 'tiktok') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
};

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8zm0-10h8v8h-8V3z"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

// ============================================
// FACEBOOK CARD COMPONENT
// ============================================

const FacebookCard: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const hasEmbeds = profile.embedUrls && profile.embedUrls.length > 0;

  useEffect(() => {
    // Cargar Facebook SDK para el plugin de página
    const loadFacebookSDK = () => {
      if (!(window as any).FB) {
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/es_LA/sdk.js#xfbml=1&version=v18.0';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
          setIsLoading(false);
          if ((window as any).FB) {
            (window as any).FB.XFBML.parse();
          }
        };

        script.onerror = () => {
          setIsLoading(false);
          setHasError(true);
        };

        document.body.appendChild(script);
      } else {
        setIsLoading(false);
        (window as any).FB.XFBML.parse();
      }
    };

    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setHasError(true);
      }
    }, 8000);

    loadFacebookSDK();
    return () => clearTimeout(timeout);
  }, [isLoading]);

  return (
    <div className="social-card facebook-card">
      <div className="card-badge" style={{ background: 'linear-gradient(135deg, #1877F2, #4267B2)' }}>
        <PlatformIcon platform="facebook" size={16} />
        <span>{profile.label}</span>
      </div>

      <div className="card-content">
        {isLoading && (
          <div className="card-loading">
            <div className="loading-spinner facebook-spinner"></div>
            <span>Cargando Facebook...</span>
          </div>
        )}

        {!isLoading && !hasError && (
          <div className="fb-page-container">
            <div
              className="fb-page"
              data-href={profile.profileUrl}
              data-tabs="timeline"
              data-width="500"
              data-height="500"
              data-small-header="false"
              data-adapt-container-width="true"
              data-hide-cover="false"
              data-show-facepile="true"
            >
              <blockquote cite={profile.profileUrl} className="fb-xfbml-parse-ignore">
                <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer">
                  {profile.displayName}
                </a>
              </blockquote>
            </div>
          </div>
        )}

        {(hasError || (!isLoading && !hasEmbeds && hasError)) && (
          <ProfileFallback profile={profile} />
        )}
      </div>

      <a
        href={profile.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="card-cta facebook-cta"
      >
        <PlatformIcon platform="facebook" size={20} />
        <span>Seguir en Facebook</span>
        <ExternalLinkIcon />
      </a>
    </div>
  );
};

// ============================================
// INSTAGRAM CARD COMPONENT
// ============================================

const InstagramCard: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  const hasEmbeds = profile.embedUrls && profile.embedUrls.length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(Math.min(width - 40, 480));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div className="social-card instagram-card" ref={containerRef}>
      <div className="card-badge" style={{ background: 'linear-gradient(45deg, #405DE6, #833AB4, #C13584, #E1306C, #FD1D1D)' }}>
        <PlatformIcon platform="instagram" size={16} />
        <span>{profile.label}</span>
      </div>

      <div className="card-content">
        {hasEmbeds ? (
          <div className="embeds-scroll-container">
            {profile.embedUrls!.map((url, index) => (
              <div key={index} className="embed-item" style={{ maxWidth: containerWidth }}>
                <InstagramEmbed
                  url={url}
                  width={containerWidth}
                  captioned={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <ProfileFallback profile={profile} />
        )}
      </div>

      <a
        href={profile.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="card-cta instagram-cta"
      >
        <PlatformIcon platform="instagram" size={20} />
        <span>Seguir en Instagram</span>
        <ExternalLinkIcon />
      </a>
    </div>
  );
};

// ============================================
// TIKTOK CARD COMPONENT
// ============================================

const TikTokCard: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  const hasEmbeds = profile.embedUrls && profile.embedUrls.length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(325);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(Math.min(width - 40, 325));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div className="social-card tiktok-card" ref={containerRef}>
      <div className="card-badge" style={{ background: 'linear-gradient(135deg, #000000 0%, #25F4EE 50%, #FE2C55 100%)' }}>
        <PlatformIcon platform="tiktok" size={16} />
        <span>{profile.label}</span>
      </div>

      <div className="card-content">
        {hasEmbeds ? (
          <div className="embeds-scroll-container tiktok-embeds">
            {profile.embedUrls!.map((url, index) => (
              <div key={index} className="embed-item tiktok-embed-item" style={{ maxWidth: containerWidth }}>
                <TikTokEmbed
                  url={url}
                  width={containerWidth}
                />
              </div>
            ))}
          </div>
        ) : (
          <ProfileFallback profile={profile} />
        )}
      </div>

      <a
        href={profile.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="card-cta tiktok-cta"
      >
        <PlatformIcon platform="tiktok" size={20} />
        <span>Seguir en TikTok</span>
        <ExternalLinkIcon />
      </a>
    </div>
  );
};

// ============================================
// PROFILE FALLBACK COMPONENT
// Muestra información del perfil cuando no hay embeds
// ============================================

const ProfileFallback: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  const getPlatformGradient = () => {
    switch (profile.platform) {
      case 'facebook':
        return 'linear-gradient(135deg, rgba(24, 119, 242, 0.1), rgba(66, 103, 178, 0.1))';
      case 'instagram':
        return 'linear-gradient(135deg, rgba(64, 93, 230, 0.1), rgba(225, 48, 108, 0.1))';
      case 'tiktok':
        return 'linear-gradient(135deg, rgba(0, 0, 0, 0.05), rgba(37, 244, 238, 0.1), rgba(254, 44, 85, 0.1))';
      default:
        return 'transparent';
    }
  };

  const getPlatformColor = () => {
    switch (profile.platform) {
      case 'facebook':
        return '#1877F2';
      case 'instagram':
        return '#E1306C';
      case 'tiktok':
        return '#FE2C55';
      default:
        return '#333';
    }
  };

  const getAvatarGradient = () => {
    switch (profile.platform) {
      case 'facebook':
        return 'linear-gradient(135deg, #1877F2, #4267B2)';
      case 'instagram':
        return 'linear-gradient(45deg, #405DE6, #833AB4, #C13584, #E1306C, #FD1D1D)';
      case 'tiktok':
        return 'linear-gradient(135deg, #25F4EE, #FE2C55)';
      default:
        return '#333';
    }
  };

  const getIcon = () => {
    switch (profile.platform) {
      case 'instagram':
        return <GridIcon />;
      case 'tiktok':
        return <PlayIcon />;
      default:
        return <UsersIcon />;
    }
  };

  return (
    <div className="profile-fallback">
      <div className="profile-header" style={{ background: getPlatformGradient() }}>
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-ring" style={{ background: getAvatarGradient() }}>
            <span className="profile-initials">JC</span>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{profile.posts}</span>
            <span className="stat-label">{profile.platform === 'tiktok' ? 'Videos' : 'Posts'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.followers}</span>
            <span className="stat-label">Seguidores</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.platform === 'tiktok' ? '50K+' : '500+'}</span>
            <span className="stat-label">{profile.platform === 'tiktok' ? 'Me gusta' : 'Siguiendo'}</span>
          </div>
        </div>
      </div>

      <div className="profile-info">
        <h3 className="profile-name">{profile.displayName}</h3>
        <p className="profile-handle">@{profile.username}</p>
        <p className="profile-bio">{profile.bio}</p>
      </div>

      <div className="profile-preview">
        <div className="preview-header">
          <span className="preview-icon" style={{ color: getPlatformColor() }}>
            {getIcon()}
          </span>
          <span className="preview-title">
            {profile.platform === 'tiktok' ? 'Últimos Videos' : 'Contenido Reciente'}
          </span>
        </div>
        <div className="preview-grid">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <a
              key={item}
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`preview-item ${profile.platform}-preview`}
              style={{
                background: `${getPlatformGradient()}`,
                animationDelay: `${item * 0.1}s`
              }}
            >
              <div className="preview-overlay">
                <HeartIcon />
                <span>{Math.floor(Math.random() * 500 + 100)}</span>
              </div>
              {profile.platform === 'tiktok' && (
                <div className="play-badge">
                  <PlayIcon />
                </div>
              )}
            </a>
          ))}
        </div>
        <p className="preview-cta">Visita el perfil para ver todo el contenido</p>
      </div>
    </div>
  );
};

// ============================================
// PROFILE CARD ROUTER
// ============================================

const ProfileCard: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  switch (profile.platform) {
    case 'facebook':
      return <FacebookCard profile={profile} />;
    case 'instagram':
      return <InstagramCard profile={profile} />;
    case 'tiktok':
      return <TikTokCard profile={profile} />;
    default:
      return null;
  }
};

// ============================================
// MAIN FEATURED POSTS COMPONENT
// ============================================

const FeaturedPosts: React.FC = () => {
  return (
    <section id="publicaciones" className="featured-posts">
      <div className="featured-posts-container">
        {/* Header */}
        <header className="featured-posts-header">
          <div className="header-badge">
            <span className="live-indicator"></span>
            <span>Redes Sociales Oficiales</span>
          </div>
          <h2>Síguenos en Redes Sociales</h2>
          <p>Mantente informado sobre nuestras propuestas, eventos y actividades de campaña</p>
        </header>

        {/* Social Cards Grid */}
        <div className="social-cards-grid">
          {socialProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <a
            href="https://www.facebook.com/jairo.cala.50"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link facebook"
          >
            <PlatformIcon platform="facebook" size={20} />
            <span>Facebook</span>
          </a>
          <a
            href="https://www.instagram.com/jairocalasantander"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link instagram"
          >
            <PlatformIcon platform="instagram" size={20} />
            <span>Instagram</span>
          </a>
          <a
            href="https://www.tiktok.com/@jairocalacomunes"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link tiktok"
          >
            <PlatformIcon platform="tiktok" size={20} />
            <span>TikTok</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPosts;
