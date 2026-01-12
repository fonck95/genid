import React from 'react';
import '../styles/Contact.css';

const Contact: React.FC = () => {
  return (
    <section id="contacto" className="contact">
      <div className="contact-container">
        <h2 className="section-title">Contacto</h2>
        <p className="section-subtitle">
          ¿Tienes preguntas o quieres sumarte a nuestra campaña?
        </p>
        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div>
                <h3>Ubicación</h3>
                <p>Santander, Colombia</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">🗳️</div>
              <div>
                <h3>Circunscripción</h3>
                <p>Santander 101</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">🏛️</div>
              <div>
                <h3>Movimiento</h3>
                <p>Fuerza Ciudadana</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📅</div>
              <div>
                <h3>Elecciones</h3>
                <p>8 de Marzo de 2026</p>
              </div>
            </div>
          </div>
          <div className="contact-cta">
            <h3>Únete a la Fuerza del Cambio</h3>
            <p>
              Juntos construiremos un Santander más justo, próspero y sostenible.
              Tu voz importa, tu voto cuenta.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
