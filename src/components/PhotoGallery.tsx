import { useState } from 'react';
import OptimizedImage from './OptimizedImage';
import '../styles/PhotoGallery.css';

interface Photo {
  id: number;
  src: string;
  title: string;
  description: string;
}

const photos: Photo[] = [
  {
    id: 1,
    src: '/optimized/eleccions.webp',
    title: 'Elecciones en Girón',
    description: 'Jornada electoral atípica en el municipio de Girón'
  },
  {
    id: 2,
    src: '/optimized/megacolegio.webp',
    title: 'Megacolegios',
    description: 'Infraestructura educativa en Santander'
  },
  {
    id: 3,
    src: '/optimized/uso.webp',
    title: 'USO en Ecopetrol',
    description: 'Histórica elección sindical en la petrolera'
  },
  {
    id: 4,
    src: '/optimized/paramo.webp',
    title: 'Páramo de Santurbán',
    description: 'Conflicto socioambiental latente en la región'
  },
  {
    id: 5,
    src: '/optimized/IA.webp',
    title: 'Tecnología en Bucaramanga',
    description: 'Inversión en sistemas de seguridad con IA'
  },
  {
    id: 6,
    src: '/optimized/manati.webp',
    title: 'Emergencia ambiental',
    description: 'Manatíes afectados en Ciénaga El Llanito'
  },
  {
    id: 7,
    src: '/optimized/sismo.webp',
    title: 'Sismo en Santander',
    description: 'Movimiento telúrico de magnitud 5.0'
  },
  {
    id: 8,
    src: '/optimized/aguilar.webp',
    title: 'Política regional',
    description: 'Movimientos políticos hacia las elecciones 2026'
  },
  {
    id: 9,
    src: '/optimized/banner.webp',
    title: 'Deportes',
    description: 'Victoria del Atlético Bucaramanga'
  }
];

const PhotoGallery = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    document.body.style.overflow = '';
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;

    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
    }

    setSelectedPhoto(photos[newIndex]);
  };

  return (
    <section id="galeria" className="gallery-section">
      <div className="gallery-container">
        <h2 className="section-title">Galería de Imágenes</h2>
        <p className="gallery-intro">
          Imágenes de las noticias más relevantes de Santander. Las imágenes son
          optimizadas y escaladas con WebGPU para la mejor experiencia visual.
        </p>

        <div className="gallery-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="gallery-item"
              onClick={() => openLightbox(photo)}
            >
              <div className="gallery-image">
                <OptimizedImage
                  src={photo.src}
                  alt={photo.title}
                  scaleFactor={2}
                  objectFit="cover"
                  showUpscaleIndicator={false}
                />
              </div>
              <div className="gallery-item-overlay">
                <h3>{photo.title}</h3>
                <p>{photo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox} aria-label="Cerrar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <button
              className="lightbox-nav lightbox-prev"
              onClick={() => navigatePhoto('prev')}
              aria-label="Anterior"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="lightbox-image">
              <OptimizedImage
                src={selectedPhoto.src}
                alt={selectedPhoto.title}
                scaleFactor={2.5}
                objectFit="contain"
                priority={true}
                showUpscaleIndicator={true}
              />
            </div>

            <button
              className="lightbox-nav lightbox-next"
              onClick={() => navigatePhoto('next')}
              aria-label="Siguiente"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div className="lightbox-info">
              <h3>{selectedPhoto.title}</h3>
              <p>{selectedPhoto.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PhotoGallery;
