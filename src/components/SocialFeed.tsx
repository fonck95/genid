import React from 'react';
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
  followers: string;
  profileImage?: string;
}

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
    profileImage: 'https://graph.facebook.com/jairo.cala.50/picture?type=large'
  },
  {
    name: 'Instagram',
    icon: 'instagram',
    url: 'https://www.instagram.com/jairocalasantander',
    username: '@jairocalasantander',
    color: '#E4405F',
    followers: '2K+'
  },
  {
    name: 'TikTok',
    icon: 'tiktok',
    url: 'https://www.tiktok.com/@jairocala',
    username: '@jairocala',
    color: '#000000',
    followers: '1K+'
  },
  {
    name: 'X',
    icon: 'twitter',
    url: 'https://x.com/JairoComunes',
    username: '@JairoComunes',
    color: '#000000',
    followers: '6.7K'
  },
  {
    name: 'YouTube',
    icon: 'youtube',
    url: 'https://www.youtube.com/@jairocala5746',
    username: '@jairocala5746',
    color: '#FF0000',
    followers: '500+'
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
    tiktok: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
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
    external: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
      </svg>
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    )
  };

  return <>{icons[network] || null}</>;
};

// ============================================
// PROFILE THUMBNAIL CARD
// ============================================

const ProfileThumbnail: React.FC<{ network: SocialNetwork }> = ({ network }) => {
  const getGradient = (icon: string): string => {
    switch (icon) {
      case 'facebook':
        return 'linear-gradient(135deg, #1877F2, #4267B2)';
      case 'instagram':
        return 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)';
      case 'tiktok':
        return 'linear-gradient(135deg, #000000, #25F4EE, #FE2C55)';
      case 'twitter':
        return 'linear-gradient(135deg, #000000, #14171A)';
      case 'youtube':
        return 'linear-gradient(135deg, #FF0000, #CC0000)';
      default:
        return 'linear-gradient(135deg, #667eea, #764ba2)';
    }
  };

  return (
    <a
      href={network.url}
      target="_blank"
      rel="noopener noreferrer"
      className="profile-thumbnail"
      style={{ '--thumbnail-color': network.color } as React.CSSProperties}
    >
      {/* Thumbnail Avatar */}
      <div
        className="thumbnail-avatar"
        style={{ background: getGradient(network.icon) }}
      >
        {network.profileImage ? (
          <img
            src={network.profileImage}
            alt={`${network.name} profile`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <span className={`avatar-initials ${network.profileImage ? 'hidden' : ''}`}>JC</span>
      </div>

      {/* Platform Icon Badge */}
      <div
        className="platform-badge"
        style={{ backgroundColor: network.color }}
      >
        <SocialIcon network={network.icon} size={14} />
      </div>

      {/* Info */}
      <div className="thumbnail-info">
        <h4>{network.name}</h4>
        <span className="thumbnail-username">{network.username}</span>
        <span className="thumbnail-followers">
          <SocialIcon network="users" size={12} />
          {network.followers}
        </span>
      </div>

      {/* Hover Action */}
      <div className="thumbnail-action">
        <SocialIcon network="external" size={16} />
      </div>
    </a>
  );
};

// ============================================
// MAIN SOCIAL FEED COMPONENT
// ============================================

const SocialFeed: React.FC = () => {
  return (
    <section id="redes-sociales" className="social-feed">
      <div className="social-feed-container">
        {/* Header Section */}
        <header className="social-feed-header">
          <h2>Redes Sociales</h2>
          <p>Síguenos en nuestras redes sociales oficiales</p>
        </header>

        {/* Profile Thumbnails Grid */}
        <div className="thumbnails-grid">
          {socialNetworks.map((network) => (
            <ProfileThumbnail key={network.name} network={network} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialFeed;
