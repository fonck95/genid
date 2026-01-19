import '../styles/Footer.css';

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61586532852672';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section footer-brand">
            <div className="footer-logo-text">
              <span className="footer-logo-main">Berraquera</span>
              <span className="footer-logo-accent">Santandereana</span>
            </div>
            <p className="footer-tagline">
              Medio digital con información veraz y oportuna para los santandereanos
            </p>
          </div>

          <div className="footer-section">
            <h4>Secciones</h4>
            <ul className="footer-links">
              <li><a href="#inicio">Inicio</a></li>
              <li><a href="#noticias">Noticias</a></li>
              <li><a href="#galeria">Galería</a></li>
              <li><a href="#redes">Redes Sociales</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Categorías</h4>
            <ul className="footer-links">
              <li><a href="#noticias">Política</a></li>
              <li><a href="#noticias">Economía</a></li>
              <li><a href="#noticias">Ambiente</a></li>
              <li><a href="#noticias">Seguridad</a></li>
            </ul>
          </div>

          <div className="footer-section footer-social">
            <h4>Síguenos</h4>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Berraquera Santandereana. Todos los derechos reservados.</p>
          <p className="footer-disclaimer">
            Medio digital de noticias de Santander
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
