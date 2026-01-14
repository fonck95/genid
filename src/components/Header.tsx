import React from 'react';
import '../styles/Header.css';

const Header: React.FC = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>FUERZA CIUDADANA</h1>
        </div>
        <nav className="nav">
          <button onClick={() => scrollToSection('inicio')} className="nav-link">Inicio</button>
          <button onClick={() => scrollToSection('publicaciones')} className="nav-link">Publicaciones</button>
          <button onClick={() => scrollToSection('biografia')} className="nav-link">Biografía</button>
          <button onClick={() => scrollToSection('propuestas')} className="nav-link">Propuestas</button>
          <button onClick={() => scrollToSection('redes-sociales')} className="nav-link">Redes</button>
          <button onClick={() => scrollToSection('contacto')} className="nav-link">Contacto</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
