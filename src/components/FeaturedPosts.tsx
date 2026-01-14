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
}

// ============================================
// PERFILES DE REDES SOCIALES
// Actualizar con las URLs correctas de cada perfil
// ============================================

const socialProfiles: SocialProfile[] = [
  {
    id: 'fb-profile',
    platform: 'facebook',
    profileUrl: 'https://www.facebook.com/jairo.cala.50',
    username: 'jairo.cala.50',
    displayName: 'Jairo Cala',
    label: 'Facebook'
  },
  {
    id: 'ig-profile',
    platform: 'instagram',
    profileUrl: 'https://www.instagram.com/jairocalasantander',
    username: 'jairocalasantander',
    displayName: 'Jairo Cala Santander',
    label: 'Instagram'
  },
  {
    id: 'tiktok-profile',
    platform: 'tiktok',
    profileUrl: 'https://www.tiktok.com/@jairocala',
    username: 'jairocala',
    displayName: 'Jairo Cala',
    label: 'TikTok'
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

// ============================================
// FACEBOOK PAGE PLUGIN COMPONENT
// ============================================

const FacebookPageWidget: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Facebook SDK
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
      document.body.appendChild(script);
    } else {
      setIsLoading(false);
      (window as any).FB.XFBML.parse();
    }
  }, []);

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

      <div className="post-embed-container facebook-embed">
        <div
          className="fb-page"
          data-href={profile.profileUrl}
          data-tabs="timeline"
          data-width=""
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

      <a
        href={profile.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="profile-link-overlay"
      >
        <span>Ver perfil completo</span>
      </a>
    </div>
  );
};

// ============================================
// INSTAGRAM PROFILE WIDGET
// ============================================

const InstagramProfileWidget: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
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
        <div className="profile-widget-header instagram-gradient">
          <div className="profile-avatar">
            <PlatformIcon platform="instagram" size={48} />
          </div>
          <div className="profile-info">
            <h3>@{profile.username}</h3>
            <p>{profile.displayName}</p>
          </div>
        </div>

        <div className="profile-widget-content">
          <p className="profile-description">
            Sigue nuestras historias y publicaciones en Instagram para mantenerte al día con las actividades de la campaña.
          </p>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </span>
              <span>Contenido verificado</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </span>
              <span>Historias diarias</span>
            </div>
          </div>
        </div>

        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-cta-button instagram"
        >
          <PlatformIcon platform="instagram" size={18} />
          <span>Seguir en Instagram</span>
        </a>
      </div>
    </div>
  );
};

// ============================================
// TIKTOK PROFILE WIDGET
// ============================================

const TikTokProfileWidget: React.FC<{ profile: SocialProfile }> = ({ profile }) => {
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
        <div className="profile-widget-header tiktok-gradient">
          <div className="profile-avatar tiktok">
            <PlatformIcon platform="tiktok" size={48} />
          </div>
          <div className="profile-info">
            <h3>@{profile.username}</h3>
            <p>{profile.displayName}</p>
          </div>
        </div>

        <div className="profile-widget-content">
          <p className="profile-description">
            Descubre nuestros videos cortos en TikTok. Contenido dinámico sobre propuestas, eventos y actividades de campaña.
          </p>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-icon tiktok-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </span>
              <span>Videos cortos</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon tiktok-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </span>
              <span>Contenido viral</span>
            </div>
          </div>
        </div>

        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-cta-button tiktok"
        >
          <PlatformIcon platform="tiktok" size={18} />
          <span>Seguir en TikTok</span>
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
          <h2>Síguenos en Redes Sociales</h2>
          <p>Mantente informado sobre nuestras propuestas, eventos y actividades de campaña</p>
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
            href="https://www.tiktok.com/@jairocala"
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
