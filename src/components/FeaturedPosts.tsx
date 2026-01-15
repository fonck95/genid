import React, { useState, useEffect } from 'react';
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
  appUrl?: string; // Deep link para abrir en app nativa
  previewImages?: string[]; // URLs de imágenes preview
}

// ============================================
// UTILITY: Detectar dispositivo móvil/iOS
// ============================================

const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIOS: false,
    isSafari: false,
    shouldUseFallback: true // Por defecto usar fallback para mejor compatibilidad
  });

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Detectar iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Detectar Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

    // Detectar móvil general
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
      window.innerWidth <= 768;

    // En iOS Safari, los embeds tienen problemas conocidos
    // En móviles en general, es mejor usar el fallback para mejor UX
    const shouldUseFallback = isMobile || (isIOS && isSafari);

    setDeviceInfo({ isMobile, isIOS, isSafari, shouldUseFallback });
  }, []);

  return deviceInfo;
};

// ============================================
// CONFIGURACIÓN DE PERFILES
// ============================================

const socialProfiles: SocialProfile[] = [
  {
    id: 'fb-profile',
    platform: 'facebook',
    profileUrl: 'https://www.facebook.com/jairo.cala.50',
    username: 'jairo.cala.50',
    displayName: 'Jairo Cala',
    label: 'Facebook',
    bio: 'Candidato a la Cámara de Representantes por Santander. Comprometido con el desarrollo social y económico de nuestra región.',
    followers: '5K+',
    posts: '200+',
    appUrl: 'fb://profile/jairo.cala.50'
  },
  {
    id: 'ig-profile',
    platform: 'instagram',
    profileUrl: 'https://www.instagram.com/jairocalasantander',
    username: 'jairocalasantander',
    displayName: 'Jairo Cala Santander',
    label: 'Instagram',
    bio: 'Candidato a la Cámara | Propuestas para Santander | Sígueme para conocer nuestro trabajo y propuestas.',
    followers: '2K+',
    posts: '150+',
    appUrl: 'instagram://user?username=jairocalasantander'
  },
  {
    id: 'tiktok-profile',
    platform: 'tiktok',
    profileUrl: 'https://www.tiktok.com/@jairocalacomunes',
    username: 'jairocalacomunes',
    displayName: 'Jairo Cala Comunes',
    label: 'TikTok',
    bio: 'Videos cortos sobre propuestas, eventos y actividades de campaña. ¡Síguenos para más contenido!',
    followers: '1K+',
    posts: '50+',
    appUrl: 'tiktok://user?username=jairocalacomunes'
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

const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const VerifiedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

// ============================================
// SOCIAL MEDIA CARD - Tarjeta interactiva universal
// ============================================

interface SocialMediaCardProps {
  profile: SocialProfile;
  deviceInfo: ReturnType<typeof useDeviceDetection>;
}

const SocialMediaCard: React.FC<SocialMediaCardProps> = ({ profile, deviceInfo }) => {
  const getPlatformGradient = () => {
    switch (profile.platform) {
      case 'facebook':
        return 'linear-gradient(135deg, #1877F2 0%, #4267B2 100%)';
      case 'instagram':
        return 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';
      case 'tiktok':
        return 'linear-gradient(135deg, #000000 0%, #25F4EE 50%, #FE2C55 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const getPlatformColor = () => {
    switch (profile.platform) {
      case 'facebook': return '#1877F2';
      case 'instagram': return '#E4405F';
      case 'tiktok': return '#000000';
      default: return '#667eea';
    }
  };

  const getPlatformSecondaryColor = () => {
    switch (profile.platform) {
      case 'facebook': return '#4267B2';
      case 'instagram': return '#833AB4';
      case 'tiktok': return '#FE2C55';
      default: return '#764ba2';
    }
  };

  const getPreviewContent = () => {
    const contentItems = profile.platform === 'tiktok'
      ? ['Video campaña', 'Propuestas', 'Eventos', 'Comunidad', 'En vivo', 'Entrevista']
      : ['Foto campaña', 'Evento', 'Propuesta', 'Comunidad', 'Noticia', 'Actividad'];

    return contentItems;
  };

  const handleCardClick = () => {
    // En móvil, intentar abrir la app nativa primero
    if (deviceInfo.isMobile && profile.appUrl) {
      // Intentar deep link a la app
      const start = Date.now();
      window.location.href = profile.appUrl;

      // Si después de 1.5 segundos sigue en la página, abrir el navegador
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          window.open(profile.profileUrl, '_blank');
        }
      }, 1500);
    } else {
      window.open(profile.profileUrl, '_blank');
    }
  };

  return (
    <article
      className={`social-media-card ${profile.platform}-card`}
    >
      {/* Header con gradiente de la plataforma */}
      <div
        className="card-header"
        style={{ background: getPlatformGradient() }}
      >
        <div className="card-header-pattern"></div>
        <div className="platform-badge">
          <PlatformIcon platform={profile.platform} size={18} />
          <span>{profile.label}</span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="card-body">
        {/* Avatar y info del perfil */}
        <div className="profile-section">
          <div
            className="avatar-container"
            style={{ borderColor: getPlatformColor() }}
          >
            <div
              className="avatar-inner"
              style={{ background: getPlatformGradient() }}
            >
              <span className="avatar-initials">JC</span>
            </div>
            <div className="avatar-ring"></div>
          </div>

          <div className="profile-info">
            <div className="profile-name-row">
              <h3 className="profile-name">{profile.displayName}</h3>
              <span
                className="verified-badge"
                style={{ background: getPlatformColor() }}
              >
                <VerifiedIcon />
              </span>
            </div>
            <p className="profile-handle">@{profile.username}</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-value">{profile.posts}</span>
            <span className="stat-label">
              {profile.platform === 'tiktok' ? 'Videos' : 'Posts'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.followers}</span>
            <span className="stat-label">Seguidores</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {profile.platform === 'tiktok' ? '50K+' : '500+'}
            </span>
            <span className="stat-label">
              {profile.platform === 'tiktok' ? 'Likes' : 'Siguiendo'}
            </span>
          </div>
        </div>

        {/* Bio */}
        <p className="profile-bio">{profile.bio}</p>

        {/* Preview Grid - Miniaturas simuladas */}
        <div className="preview-section">
          <div className="preview-header">
            <span
              className="preview-icon"
              style={{ color: getPlatformColor() }}
            >
              {profile.platform === 'tiktok' ? <PlayIcon /> : <GridIcon />}
            </span>
            <span className="preview-title">
              {profile.platform === 'tiktok' ? 'Últimos Videos' : 'Publicaciones Recientes'}
            </span>
          </div>

          <div className="preview-grid">
            {getPreviewContent().map((item, index) => (
              <div
                key={index}
                className={`preview-item ${profile.platform}-preview-item`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  background: `linear-gradient(${135 + index * 15}deg,
                    ${getPlatformColor()}15,
                    ${getPlatformSecondaryColor()}25)`
                }}
                onClick={handleCardClick}
              >
                <div className="preview-content">
                  {profile.platform === 'tiktok' && (
                    <div className="play-overlay">
                      <PlayIcon />
                    </div>
                  )}
                  <div className="preview-hover-info">
                    <div className="hover-stat">
                      <HeartIcon />
                      <span>{Math.floor(Math.random() * 900 + 100)}</span>
                    </div>
                    <div className="hover-stat">
                      <CommentIcon />
                      <span>{Math.floor(Math.random() * 50 + 10)}</span>
                    </div>
                  </div>
                </div>
                <span className="preview-label">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement indicators */}
        <div className="engagement-row">
          <div className="engagement-item">
            <HeartIcon />
            <span>Likes</span>
          </div>
          <div className="engagement-item">
            <CommentIcon />
            <span>Comentarios</span>
          </div>
          <div className="engagement-item">
            <ShareIcon />
            <span>Compartir</span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <a
        href={profile.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="card-cta"
        style={{ background: getPlatformGradient() }}
        onClick={(e) => {
          if (deviceInfo.isMobile && profile.appUrl) {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <PlatformIcon platform={profile.platform} size={20} />
        <span>
          {deviceInfo.isMobile
            ? `Abrir en ${profile.label}`
            : `Seguir en ${profile.label}`}
        </span>
        <ExternalLinkIcon />
      </a>

      {/* Mobile hint */}
      {deviceInfo.isMobile && (
        <div className="mobile-hint">
          <span>Toca para ver en la app</span>
        </div>
      )}
    </article>
  );
};

// ============================================
// MAIN FEATURED POSTS COMPONENT
// ============================================

const FeaturedPosts: React.FC = () => {
  const deviceInfo = useDeviceDetection();

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
          {deviceInfo.isMobile && (
            <p className="mobile-notice">
              Toca en cualquier tarjeta para abrir directamente en la app
            </p>
          )}
        </header>

        {/* Social Cards Grid */}
        <div className="social-cards-grid">
          {socialProfiles.map((profile) => (
            <SocialMediaCard
              key={profile.id}
              profile={profile}
              deviceInfo={deviceInfo}
            />
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
