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
