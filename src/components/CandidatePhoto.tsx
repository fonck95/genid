import React, { useState } from 'react';
import '../styles/CandidatePhoto.css';

interface CandidatePhotoProps {
  src: string;
  alt: string;
}

// Helper to get WebP version of an image
const getWebPSrc = (src: string): string => {
  if (src.endsWith('.webp')) return src;
  return src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
};

const CandidatePhoto: React.FC<CandidatePhotoProps> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className="candidate-photo-container">
      <div className={`candidate-photo-wrapper ${isLoaded ? 'loaded' : 'loading'}`}>
        {!isLoaded && (
          <div className="candidate-photo-loader">
            <div className="loader-spinner"></div>
          </div>
        )}

        {!hasError ? (
          <picture>
            <source srcSet={getWebPSrc(src)} type="image/webp" />
            <img
              src={src}
              alt={alt}
              className={`candidate-photo ${isLoaded ? 'visible' : ''}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="eager"
              draggable={false}
            />
          </picture>
        ) : (
          <div className="candidate-photo-error">
            <span className="error-icon">📷</span>
            <span className="error-text">Imagen no disponible</span>
          </div>
        )}
      </div>

      {isLoaded && !hasError && (
        <div className="photo-badge">
          <span className="badge-text">Candidato Santander 101</span>
        </div>
      )}
    </div>
  );
};

export default CandidatePhoto;
