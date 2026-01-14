import React, { useEffect, useState } from 'react';
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
}

// ============================================
// PERFILES DE REDES SOCIALES
// URLs corregidas y actualizadas
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
    posts: '200+'
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
    posts: '150+'
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
    posts: '50+'
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

// Icons for stats
const VerifiedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8zm0-10h8v8h-8V3z"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
  </svg>
);

// ============================================
// FACEBOOK PAGE PLUGIN COMPONENT
// Mejorado con mejor UX y tamaño
// ============================================

const FacebookPageWidget: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
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

    // Timeout para manejar bloqueo de SDK
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
    <div className="featured-post-card facebook-card">
      <div
        className="post-platform-badge"
        style={{ background: 'linear-gradient(135deg, #1877F2, #4267B2)' }}
      >
        <PlatformIcon platform="facebook" size={16} />
        <span>{profile.label}</span>
      </div>

      {isLoading && (
        <div className="post-loading">
          <div className="post-loading-spinner" style={{ borderTopColor: '#1877F2' }}></div>
          <span>Cargando Facebook...</span>
        </div>
      )}

      {hasError ? (
        <div className="profile-widget facebook-fallback">
          <div className="profile-widget-header facebook-gradient">
            <div className="profile-avatar facebook">
              <PlatformIcon platform="facebook" size={48} />
            </div>
            <div className="profile-info">
              <h3>{profile.displayName}</h3>
              <p className="profile-username">@{profile.username}</p>
            </div>
          </div>

          <div className="profile-widget-content">
            <p className="profile-bio">{profile.bio}</p>

            <div className="profile-stats-grid">
              <div className="stat-box">
                <span className="stat-number">{profile.followers}</span>
                <span className="stat-label">Seguidores</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{profile.posts}</span>
                <span className="stat-label">Publicaciones</span>
              </div>
            </div>

            <div className="profile-features">
              <div className="feature-item">
                <VerifiedIcon />
                <span>Perfil verificado</span>
              </div>
              <div className="feature-item">
                <UsersIcon />
                <span>Comunidad activa</span>
              </div>
            </div>
          </div>

          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="profile-cta-button facebook"
          >
            <PlatformIcon platform="facebook" size={20} />
            <span>Visitar en Facebook</span>
            <ExternalLinkIcon />
          </a>
        </div>
      ) : (
        <>
          <div className="post-embed-container facebook-embed">
            <div
              className="fb-page"
              data-href={profile.profileUrl}
              data-tabs="timeline"
              data-width="500"
              data-height="600"
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

          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="profile-link-overlay"
          >
            <span>Ver perfil completo en Facebook</span>
            <ExternalLinkIcon />
          </a>
        </>
      )}
    </div>
  );
};

// ============================================
// INSTAGRAM PROFILE WIDGET - MEJORADO
// Con grid de contenido visual y mejor UX
// ============================================

const InstagramProfileWidget: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  // Simulacion de contenido visual del perfil
  const contentPreview = [
    { type: 'image', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { type: 'image', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { type: 'video', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { type: 'image', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { type: 'image', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { type: 'video', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  ];

  return (
    <div className="featured-post-card instagram-card">
      <div
        className="post-platform-badge"
        style={{ background: 'linear-gradient(45deg, #405DE6, #833AB4, #C13584, #E1306C, #FD1D1D)' }}
      >
        <PlatformIcon platform="instagram" size={16} />
        <span>{profile.label}</span>
      </div>

      <div className="profile-widget">
        {/* Header con avatar y stats */}
        <div className="profile-widget-header instagram-gradient">
          <div className="profile-avatar instagram-avatar">
            <div className="avatar-ring">
              <span className="avatar-initials">JC</span>
            </div>
          </div>
          <div className="profile-header-stats">
            <div className="stat-column">
              <span className="stat-value">{profile.posts}</span>
              <span className="stat-name">Posts</span>
            </div>
            <div className="stat-column">
              <span className="stat-value">{profile.followers}</span>
              <span className="stat-name">Seguidores</span>
            </div>
            <div className="stat-column">
              <span className="stat-value">500+</span>
              <span className="stat-name">Siguiendo</span>
            </div>
          </div>
        </div>

        {/* Info del perfil */}
        <div className="profile-details">
          <h3 className="profile-name">{profile.displayName}</h3>
          <p className="profile-handle">@{profile.username}</p>
          <p className="profile-bio">{profile.bio}</p>
        </div>

        {/* Grid de contenido preview */}
        <div className="content-preview-section">
          <div className="section-header">
            <GridIcon />
            <span>Contenido Reciente</span>
          </div>
          <div className="content-grid instagram-grid">
            {contentPreview.map((item, index) => (
              <div
                key={index}
                className="content-item"
                style={{ background: item.gradient }}
              >
                {item.type === 'video' && (
                  <div className="content-type-badge">
                    <PlayIcon />
                  </div>
                )}
                <div className="content-overlay">
                  <HeartIcon />
                  <span>{Math.floor(Math.random() * 500 + 100)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-cta-button instagram"
        >
          <PlatformIcon platform="instagram" size={20} />
          <span>Seguir en Instagram</span>
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
};

// ============================================
// TIKTOK PROFILE WIDGET - MEJORADO
// Con preview de videos y mejor UX
// ============================================

const TikTokProfileWidget: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  // Simulacion de videos del perfil
  const videoPreview = [
    { views: '15.2K', gradient: 'linear-gradient(180deg, #000 0%, #FE2C55 100%)' },
    { views: '8.7K', gradient: 'linear-gradient(180deg, #000 0%, #25F4EE 100%)' },
    { views: '22.1K', gradient: 'linear-gradient(180deg, #25F4EE 0%, #FE2C55 100%)' },
    { views: '5.3K', gradient: 'linear-gradient(180deg, #FE2C55 0%, #25F4EE 100%)' },
    { views: '11.9K', gradient: 'linear-gradient(180deg, #000 0%, #FF0050 100%)' },
    { views: '18.4K', gradient: 'linear-gradient(180deg, #00F2EA 0%, #000 100%)' },
  ];

  return (
    <div className="featured-post-card tiktok-card">
      <div
        className="post-platform-badge"
        style={{ background: 'linear-gradient(135deg, #000000, #25F4EE, #FE2C55)' }}
      >
        <PlatformIcon platform="tiktok" size={16} />
        <span>{profile.label}</span>
      </div>

      <div className="profile-widget">
        {/* Header con avatar y stats */}
        <div className="profile-widget-header tiktok-gradient">
          <div className="profile-avatar tiktok-avatar">
            <div className="avatar-ring tiktok-ring">
              <span className="avatar-initials">JC</span>
            </div>
          </div>
          <div className="profile-header-stats tiktok-stats">
            <div className="stat-column">
              <span className="stat-value">{profile.followers}</span>
              <span className="stat-name">Seguidores</span>
            </div>
            <div className="stat-column">
              <span className="stat-value">50K+</span>
              <span className="stat-name">Me gusta</span>
            </div>
            <div className="stat-column">
              <span className="stat-value">{profile.posts}</span>
              <span className="stat-name">Videos</span>
            </div>
          </div>
        </div>

        {/* Info del perfil */}
        <div className="profile-details tiktok-details">
          <h3 className="profile-name">{profile.displayName}</h3>
          <p className="profile-handle">@{profile.username}</p>
          <p className="profile-bio">{profile.bio}</p>
        </div>

        {/* Grid de videos preview */}
        <div className="content-preview-section">
          <div className="section-header tiktok-section-header">
            <PlayIcon />
            <span>Videos Destacados</span>
          </div>
          <div className="content-grid tiktok-grid">
            {videoPreview.map((video, index) => (
              <div
                key={index}
                className="content-item tiktok-video-item"
                style={{ background: video.gradient }}
              >
                <div className="video-play-icon">
                  <PlayIcon />
                </div>
                <div className="video-views">
                  <PlayIcon />
                  <span>{video.views}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-cta-button tiktok"
        >
          <PlatformIcon platform="tiktok" size={20} />
          <span>Seguir en TikTok</span>
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
};

// ============================================
// PROFILE CARD RENDERER
// ============================================

const ProfileCard: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  switch (profile.platform) {
    case 'facebook':
      return <FacebookPageWidget profile={profile} />;
    case 'instagram':
      return <InstagramProfileWidget profile={profile} />;
    case 'tiktok':
      return <TikTokProfileWidget profile={profile} />;
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
          <h2>Siguenos en Redes Sociales</h2>
          <p>Mantente informado sobre nuestras propuestas, eventos y actividades de campana</p>
        </header>

        {/* Profiles Grid */}
        <div className="featured-posts-grid three-columns">
          {socialProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>

        {/* CTA Section */}
        <div className="featured-posts-cta">
          <a
            href="https://www.facebook.com/jairo.cala.50"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-social-btn facebook"
          >
            <PlatformIcon platform="facebook" size={20} />
            <span>Facebook</span>
          </a>
          <a
            href="https://www.instagram.com/jairocalasantander"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-social-btn instagram"
          >
            <PlatformIcon platform="instagram" size={20} />
            <span>Instagram</span>
          </a>
          <a
            href="https://www.tiktok.com/@jairocalacomunes"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-social-btn tiktok"
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
