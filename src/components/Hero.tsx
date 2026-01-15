import React from 'react';
import CandidatePhoto from './CandidatePhoto';
import '../styles/Hero.css';

const Hero: React.FC = () => {
  return (
    <section id="inicio" className="hero">
      <div className="hero-background">
        <div className="hero-particles"></div>
      </div>
      <div className="hero-overlay">
        <div className="hero-content">
          <div className="hero-photo-section">
            <CandidatePhoto
              src="/jairoprofile.png"
              alt="Jairo Reinaldo Cala Suárez - Candidato a la Cámara de Representantes"
            />
          </div>
          <div className="hero-text-section">
            <h1 className="hero-title">JAIRO REINALDO CALA SUÁREZ</h1>
            <h2 className="hero-subtitle">Candidato a la Cámara de Representantes</h2>
            <p className="hero-district">Santander 101</p>
            <p className="hero-slogan">La Fuerza del Cambio</p>
            <div className="hero-cta">
              <button
                className="cta-button primary"
                onClick={() => document.getElementById('propuestas')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Conoce mis Propuestas
              </button>
              <button
                className="cta-button secondary"
                onClick={() => document.getElementById('biografia')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Mi Trayectoria
              </button>
            </div>
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
