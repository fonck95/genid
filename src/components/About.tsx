import React from 'react';
import '../styles/About.css';

const About: React.FC = () => {
  return (
    <section id="biografia" className="about">
      <div className="about-container">
        <h2 className="section-title">Biografía</h2>
        <div className="about-content">
          {/* Candidate Photo */}
          <div className="about-image-section">
            <div className="about-image-wrapper">
              <img
                src="/images/candidate/profile.svg"
                alt="Jairo Reinaldo Cala Suárez"
                className="about-candidate-image"
              />
              <div className="image-overlay">
                <span className="candidate-name">Jairo Cala</span>
                <span className="candidate-role">Candidato a la Cámara</span>
              </div>
            </div>
            <div className="about-image-badge">
              <span className="badge-number">101</span>
              <span className="badge-text">Santander</span>
            </div>
          </div>

          {/* Biography Text */}
          <div className="about-text">
            <p className="about-intro">
              Nacido en Palmar, Santander, en 1964, con formación en administración pública.
            </p>
            <div className="about-details">
              <h3>Trayectoria Política</h3>
              <ul>
                <li>Delegado al Consejo Nacional de Reincorporación</li>
                <li>Congresista entre 2018 y 2022</li>
                <li>Candidato a la Cámara de Representantes 2026 por Santander 101</li>
              </ul>

              <h3>Logros en el Congreso</h3>
              <ul>
                <li><strong>Defensa de FERTICOL:</strong> Liderazgo en la protección de la empresa pública de fertilizantes</li>
                <li><strong>Protección del Páramo de Santurbán:</strong> Lucha contra las concesiones mineras que amenazan este ecosistema vital</li>
                <li><strong>Oposición al Fracking:</strong> Firme rechazo a la fracturación hidráulica en el territorio</li>
                <li><strong>Implementación de los Acuerdos de Paz:</strong> Trabajo constante por la consolidación del proceso de paz</li>
              </ul>

              <h3>Compromiso con Santander</h3>
              <p>
                Mi liderazgo garantiza continuidad en la defensa de temas sensibles para el departamento,
                como la protección del páramo de Santurbán, la oposición al fracking, y la implementación
                de los Acuerdos de Paz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
