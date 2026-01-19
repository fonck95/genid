import { useState } from 'react';
import { noticias, categorias, type Noticia } from '../data/noticias';
import OptimizedImage from './OptimizedImage';
import '../styles/NewsSection.css';

const NewsSection = () => {
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [noticiaExpandida, setNoticiaExpandida] = useState<Noticia | null>(null);

  // Al filtrar por categoría específica, mostrar TODAS las de esa categoría
  const noticiasFiltradas = categoriaActiva === 'Todas'
    ? noticias.filter(n => !n.destacada)
    : noticias.filter(n => n.categoria === categoriaActiva);

  const getCategoryClass = (categoria: string) => {
    return `category-badge category-${categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;
  };

  const abrirNoticia = (noticia: Noticia) => {
    setNoticiaExpandida(noticia);
    document.body.style.overflow = 'hidden';
  };

  const cerrarNoticia = () => {
    setNoticiaExpandida(null);
    document.body.style.overflow = '';
  };

  return (
    <section id="noticias" className="news-section">
      <div className="news-container">
        <div className="section-header">
          <h2 className="section-title">Noticias</h2>
        </div>

        <div className="news-filters">
          {categorias.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${categoriaActiva === cat ? 'active' : ''}`}
              onClick={() => setCategoriaActiva(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="news-grid">
          {noticiasFiltradas.map(noticia => (
            <article
              key={noticia.id}
              className="news-card"
              onClick={() => abrirNoticia(noticia)}
            >
              <div className="news-card-image">
                <OptimizedImage
                  src={noticia.imagen}
                  alt={noticia.titulo}
                  scaleFactor={1.5}
                  objectFit="cover"
                />
              </div>
              <div className="news-card-content">
                <span className={getCategoryClass(noticia.categoria)}>
                  {noticia.categoria}
                </span>
                <h3 className="news-card-title">{noticia.titulo}</h3>
                <p className="news-card-excerpt">{noticia.subtitulo}</p>
                <span className="news-card-date">{noticia.fecha}</span>
              </div>
            </article>
          ))}
        </div>

        {noticiasFiltradas.length === 0 && (
          <p className="no-news">No hay noticias en esta categoría.</p>
        )}
      </div>

      {/* Modal de noticia expandida */}
      {noticiaExpandida && (
        <div className="news-modal-overlay" onClick={cerrarNoticia}>
          <article className="news-modal" onClick={e => e.stopPropagation()}>
            <button className="news-modal-close" onClick={cerrarNoticia}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="news-modal-image">
              <OptimizedImage
                src={noticiaExpandida.imagen}
                alt={noticiaExpandida.titulo}
                scaleFactor={2}
                objectFit="cover"
                priority
              />
            </div>
            <div className="news-modal-content">
              <span className={getCategoryClass(noticiaExpandida.categoria)}>
                {noticiaExpandida.categoria}
              </span>
              <h2 className="news-modal-title">{noticiaExpandida.titulo}</h2>
              <p className="news-modal-subtitle">{noticiaExpandida.subtitulo}</p>
              <span className="news-modal-date">{noticiaExpandida.fecha}</span>
              <div className="news-modal-body">
                {noticiaExpandida.contenido.split('\n\n').map((parrafo, i) => (
                  <p key={i}>{parrafo}</p>
                ))}
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
};

export default NewsSection;
