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
    description: 'Infraestructura educativa bajo investigación'
  },
  {
    id: 3,
    src: '/optimized/uso.webp',
    title: 'Unión Sindical Obrera',
    description: 'César Loza elegido para junta directiva de Ecopetrol'
  },
  {
    id: 4,
    src: '/optimized/aguilar.webp',
    title: 'Política Santandereana',
    description: 'Movimientos políticos de cara a las elecciones 2026'
  },
  {
    id: 5,
    src: '/optimized/sismo.webp',
    title: 'Actividad Sísmica',
    description: 'Sismo de magnitud 5.0 en la región'
  },
  {
    id: 6,
    src: '/optimized/IA.webp',
    title: 'Tecnología y Seguridad',
    description: 'Plan de seguridad con inteligencia artificial'
  },
  {
    id: 7,
    src: '/optimized/paramo.webp',
    title: 'Páramo de Santurbán',
    description: 'Conflicto socioambiental latente'
  },
  {
    id: 8,
    src: '/optimized/manati.webp',
    title: 'Emergencia Ambiental',
    description: 'Contaminación en la Ciénaga El Llanito'
  },
  {
    id: 9,
    src: '/optimized/4enunanoche.webp',
    title: 'Seguridad Ciudadana',
    description: 'Situación de seguridad en Santander'
  }
];

const PhotoGallery = () => {
  const [fotoSeleccionada, setFotoSeleccionada] = useState<Photo | null>(null);
  const [indiceActual, setIndiceActual] = useState(0);

  const abrirLightbox = (foto: Photo, indice: number) => {
    setFotoSeleccionada(foto);
    setIndiceActual(indice);
    document.body.style.overflow = 'hidden';
  };

  const cerrarLightbox = () => {
    setFotoSeleccionada(null);
    document.body.style.overflow = '';
  };

  const navegarFoto = (direccion: 'prev' | 'next') => {
    const nuevoIndice = direccion === 'next'
      ? (indiceActual + 1) % photos.length
      : (indiceActual - 1 + photos.length) % photos.length;
    setIndiceActual(nuevoIndice);
    setFotoSeleccionada(photos[nuevoIndice]);
  };

  return (
    <section id="galeria" className="gallery-section">
      <div className="gallery-container">
        <div className="section-header">
          <h2 className="section-title">Galería</h2>
        </div>
        <p className="gallery-intro">
          Imágenes de las noticias más relevantes de Santander. Las fotos son optimizadas
          automáticamente y escaladas usando WebGPU para una mejor experiencia visual.
        </p>

        <div className="gallery-grid">
          {photos.map((foto, index) => (
            <div
              key={foto.id}
              className="gallery-item"
              onClick={() => abrirLightbox(foto, index)}
            >
              <OptimizedImage
                src={foto.src}
                alt={foto.title}
                scaleFactor={1.5}
                objectFit="cover"
              />
              <div className="gallery-item-overlay">
                <h4>{foto.title}</h4>
                <p>{foto.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {fotoSeleccionada && (
        <div className="lightbox-overlay" onClick={cerrarLightbox}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={cerrarLightbox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <button className="lightbox-nav lightbox-prev" onClick={() => navegarFoto('prev')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div className="lightbox-image">
              <OptimizedImage
                src={fotoSeleccionada.src}
                alt={fotoSeleccionada.title}
                scaleFactor={2}
                objectFit="contain"
                priority
              />
            </div>

            <button className="lightbox-nav lightbox-next" onClick={() => navegarFoto('next')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <div className="lightbox-info">
              <h3>{fotoSeleccionada.title}</h3>
              <p>{fotoSeleccionada.description}</p>
              <span className="lightbox-counter">{indiceActual + 1} / {photos.length}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PhotoGallery;
