import { useState } from 'react';
import { noticias, categorias, type Noticia } from '../data/noticias';
import OptimizedImage from './OptimizedImage';
import '../styles/NewsSection.css';

const NewsSection = () => {
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [noticiaExpandida, setNoticiaExpandida] = useState<Noticia | null>(null);

  const noticiasFiltradas = categoriaActiva === 'Todas'
    ? noticias.filter(n => !n.destacada)
    : noticias.filter(n => n.categoria === categoriaActiva && !n.destacada);

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
        <div className="news-header">
          <h2 className="section-title">Últimas Noticias</h2>
          <div className="news-filters">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                className={`filter-btn ${categoriaActiva === categoria ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(categoria)}
              >
                {categoria}
              </button>
            ))}
          </div>
        </div>

        <div className="news-grid">
          {noticiasFiltradas.map((noticia) => (
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
                <span className={`badge badge-${getCategoryColor(noticia.categoria)}`}>
                  {noticia.categoria}
                </span>
              </div>
              <div className="news-card-content">
                <h3 className="news-card-title">{noticia.titulo}</h3>
                <p className="news-card-excerpt">{noticia.subtitulo}</p>
                <span className="news-card-date">{noticia.fecha}</span>
              </div>
            </article>
          ))}
        </div>

        {noticiasFiltradas.length === 0 && (
          <div className="news-empty">
            <p>No hay noticias en esta categoría.</p>
          </div>
        )}
      </div>

      {/* Modal de noticia expandida */}
      {noticiaExpandida && (
        <div className="news-modal-overlay" onClick={cerrarNoticia}>
          <article className="news-modal" onClick={(e) => e.stopPropagation()}>
            <button className="news-modal-close" onClick={cerrarNoticia} aria-label="Cerrar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="news-modal-image">
              <OptimizedImage
                src={noticiaExpandida.imagen}
                alt={noticiaExpandida.titulo}
                scaleFactor={2}
                objectFit="cover"
                priority={true}
              />
            </div>

            <div className="news-modal-content">
              <div className="news-modal-meta">
                <span className={`badge badge-${getCategoryColor(noticiaExpandida.categoria)}`}>
                  {noticiaExpandida.categoria}
                </span>
                <span className="news-modal-date">{noticiaExpandida.fecha}</span>
              </div>

              <h2 className="news-modal-title">{noticiaExpandida.titulo}</h2>
              <p className="news-modal-subtitle">{noticiaExpandida.subtitulo}</p>

              <div className="news-modal-body">
                {noticiaExpandida.contenido.split('\n\n').map((parrafo, idx) => (
                  <p key={idx}>{parrafo}</p>
                ))}
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
};

const getCategoryColor = (categoria: string): string => {
  const colors: Record<string, string> = {
    'Política': 'red',
    'Educación': 'blue',
    'Economía': 'gold',
    'Región': 'blue',
    'Tecnología': 'blue',
    'Ambiente': 'green',
    'Judicial': 'red',
    'Cultura': 'gold',
    'Deportes': 'green',
  };
  return colors[categoria] || 'blue';
};

export default NewsSection;
