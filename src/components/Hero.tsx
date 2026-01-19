import { noticias } from '../data/noticias';
import OptimizedImage from './OptimizedImage';
import '../styles/Hero.css';

const Hero = () => {
  const noticiasDestacadas = noticias.filter(n => n.destacada).slice(0, 3);
  const noticiasPrincipal = noticiasDestacadas[0];
  const noticiasSecundarias = noticiasDestacadas.slice(1, 3);

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
                priority={true}
              />
              <div className="hero-featured-overlay">
                <span className="badge badge-red">{noticiasPrincipal.categoria}</span>
                <h1 className="hero-featured-title">{noticiasPrincipal.titulo}</h1>
                <p className="hero-featured-subtitle">{noticiasPrincipal.subtitulo}</p>
                <span className="hero-featured-date">{noticiasPrincipal.fecha}</span>
              </div>
            </div>
          </article>
        </div>

        <div className="hero-sidebar">
          {noticiasSecundarias.map((noticia) => (
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
                <span className="badge badge-blue">{noticia.categoria}</span>
                <h2 className="hero-secondary-title">{noticia.titulo}</h2>
                <span className="hero-secondary-date">{noticia.fecha}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
