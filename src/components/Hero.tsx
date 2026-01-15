import React from 'react';
import '../styles/Hero.css';

const Hero: React.FC = () => {
  return (
    <section id="inicio" className="hero">
      <div className="hero-overlay">
        <div className="hero-content">
          <div className="hero-image-container">
            <img
              src="/jairoprofile.png"
              alt="Jairo Reinaldo Cala Suárez"
              className="hero-image"
            />
          </div>
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
    </section>
  );
};

export default Hero;
