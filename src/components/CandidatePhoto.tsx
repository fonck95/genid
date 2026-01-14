import React, { useState } from 'react';
import { useWebGPUUpscale } from '../hooks/useWebGPUUpscale';
import '../styles/CandidatePhoto.css';

interface CandidatePhotoProps {
  src: string;
  alt: string;
  scaleFactor?: number;
}

const CandidatePhoto: React.FC<CandidatePhotoProps> = ({
  src,
  alt,
  scaleFactor = 2
}) => {
  const { canvasRef, isLoading, isSupported, error } = useWebGPUUpscale(src, {
    scaleFactor,
    sharpness: 0.4
  });
  const [fallbackVisible, setFallbackVisible] = useState(false);

  // Show native img as fallback if canvas processing failed
  const showFallback = error || fallbackVisible;

  return (
    <div className="candidate-photo-container">
      <div className={`candidate-photo-wrapper ${isLoading ? 'loading' : 'loaded'}`}>
        {/* Canvas for WebGPU/Canvas2D upscaled image */}
        <canvas
          ref={canvasRef}
          className={`candidate-photo ${showFallback ? 'hidden' : ''}`}
          aria-label={alt}
          onError={() => setFallbackVisible(true)}
        />

        {/* Native img fallback when canvas fails */}
        {showFallback && (
          <img
            src={src}
            alt={alt}
            className="candidate-photo candidate-photo-fallback"
            loading="eager"
          />
        )}

        {isLoading && !showFallback && (
          <div className="candidate-photo-loader">
            <div className="loader-spinner"></div>
          </div>
        )}
      </div>
      {!isLoading && (
        <div className="photo-badge">
          <span className="badge-text">
            {error ? 'Foto' : isSupported ? 'WebGPU Enhanced' : 'HD Quality'}
          </span>
        </div>
      )}
    </div>
  );
};

export default CandidatePhoto;
