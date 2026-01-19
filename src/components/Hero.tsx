import { noticias } from '../data/noticias';
import OptimizedImage from './OptimizedImage';
import '../styles/Hero.css';

const Hero = () => {
  const noticiasDestacadas = noticias.filter(n => n.destacada).slice(0, 3);
  const noticiasPrincipal = noticiasDestacadas[0];
  const noticiasSecundarias = noticiasDestacadas.slice(1, 3);

  const getCategoryClass = (categoria: string) => {
    return `category-badge category-${categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;
  };

  return (
    <section id="inicio" className="hero">
      <div className="hero-container">
        <div className="hero-main">
          <article className="hero-featured">
            <div className="hero-featured-image">
              <OptimizedImage
                src={noticiasPrincipal.imagen}
                alt={noticiasPrincipal.titulo}
                scaleFactor={2}
                objectFit="cover"
                priority
              />
            </div>
            <div className="hero-featured-content">
              <span className={getCategoryClass(noticiasPrincipal.categoria)}>
                {noticiasPrincipal.categoria}
              </span>
              <h1 className="hero-featured-title">{noticiasPrincipal.titulo}</h1>
              <p className="hero-featured-subtitle">{noticiasPrincipal.subtitulo}</p>
              <span className="hero-featured-date">{noticiasPrincipal.fecha}</span>
            </div>
          </article>
        </div>

        <aside className="hero-sidebar">
          <h2 className="hero-sidebar-title">También destacado</h2>
          {noticiasSecundarias.map(noticia => (
            <article key={noticia.id} className="hero-secondary">
              <div className="hero-secondary-image">
                <OptimizedImage
                  src={noticia.imagen}
                  alt={noticia.titulo}
                  scaleFactor={1.5}
                  objectFit="cover"
                />
              </div>
              <div className="hero-secondary-content">
                <span className={getCategoryClass(noticia.categoria)}>
                  {noticia.categoria}
                </span>
                <h3 className="hero-secondary-title">{noticia.titulo}</h3>
                <span className="hero-secondary-date">{noticia.fecha}</span>
              </div>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
};

export default Hero;
