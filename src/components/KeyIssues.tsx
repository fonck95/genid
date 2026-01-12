import React from 'react';
import '../styles/KeyIssues.css';

interface Issue {
  title: string;
  description: string;
  icon: string;
}

const KeyIssues: React.FC = () => {
  const issues: Issue[] = [
    {
      title: 'Protección del Páramo de Santurbán',
      description: 'Defensa férrea contra las concesiones mineras que amenazan este ecosistema vital para el suministro de agua de la región.',
      icon: '🏔️'
    },
    {
      title: 'Oposición al Fracking',
      description: 'Rechazo total a la fracturación hidráulica, protegiendo nuestros recursos hídricos y el medio ambiente para las futuras generaciones.',
      icon: '💧'
    },
    {
      title: 'Implementación de la Paz',
      description: 'Trabajo constante por la consolidación e implementación efectiva de los Acuerdos de Paz en todo el territorio santandereano.',
      icon: '🕊️'
    },
    {
      title: 'Defensa de FERTICOL',
      description: 'Protección de la empresa pública de fertilizantes como patrimonio estratégico para los agricultores colombianos.',
      icon: '🌾'
    },
    {
      title: 'Desarrollo Rural',
      description: 'Impulso a políticas que fortalezcan el campo santandereano y mejoren la calidad de vida de nuestros campesinos.',
      icon: '🚜'
    },
    {
      title: 'Justicia Social',
      description: 'Promoción de políticas públicas inclusivas que reduzcan las brechas de desigualdad en Santander.',
      icon: '⚖️'
    }
  ];

  return (
    <section id="propuestas" className="key-issues">
      <div className="key-issues-container">
        <h2 className="section-title">Temas Clave</h2>
        <p className="section-subtitle">
          Compromisos firmes con Santander y su gente
        </p>
        <div className="issues-grid">
          {issues.map((issue, index) => (
            <div key={index} className="issue-card">
              <div className="issue-icon">{issue.icon}</div>
              <h3 className="issue-title">{issue.title}</h3>
              <p className="issue-description">{issue.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyIssues;
