import React, { useState, useEffect, useRef } from 'react';
import { useWebGPUUpscale } from '../hooks/useWebGPUUpscale';
import '../styles/OptimizedImage.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  scaleFactor?: number;
  targetWidth?: number;
  targetHeight?: number;
  showUpscaleIndicator?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  priority?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  scaleFactor = 2,
  targetWidth,
  targetHeight,
  showUpscaleIndicator = false,
  objectFit = 'cover',
  priority = false,
}) => {
  const [originalLoaded, setOriginalLoaded] = useState(false);
  const [showUpscaled, setShowUpscaled] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Solo iniciar upscaling cuando la imagen esté en vista
  const { upscaledUrl, isLoading, isWebGPUSupported } = useWebGPUUpscale(
    isInView ? src : null,
    { scaleFactor, targetWidth, targetHeight }
  );

  // Transición suave cuando el upscaling termine
  useEffect(() => {
    if (upscaledUrl && originalLoaded) {
      // Pequeño delay para asegurar que la imagen upscaled esté en cache
      const timer = setTimeout(() => setShowUpscaled(true), 50);
      return () => clearTimeout(timer);
    }
  }, [upscaledUrl, originalLoaded]);

  const handleOriginalLoad = () => {
    setOriginalLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className={`optimized-image-container ${className}`}
      style={{ '--object-fit': objectFit } as React.CSSProperties}
    >
      {/* Placeholder de baja calidad mientras carga */}
      {!originalLoaded && (
        <div className="optimized-image-placeholder">
          <div className="optimized-image-spinner" />
        </div>
      )}

      {/* Imagen original (comprimida) */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`optimized-image-original ${originalLoaded ? 'loaded' : ''} ${showUpscaled ? 'hidden' : ''}`}
          onLoad={handleOriginalLoad}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* Imagen upscaled con WebGPU */}
      {upscaledUrl && (
        <img
          src={upscaledUrl}
          alt={alt}
          className={`optimized-image-upscaled ${showUpscaled ? 'visible' : ''}`}
        />
      )}

      {/* Indicador de upscaling (opcional para debugging) */}
      {showUpscaleIndicator && (
        <div className="optimized-image-indicator">
          {isLoading ? (
            <span className="indicator-loading">Mejorando...</span>
          ) : showUpscaled ? (
            <span className="indicator-success">
              {isWebGPUSupported ? 'WebGPU' : 'Canvas HD'}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
