import React from 'react';
import '../styles/Hero.css';

const Hero: React.FC = () => {
  return (
    <section id="inicio" className="hero">
      {/* Background Image Layer */}
      <div className="hero-background">
        <div className="hero-image-container">
          <img
            src="/images/candidate/profile.svg"
            alt="Jairo Reinaldo Cala Suárez"
            className="hero-candidate-image"
          />
        </div>
      </div>

      {/* Overlay */}
      <div className="hero-overlay">
        <div className="hero-content">
          {/* Badge */}
          <div className="hero-badge">
            <span className="badge-icon">🗳️</span>
            <span>Elecciones 2026</span>
          </div>

          <h1 className="hero-title">JAIRO REINALDO CALA SUÁREZ</h1>
          <h2 className="hero-subtitle">Candidato a la Cámara de Representantes</h2>
          <p className="hero-district">
            <span className="district-label">Circunscripción</span>
            <span className="district-number">Santander 101</span>
          </p>
          <p className="hero-slogan">La Fuerza del Cambio</p>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">4</span>
              <span className="stat-label">Años en el Congreso</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">30+</span>
              <span className="stat-label">Proyectos de Ley</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Compromiso</span>
            </div>
          </div>

          <div className="hero-cta">
            <button
              className="cta-button primary"
              onClick={() => document.getElementById('propuestas')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span>Conoce mis Propuestas</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </button>
            <button
              className="cta-button secondary"
              onClick={() => document.getElementById('biografia')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span>Mi Trayectoria</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-indicator">
        <span>Descubre más</span>
        <div className="scroll-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Hero;
