import React, { useState, useEffect, useRef } from 'react';
import '../styles/SocialFeedEmbed.css';

// ============================================
// TYPES
// ============================================

interface SocialProfile {
  platform: 'facebook' | 'instagram';
  username: string;
  displayName: string;
  profileUrl: string;
}

// ============================================
// PROFILES DATA
// ============================================

const profiles: SocialProfile[] = [
  {
    platform: 'facebook',
    username: 'jairo.cala.50',
    displayName: 'Jairo Cala',
    profileUrl: 'https://www.facebook.com/jairo.cala.50'
  },
  {
    platform: 'instagram',
    username: 'jairocalasantander',
    displayName: 'Jairo Cala Santander',
    profileUrl: 'https://www.instagram.com/jairocalasantander'
  }
];

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

const ExternalIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
  </svg>
);

// ============================================
// DETECT iOS DEVICE
// ============================================

const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// ============================================
// FACEBOOK PAGE PLUGIN COMPONENT
// Optimized for iOS/iPhone compatibility
// ============================================

const FacebookPagePlugin: React.FC<{ pageUrl: string; username: string }> = ({ pageUrl, username }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 500 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [isiOSDevice] = useState(isIOS);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // More conservative width for iOS compatibility
        const width = Math.min(containerWidth - 16, isiOSDevice ? 340 : 400);
        setDimensions({ width, height: isiOSDevice ? 450 : 500 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Timeout for fallback on iOS if iframe doesn't load
    const fallbackTimeout = setTimeout(() => {
      if (!isLoaded && isiOSDevice) {
        setShowFallback(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(fallbackTimeout);
    };
  }, [isiOSDevice, isLoaded]);

  const encodedUrl = encodeURIComponent(pageUrl);

  // Simplified URL parameters for better iOS compatibility
  const pluginUrl = isiOSDevice
    ? `https://www.facebook.com/plugins/page.php?href=${encodedUrl}&tabs=timeline&width=${dimensions.width}&height=${dimensions.height}&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false`
    : `https://www.facebook.com/plugins/page.php?href=${encodedUrl}&tabs=timeline&width=${dimensions.width}&height=${dimensions.height}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;

  const handleIframeLoad = () => {
    setIsLoaded(true);
    setShowFallback(false);
  };

  const handleIframeError = () => {
    setShowFallback(true);
  };

  return (
    <div className="facebook-plugin-container" ref={containerRef}>
      {!isLoaded && !showFallback && (
        <div className="embed-loading">
          <div className="spinner facebook-spinner"></div>
          <span>Cargando Facebook...</span>
        </div>
      )}

      {showFallback ? (
        <div className="facebook-fallback">
          <FacebookIcon size={48} />
          <h4>Jairo Cala</h4>
          <p>@{username}</p>
          <a
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="facebook-fallback-btn"
          >
            <FacebookIcon size={20} />
            <span>Ver perfil en Facebook</span>
            <ExternalIcon size={16} />
          </a>
        </div>
      ) : (
        <iframe
          src={pluginUrl}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            border: 'none',
            overflow: 'hidden',
            display: isLoaded ? 'block' : 'none',
            borderRadius: '8px',
            // iOS-specific styles
            WebkitOverflowScrolling: 'touch',
            transform: 'translateZ(0)',
          }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen={true}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; unload"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
          title="Facebook Page Timeline"
          loading="eager"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}

      {/* Always show direct link button */}
      <a
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="facebook-visit-btn"
      >
        <FacebookIcon size={20} />
        <span>Ver perfil completo</span>
        <ExternalIcon size={16} />
      </a>
    </div>
  );
};

// ============================================
// INSTAGRAM PROFILE EMBED
// Uses official Instagram embed (oEmbed API)
// ============================================

const InstagramProfileEmbed: React.FC<{ username: string; profileUrl: string }> = ({ username, profileUrl }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Instagram embed script
    const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');

    if (existingScript) {
      // Script already exists, just process embeds
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount since we might need it
    };
  }, []);

  // Re-process embeds when username changes
  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process();
    }
  }, [username]);

  return (
    <div className="instagram-embed-container">
      {isLoading && (
        <div className="embed-loading">
          <div className="spinner instagram-spinner"></div>
          <span>Cargando Instagram...</span>
        </div>
      )}

      {/* Instagram Profile Embed using blockquote */}
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={`${profileUrl}/?utm_source=ig_embed&utm_campaign=loading`}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '280px',
          padding: 0,
          width: 'calc(100% - 2px)'
        }}
      >
        <div style={{ padding: '16px' }}>
          <a
            href={profileUrl}
            style={{
              background: '#FFFFFF',
              lineHeight: 0,
              padding: '0 0',
              textAlign: 'center',
              textDecoration: 'none',
              width: '100%'
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <div style={{
                backgroundColor: '#F4F4F4',
                borderRadius: '50%',
                flexGrow: 0,
                height: '40px',
                marginRight: '14px',
                width: '40px'
              }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
                <div style={{
                  backgroundColor: '#F4F4F4',
                  borderRadius: '4px',
                  flexGrow: 0,
                  height: '14px',
                  marginBottom: '6px',
                  width: '100px'
                }}></div>
                <div style={{
                  backgroundColor: '#F4F4F4',
                  borderRadius: '4px',
                  flexGrow: 0,
                  height: '14px',
                  width: '60px'
                }}></div>
              </div>
            </div>
            <div style={{ padding: '19% 0' }}></div>
            <div style={{
              display: 'block',
              height: '50px',
              margin: '0 auto 12px',
              width: '50px'
            }}>
              <InstagramIcon size={50} />
            </div>
            <div style={{ paddingTop: '8px' }}>
              <div style={{
                color: '#3897f0',
                fontFamily: 'Arial,sans-serif',
                fontSize: '14px',
                fontWeight: 550,
                lineHeight: '18px'
              }}>
                Ver perfil de @{username} en Instagram
              </div>
            </div>
          </a>
        </div>
      </blockquote>

      {/* Fallback button */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-visit-btn"
      >
        <InstagramIcon size={20} />
        <span>Ver perfil completo</span>
        <ExternalIcon size={16} />
      </a>
    </div>
  );
};

// ============================================
// FEED CARD COMPONENT
// ============================================

interface FeedCardProps {
  profile: SocialProfile;
}

const FeedCard: React.FC<FeedCardProps> = ({ profile }) => {
  const Icon = profile.platform === 'facebook' ? FacebookIcon : InstagramIcon;
  const platformName = profile.platform === 'facebook' ? 'Facebook' : 'Instagram';

  return (
    <div className={`feed-card ${profile.platform}`}>
      <div className="feed-card-header">
        <Icon size={24} />
        <div className="feed-card-info">
          <span className="feed-card-platform">{platformName}</span>
          <span className="feed-card-username">@{profile.username}</span>
        </div>
        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`feed-card-link ${profile.platform}`}
        >
          Ver Perfil
          <ExternalIcon />
        </a>
      </div>

      <div className="feed-card-content">
        {profile.platform === 'facebook' ? (
          <FacebookPagePlugin
            pageUrl={profile.profileUrl}
            username={profile.username}
          />
        ) : (
          <InstagramProfileEmbed
            username={profile.username}
            profileUrl={profile.profileUrl}
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

// Declare global window interface for Instagram embed
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

const SocialFeedEmbed: React.FC = () => {
  const facebookProfile = profiles.find(p => p.platform === 'facebook')!;
  const instagramProfile = profiles.find(p => p.platform === 'instagram')!;

  return (
    <section id="redes-sociales" className="social-feed-embed">
      <div className="feed-container">
        {/* Header */}
        <header className="feed-header">
          <h2>Redes Sociales</h2>
          <p>Síguenos para ver nuestras propuestas y actividades</p>
        </header>

        {/* Both Feeds Side by Side */}
        <div className="feeds-grid">
          <FeedCard profile={facebookProfile} />
          <FeedCard profile={instagramProfile} />
        </div>

        {/* Quick Access Links */}
        <div className="quick-access">
          <a
            href="https://www.facebook.com/jairo.cala.50"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link facebook"
          >
            <FacebookIcon size={20} />
            <span>Facebook</span>
          </a>
          <a
            href="https://www.instagram.com/jairocalasantander"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link instagram"
          >
            <InstagramIcon size={20} />
            <span>Instagram</span>
          </a>
          <a
            href="https://www.tiktok.com/@jairocalacomunes"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link tiktok"
          >
            <TikTokIcon size={20} />
            <span>TikTok</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SocialFeedEmbed;
