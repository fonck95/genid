import React from 'react';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>FUERZA CIUDADANA</h3>
            <p>La Fuerza del Cambio</p>
          </div>
          <div className="footer-section">
            <h4>Jairo Reinaldo Cala Suárez</h4>
            <p>Candidato a la Cámara de Representantes</p>
            <p>Santander 101</p>
          </div>
          <div className="footer-section">
            <h4>Elecciones 2026</h4>
            <p>8 de Marzo de 2026</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Fuerza Ciudadana. Todos los derechos reservados.</p>
          <p className="footer-disclaimer">
            Sitio web informativo de campaña política.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
