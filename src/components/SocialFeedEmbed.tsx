import React, { useState, useEffect, Suspense } from 'react';
import { InstagramEmbed, FacebookEmbed, TikTokEmbed } from 'react-social-media-embed';
import '../styles/SocialFeedEmbed.css';

// ============================================
// TYPES & INTERFACES
// ============================================

interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'tiktok';
  url: string;
  fallbackText?: string;
}

interface ProfileInfo {
  platform: 'instagram' | 'facebook' | 'tiktok';
  username: string;
  displayName: string;
  profileUrl: string;
  appDeepLink?: string;
}

// ============================================
// CONFIGURACIÓN DE PERFILES
// ============================================

const profiles: ProfileInfo[] = [
  {
    platform: 'facebook',
    username: 'jairo.cala.50',
    displayName: 'Jairo Cala',
    profileUrl: 'https://www.facebook.com/jairo.cala.50',
    appDeepLink: 'fb://profile/jairo.cala.50'
  },
  {
    platform: 'instagram',
    username: 'jairocalasantander',
    displayName: 'Jairo Cala Santander',
    profileUrl: 'https://www.instagram.com/jairocalasantander',
    appDeepLink: 'instagram://user?username=jairocalasantander'
  },
  {
    platform: 'tiktok',
    username: 'jairocalacomunes',
    displayName: 'Jairo Cala Comunes',
    profileUrl: 'https://www.tiktok.com/@jairocalacomunes',
    appDeepLink: 'tiktok://user?username=jairocalacomunes'
  }
];

// ============================================
// POSTS A EMBEBER
// Actualiza estas URLs con posts reales de cada perfil
// ============================================

const socialPosts: SocialPost[] = [
  // Posts de Instagram - Actualizar con URLs reales de posts
  {
    id: 'ig-1',
    platform: 'instagram',
    url: 'https://www.instagram.com/p/example1/', // Reemplazar con URL real
    fallbackText: 'Post de Instagram'
  },
  {
    id: 'ig-2',
    platform: 'instagram',
    url: 'https://www.instagram.com/p/example2/', // Reemplazar con URL real
    fallbackText: 'Post de Instagram'
  },
  // Posts de Facebook - Actualizar con URLs reales
  {
    id: 'fb-1',
    platform: 'facebook',
    url: 'https://www.facebook.com/jairo.cala.50/posts/example1', // Reemplazar con URL real
    fallbackText: 'Post de Facebook'
  },
  // Videos de TikTok - Actualizar con URLs reales
  {
    id: 'tt-1',
    platform: 'tiktok',
    url: 'https://www.tiktok.com/@jairocalacomunes/video/example1', // Reemplazar con URL real
    fallbackText: 'Video de TikTok'
  },
  {
    id: 'tt-2',
    platform: 'tiktok',
    url: 'https://www.tiktok.com/@jairocalacomunes/video/example2', // Reemplazar con URL real
    fallbackText: 'Video de TikTok'
  }
];

// ============================================
// UTILITY HOOKS
// ============================================

const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIOS: false
  });

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
      window.innerWidth <= 768;

    setDeviceInfo({ isMobile, isIOS });
  }, []);

  return deviceInfo;
};

// ============================================
// SVG ICONS
// ============================================

const FacebookIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TikTokIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
  </svg>
);

const VerifiedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

// ============================================
// LOADING SPINNER
// ============================================

const LoadingSpinner = () => (
  <div className="embed-loading">
    <div className="spinner"></div>
    <span>Cargando contenido...</span>
  </div>
);

// ============================================
// ERROR FALLBACK
// ============================================

const EmbedFallback: React.FC<{ profile: ProfileInfo; message?: string }> = ({ profile, message }) => {
  const getPlatformIcon = () => {
    switch (profile.platform) {
      case 'facebook': return <FacebookIcon size={40} />;
      case 'instagram': return <InstagramIcon size={40} />;
      case 'tiktok': return <TikTokIcon size={40} />;
    }
  };

  const getPlatformColor = () => {
    switch (profile.platform) {
      case 'facebook': return '#1877F2';
      case 'instagram': return '#E4405F';
      case 'tiktok': return '#000000';
    }
  };

  return (
    <div className="embed-fallback" style={{ borderColor: getPlatformColor() }}>
      <div className="fallback-icon" style={{ color: getPlatformColor() }}>
        {getPlatformIcon()}
      </div>
      <p className="fallback-message">{message || 'Ver contenido en la app'}</p>
      <a
        href={profile.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fallback-link"
        style={{ background: getPlatformColor() }}
      >
        Visitar @{profile.username}
        <ExternalLinkIcon />
      </a>
    </div>
  );
};

// ============================================
// EMBED WRAPPER WITH ERROR BOUNDARY
// ============================================

interface EmbedWrapperProps {
  post: SocialPost;
  profile: ProfileInfo;
}

const EmbedWrapper: React.FC<EmbedWrapperProps> = ({ post, profile }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if URL is a placeholder
  const isPlaceholder = post.url.includes('example');

  if (isPlaceholder || hasError) {
    return <EmbedFallback profile={profile} message={post.fallbackText} />;
  }

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const embedProps = {
    url: post.url,
    width: '100%',
    onLoad: handleLoad,
    onError: handleError,
    retryDelay: 5000,
    retryDisabled: false
  };

  return (
    <div className="embed-container">
      {isLoading && <LoadingSpinner />}
      <Suspense fallback={<LoadingSpinner />}>
        <div className={`embed-content ${isLoading ? 'loading' : 'loaded'}`}>
          {post.platform === 'instagram' && (
            <InstagramEmbed {...embedProps} captioned />
          )}
          {post.platform === 'facebook' && (
            <FacebookEmbed {...embedProps} />
          )}
          {post.platform === 'tiktok' && (
            <TikTokEmbed {...embedProps} />
          )}
        </div>
      </Suspense>
    </div>
  );
};

// ============================================
// PROFILE HEADER CARD
// ============================================

interface ProfileCardProps {
  profile: ProfileInfo;
  isActive: boolean;
  onClick: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, isActive, onClick }) => {
  const { isMobile } = useDeviceDetection();

  const getPlatformGradient = () => {
    switch (profile.platform) {
      case 'facebook': return 'linear-gradient(135deg, #1877F2 0%, #4267B2 100%)';
      case 'instagram': return 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';
      case 'tiktok': return 'linear-gradient(135deg, #010101 0%, #25F4EE 50%, #FE2C55 100%)';
    }
  };

  const getPlatformIcon = () => {
    switch (profile.platform) {
      case 'facebook': return <FacebookIcon size={20} />;
      case 'instagram': return <InstagramIcon size={20} />;
      case 'tiktok': return <TikTokIcon size={20} />;
    }
  };

  const handleClick = () => {
    onClick();
    if (isMobile && profile.appDeepLink) {
      const start = Date.now();
      window.location.href = profile.appDeepLink;
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          window.open(profile.profileUrl, '_blank');
        }
      }, 1500);
    }
  };

  return (
    <button
      className={`profile-card ${profile.platform} ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      style={{ '--platform-gradient': getPlatformGradient() } as React.CSSProperties}
    >
      <div className="profile-card-header" style={{ background: getPlatformGradient() }}>
        <span className="platform-icon">{getPlatformIcon()}</span>
        <span className="platform-name">{profile.platform.charAt(0).toUpperCase() + profile.platform.slice(1)}</span>
      </div>
      <div className="profile-card-body">
        <div className="profile-avatar">
          <span>JC</span>
        </div>
        <div className="profile-details">
          <div className="profile-name-row">
            <span className="name">{profile.displayName}</span>
            <span className="verified"><VerifiedIcon /></span>
          </div>
          <span className="username">@{profile.username}</span>
        </div>
      </div>
    </button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const SocialFeedEmbed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'instagram' | 'facebook' | 'tiktok'>('instagram');
  const { isMobile } = useDeviceDetection();

  const activeProfile = profiles.find(p => p.platform === activeTab)!;
  const activePosts = socialPosts.filter(p => p.platform === activeTab);

  return (
    <section id="redes-sociales" className="social-feed-embed">
      <div className="feed-container">
        {/* Header */}
        <header className="feed-header">
          <div className="header-badge">
            <span className="live-dot"></span>
            <span>Redes Sociales Oficiales</span>
          </div>
          <h2>Síguenos en Redes Sociales</h2>
          <p>Mantente informado sobre nuestras propuestas, eventos y actividades de campaña</p>
        </header>

        {/* Profile Tabs */}
        <div className="profile-tabs">
          {profiles.map(profile => (
            <ProfileCard
              key={profile.platform}
              profile={profile}
              isActive={activeTab === profile.platform}
              onClick={() => setActiveTab(profile.platform)}
            />
          ))}
        </div>

        {/* Active Profile Info */}
        <div className="active-profile-section">
          <div className="active-profile-header">
            <h3>
              {activeTab === 'instagram' && <InstagramIcon size={24} />}
              {activeTab === 'facebook' && <FacebookIcon size={24} />}
              {activeTab === 'tiktok' && <TikTokIcon size={24} />}
              <span>@{activeProfile.username}</span>
            </h3>
            <a
              href={activeProfile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`visit-profile-btn ${activeTab}`}
            >
              {isMobile ? 'Abrir App' : 'Ver Perfil'}
              <ExternalLinkIcon />
            </a>
          </div>
        </div>

        {/* Embeds Grid */}
        <div className="embeds-grid">
          {activePosts.length > 0 ? (
            activePosts.map(post => (
              <EmbedWrapper
                key={post.id}
                post={post}
                profile={activeProfile}
              />
            ))
          ) : (
            <EmbedFallback
              profile={activeProfile}
              message={`Visita nuestro perfil de ${activeProfile.platform}`}
            />
          )}
        </div>

        {/* Note about content */}
        <div className="feed-note">
          <p>
            Para ver todo nuestro contenido actualizado, visita directamente nuestros perfiles
            en las redes sociales.
          </p>
        </div>

        {/* Quick Links */}
        <div className="quick-links-row">
          {profiles.map(profile => (
            <a
              key={profile.platform}
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`quick-link ${profile.platform}`}
            >
              {profile.platform === 'facebook' && <FacebookIcon size={18} />}
              {profile.platform === 'instagram' && <InstagramIcon size={18} />}
              {profile.platform === 'tiktok' && <TikTokIcon size={18} />}
              <span>{profile.platform.charAt(0).toUpperCase() + profile.platform.slice(1)}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialFeedEmbed;
