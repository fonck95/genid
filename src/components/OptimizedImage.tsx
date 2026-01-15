import React, { useState, useEffect, useRef } from 'react';
import { useWebGPUUpscale } from '../hooks/useWebGPUUpscale';
import '../styles/OptimizedImage.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  scaleFactor?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  priority?: boolean;
  showUpscaleIndicator?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  scaleFactor = 2,
  objectFit = 'cover',
  priority = false,
  showUpscaleIndicator = false,
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
  const { canvasRef, isLoading, isSupported, error } = useWebGPUUpscale(
    isInView ? src : '',
    { scaleFactor, sharpness: 0.5 }
  );

  // Transición suave cuando el upscaling termine
  // Delay aumentado a 200ms para asegurar que el canvas esté completamente dibujado
  useEffect(() => {
    if (!isLoading && !error && originalLoaded && canvasRef.current) {
      // Verificar que el canvas tenga dimensiones válidas antes de mostrar
      const canvas = canvasRef.current;
      if (canvas.width > 0 && canvas.height > 0) {
        const timer = setTimeout(() => setShowUpscaled(true), 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, error, originalLoaded]);

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

      {/* Imagen original (comprimida) - se mantiene visible para evitar flickering */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`optimized-image-original ${originalLoaded ? 'loaded' : ''}`}
          onLoad={handleOriginalLoad}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* Canvas con imagen upscaled usando WebGPU/Canvas2D */}
      <canvas
        ref={canvasRef}
        className={`optimized-image-canvas ${showUpscaled ? 'visible' : ''}`}
        aria-label={alt}
      />

      {/* Indicador de upscaling (opcional para debugging) */}
      {showUpscaleIndicator && (
        <div className="optimized-image-indicator">
          {isLoading ? (
            <span className="indicator-loading">Mejorando...</span>
          ) : showUpscaled ? (
            <span className="indicator-success">
              {isSupported ? 'WebGPU' : 'Canvas HD'}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
