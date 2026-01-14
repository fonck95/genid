import React, { useState } from 'react';
import { FacebookEmbed, InstagramEmbed } from 'react-social-media-embed';
import '../styles/FeaturedPosts.css';

// ============================================
// TYPES & INTERFACES
// ============================================

interface SocialPost {
  id: string;
  platform: 'facebook' | 'instagram';
  url: string;
  label?: string;
}

// ============================================
// PUBLICACIONES DESTACADAS - URLs de posts públicos
// Actualizar con URLs reales de publicaciones del candidato
// ============================================

const featuredPosts: SocialPost[] = [
  {
    id: 'fb-1',
    platform: 'facebook',
    url: 'https://www.facebook.com/jairo.cala.50/posts/pfbid0TG7VqDFqKjLqWrNQxM1HJZPvMxLJgYQRZc8VhWPvKxZLx',
    label: 'Facebook'
  },
  {
    id: 'ig-1',
    platform: 'instagram',
    url: 'https://www.instagram.com/p/C1234567890/',
    label: 'Instagram'
  },
  {
    id: 'fb-2',
    platform: 'facebook',
    url: 'https://www.facebook.com/jairo.cala.50/posts/pfbid02ABC123XYZ',
    label: 'Facebook'
  },
  {
    id: 'ig-2',
    platform: 'instagram',
    url: 'https://www.instagram.com/p/C0987654321/',
    label: 'Instagram'
  }
];

// ============================================
// SVG ICONS
// ============================================

const PlatformIcon: React.FC<{ platform: 'facebook' | 'instagram'; size?: number }> = ({ platform, size = 20 }) => {
  if (platform === 'facebook') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
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
// POST CARD COMPONENT
// ============================================

const PostCard: React.FC<{ post: SocialPost }> = ({ post }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const platformColor = post.platform === 'facebook' ? '#1877F2' : '#E4405F';
  const platformGradient = post.platform === 'facebook'
    ? 'linear-gradient(135deg, #1877F2, #4267B2)'
    : 'linear-gradient(45deg, #405DE6, #833AB4, #C13584, #E1306C, #FD1D1D)';

  return (
    <div className="featured-post-card">
      {/* Platform Badge */}
      <div
        className="post-platform-badge"
        style={{ background: platformGradient }}
      >
        <PlatformIcon platform={post.platform} size={16} />
        <span>{post.label}</span>
      </div>

      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="post-loading">
          <div className="post-loading-spinner" style={{ borderTopColor: platformColor }}></div>
          <span>Cargando publicación...</span>
        </div>
      )}

      {/* Error State - Fallback to link */}
      {hasError && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="post-error-fallback"
          style={{ '--fallback-color': platformColor } as React.CSSProperties}
        >
          <div className="fallback-icon" style={{ background: platformGradient }}>
            <PlatformIcon platform={post.platform} size={32} />
          </div>
          <p>Ver publicación en {post.platform === 'facebook' ? 'Facebook' : 'Instagram'}</p>
          <span className="fallback-link">Abrir en nueva pestaña</span>
        </a>
      )}

      {/* Embed Content */}
      <div
        className="post-embed-container"
        style={{ display: hasError ? 'none' : 'block' }}
      >
        {post.platform === 'facebook' ? (
          <FacebookEmbed
            url={post.url}
            width="100%"
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <InstagramEmbed
            url={post.url}
            width="100%"
            captioned
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
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
            <span>Últimas Publicaciones</span>
          </div>
          <h2>Síguenos en Redes Sociales</h2>
          <p>Mantente informado sobre nuestras propuestas, eventos y actividades de campaña</p>
        </header>

        {/* Posts Grid */}
        <div className="featured-posts-grid">
          {featuredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
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
            <span>Seguir en Facebook</span>
          </a>
          <a
            href="https://www.instagram.com/jairocalasantander"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-social-btn instagram"
          >
            <PlatformIcon platform="instagram" size={20} />
            <span>Seguir en Instagram</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPosts;
