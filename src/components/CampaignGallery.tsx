import React, { useState } from 'react';
import '../styles/CampaignGallery.css';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title: string;
  category: string;
  description: string;
}

const galleryImages: GalleryImage[] = [
  {
    id: '1',
    src: '/images/campaign/evento-comunitario.svg',
    alt: 'Evento comunitario con la comunidad',
    title: 'Encuentro con la Comunidad',
    category: 'Eventos',
    description: 'Dialogando con los habitantes sobre sus necesidades y propuestas.'
  },
  {
    id: '2',
    src: '/images/campaign/reunion-campesinos.svg',
    alt: 'Reunión con campesinos',
    title: 'Apoyo al Campo',
    category: 'Rural',
    description: 'Trabajando junto a los campesinos santandereanos por un mejor futuro.'
  },
  {
    id: '3',
    src: '/images/campaign/visita-territorial.svg',
    alt: 'Visita territorial',
    title: 'Recorriendo el Territorio',
    category: 'Territorio',
    description: 'Conociendo de primera mano las realidades de cada municipio.'
  },
  {
    id: '4',
    src: '/images/campaign/paramo-santurban.svg',
    alt: 'Defensa del Páramo de Santurbán',
    title: 'Protección Ambiental',
    category: 'Ambiente',
    description: 'Luchando por la preservación del Páramo de Santurbán.'
  },
  {
    id: '5',
    src: '/images/campaign/congreso.svg',
    alt: 'Trabajo en el Congreso',
    title: 'Labor Legislativa',
    category: 'Congreso',
    description: 'Representando los intereses de Santander en el Congreso de la República.'
  },
  {
    id: '6',
    src: '/images/campaign/acuerdos-paz.svg',
    alt: 'Implementación de Acuerdos de Paz',
    title: 'Construcción de Paz',
    category: 'Paz',
    description: 'Comprometido con la implementación efectiva de los acuerdos de paz.'
  }
];

const categories = ['Todos', 'Eventos', 'Rural', 'Territorio', 'Ambiente', 'Congreso', 'Paz'];

const CampaignGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const filteredImages = selectedCategory === 'Todos'
    ? galleryImages
    : galleryImages.filter(img => img.category === selectedCategory);

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <section id="galeria" className="campaign-gallery">
      <div className="gallery-container">
        {/* Header */}
        <header className="gallery-header">
          <div className="header-badge">
            <span className="camera-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4z"/>
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
            </span>
            <span>Galería de Campaña</span>
          </div>
          <h2>Nuestra Trayectoria en Imágenes</h2>
          <p>Momentos que reflejan nuestro compromiso con Santander y su gente</p>
        </header>

        {/* Category Filters */}
        <div className="gallery-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className={`gallery-item ${index === 0 ? 'featured' : ''}`}
              onClick={() => openLightbox(image)}
            >
              <div className="gallery-image-wrapper">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="gallery-image"
                  loading="lazy"
                />
                <div className="gallery-overlay">
                  <span className="category-tag">{image.category}</span>
                  <div className="overlay-content">
                    <h3>{image.title}</h3>
                    <p>{image.description}</p>
                  </div>
                  <div className="view-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    <span>Ver</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="gallery-cta">
          <p>Síguenos en redes sociales para ver más contenido de la campaña</p>
          <div className="social-buttons">
            <a
              href="https://www.instagram.com/jairocalasantander"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              <span>Instagram</span>
            </a>
            <a
              href="https://www.facebook.com/jairo.cala.50"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.src} alt={selectedImage.alt} />
            <div className="lightbox-info">
              <span className="lightbox-category">{selectedImage.category}</span>
              <h3>{selectedImage.title}</h3>
              <p>{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CampaignGallery;
