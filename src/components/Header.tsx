import React, { useState, useEffect, useCallback } from 'react';
import '../styles/Header.css';

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'publicaciones', label: 'Publicaciones' },
  { id: 'biografia', label: 'Presentación' },
  { id: 'propuestas', label: 'Iniciativas' },
  { id: 'galeria', label: 'Galería' },
  { id: 'contacto', label: 'Contacto' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Close menu on window resize (when transitioning to desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen]);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  return (
    <>
      <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
        <div className="header-container">
          <div className="logo">
            <button
              onClick={() => scrollToSection('inicio')}
              className="logo-button"
              aria-label="Ir al inicio"
            >
              <picture>
                <source srcSet="/logomarca.webp" type="image/webp" />
                <img src="/logomarca.png" alt="Fuerza Ciudadana" className="logo-image" />
              </picture>
              <h1>FUERZA CIUDADANA</h1>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="nav nav--desktop" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="nav-link"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className={`hamburger ${isMenuOpen ? 'hamburger--active' : ''}`}
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <div
        className={`mobile-overlay ${isMenuOpen ? 'mobile-overlay--visible' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Navigation Menu */}
      <nav
        id="mobile-menu"
        className={`nav-mobile ${isMenuOpen ? 'nav-mobile--open' : ''}`}
        aria-label="Navegación móvil"
        aria-hidden={!isMenuOpen}
      >
        <div className="nav-mobile-content">
          {NAV_ITEMS.map((item, index) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="nav-mobile-link"
              style={{ animationDelay: `${index * 0.05}s` }}
              tabIndex={isMenuOpen ? 0 : -1}
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
