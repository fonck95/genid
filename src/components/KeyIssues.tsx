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
      title: 'Ley 2458 de 2025 - Comunidad Lactante',
      description: 'Ley sobre protección y apoyo a la comunidad lactante, garantizando derechos de lactancia materna.',
      icon: '👶'
    },
    {
      title: 'Ley 2428 de 2024 - COP16',
      description: 'Exenciones de IVA para la COP16, facilitando la participación de Colombia en la cumbre de biodiversidad.',
      icon: '🌿'
    },
    {
      title: 'Universidad Nacional del Catatumbo',
      description: 'Proyecto de ley para la creación de la Universidad Nacional del Catatumbo, llevando educación superior a la región (en trámite).',
      icon: '🎓'
    },
    {
      title: 'Producción Tradicional de Panela',
      description: 'Protección y fomento de la producción tradicional de panela, defendiendo a los productores campesinos (en trámite a Senado).',
      icon: '🍯'
    },
    {
      title: 'Fortalecimiento de Veedurías Ciudadanas',
      description: 'Proyecto para fortalecer las veedurías ciudadanas y el control social sobre la gestión pública (en trámite).',
      icon: '👁️'
    },
    {
      title: 'Reconocimiento ATCC',
      description: 'Reconocimiento de la Asociación de Trabajadores Campesinos del Carare (ATCC) como promotora de paz en Colombia.',
      icon: '🕊️'
    }
  ];

  const temasClave = [
    {
      title: 'Protección del Páramo de Santurbán',
      description: 'Defensa férrea contra las concesiones mineras que amenazan este ecosistema vital para el suministro de agua de la región.',
      icon: '🏔️'
    },
    {
      title: 'Oposición al Fracking',
      description: 'Rechazo total a la fracturación hidráulica, protegiendo nuestros recursos hídricos y el medio ambiente.',
      icon: '💧'
    },
    {
      title: 'Defensa de FERTICOL',
      description: 'Protección de la empresa pública Fertilizantes Colombianos como patrimonio estratégico para los agricultores.',
      icon: '🌾'
    },
    {
      title: 'Seguridad Alimentaria',
      description: 'Impulso a políticas de sostenibilidad y seguridad alimentaria para las comunidades campesinas.',
      icon: '🚜'
    }
  ];

  return (
    <section id="propuestas" className="key-issues">
      <div className="key-issues-container">
        <h2 className="section-title">Iniciativas Legislativas</h2>
        <p className="section-subtitle">
          Autoría y coautoría en más de 50 proyectos de ley abordando temas como derechos campesinos,
          lactancia materna, derecho a la alimentación, patrimonio cultural, educación, fortalecimiento
          de veedurías ciudadanas y protección de medios comunitarios.
        </p>
        <h3 className="subsection-title">Proyectos Destacados</h3>
        <div className="issues-grid">
          {issues.map((issue, index) => (
            <div key={index} className="issue-card">
              <div className="issue-icon">{issue.icon}</div>
              <h3 className="issue-title">{issue.title}</h3>
              <p className="issue-description">{issue.description}</p>
            </div>
          ))}
        </div>

        <div className="ponencias-section">
          <h3 className="subsection-title">Ponencias Destacadas</h3>
          <p className="ponencias-text">
            Ponente en proyectos clave como el <strong>Presupuesto General de Regalías 2025-2026</strong> (Ley 2441 de 2024),
            la <strong>Universidad Nacional del Catatumbo</strong> y reformas fiscales importantes para el país.
          </p>
          <p className="ponencias-text recognition">
            <strong>Reconocimiento a Mejor Congresista 2024</strong>
          </p>
        </div>

        <h3 className="subsection-title">Temas Clave de Trabajo</h3>
        <div className="issues-grid compact">
          {temasClave.map((tema, index) => (
            <div key={index} className="issue-card compact">
              <div className="issue-icon">{tema.icon}</div>
              <h3 className="issue-title">{tema.title}</h3>
              <p className="issue-description">{tema.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyIssues;
