import React from 'react';
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
  const { canvasRef, isLoading, isSupported } = useWebGPUUpscale(src, {
    scaleFactor,
    sharpness: 0.4
  });

  return (
    <div className="candidate-photo-container">
      <div className={`candidate-photo-wrapper ${isLoading ? 'loading' : 'loaded'}`}>
        <canvas
          ref={canvasRef}
          className="candidate-photo"
          aria-label={alt}
        />
        {isLoading && (
          <div className="candidate-photo-loader">
            <div className="loader-spinner"></div>
          </div>
        )}
      </div>
      {!isLoading && (
        <div className="photo-badge">
          <span className="badge-text">
            {isSupported ? 'WebGPU Enhanced' : 'HD Quality'}
          </span>
        </div>
      )}
    </div>
  );
};

export default CandidatePhoto;
