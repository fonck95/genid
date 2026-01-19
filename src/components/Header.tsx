import { useState, useEffect, useCallback } from 'react';
import '../styles/Header.css';

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'galeria', label: 'Galería' },
  { id: 'redes', label: 'Síguenos' },
];

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61586532852672';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleNavClick = useCallback((sectionId: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 70;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - headerHeight, behavior: 'smooth' });
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-container">
          <span className="top-bar-date">{getCurrentDate()}</span>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="top-bar-social"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Síguenos en Facebook</span>
          </a>
        </div>
      </div>

      <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
        <div className="header-container">
          <div className="logo">
            <button
              className="logo-button"
              onClick={scrollToTop}
              aria-label="Ir al inicio"
            >
              <div className="logo-text">
                <span className="logo-main">Berraquera</span>
                <span className="logo-accent">Santandereana</span>
              </div>
            </button>
          </div>

          <nav className="nav--desktop" aria-label="Navegación principal">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className="nav-link"
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            className={`hamburger ${isMenuOpen ? 'hamburger--active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </header>

      <div
        className={`mobile-overlay ${isMenuOpen ? 'mobile-overlay--visible' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      <nav
        className={`nav-mobile ${isMenuOpen ? 'nav-mobile--open' : ''}`}
        aria-label="Navegación móvil"
      >
        <div className="nav-mobile-content">
          {NAV_ITEMS.map((item, index) => (
            <button
              key={item.id}
              className="nav-mobile-link"
              onClick={() => handleNavClick(item.id)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Header;
