import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section footer-brand">
            <div className="footer-logo-text">
              <span className="footer-logo-main">Periódico</span>
              <span className="footer-logo-accent">Santander</span>
            </div>
            <p className="footer-tagline">
              Información veraz y oportuna para los santandereanos
            </p>
          </div>

          <div className="footer-section">
            <h4>Secciones</h4>
            <nav className="footer-nav">
              <a href="#inicio">Inicio</a>
              <a href="#noticias">Noticias</a>
              <a href="#galeria">Galería</a>
              <a href="#redes">Redes Sociales</a>
            </nav>
          </div>

          <div className="footer-section">
            <h4>Categorías</h4>
            <nav className="footer-nav">
              <a href="#noticias">Política</a>
              <a href="#noticias">Economía</a>
              <a href="#noticias">Ambiente</a>
              <a href="#noticias">Cultura</a>
            </nav>
          </div>

          <div className="footer-section footer-social">
            <h4>Síguenos</h4>
            <div className="footer-social-links">
              <a
                href="https://www.facebook.com/profile.php?id=61586532852672"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Síguenos en Facebook"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Periódico Santander. Todos los derechos reservados.</p>
          <p className="footer-tech">
            Optimizado con WebGPU para la mejor experiencia visual
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
