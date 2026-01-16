import React from 'react';
import '../styles/About.css';

const About: React.FC = () => {
  return (
    <section id="biografia" className="about">
      <div className="about-container">
        <h2 className="section-title">Presentación</h2>
        <div className="about-content">
          {/* Photo Gallery */}
          <div className="about-gallery">
            <div className="gallery-main">
              <img src="/jairo1.png" alt="Jairo Cala en campaña" className="gallery-image main" />
            </div>
            <div className="gallery-secondary">
              <img src="/jairo2.png" alt="Jairo Cala con la comunidad" className="gallery-image" />
              <img src="/jairo3.png" alt="Jairo Cala en evento" className="gallery-image" />
              <img src="/caricatura.png" alt="Caricatura de Jairo Cala" className="gallery-image caricatura" />
            </div>
          </div>

          {/* Biography Text */}
          <div className="about-text">
            <p className="about-intro">
              Nacido en Palmar, Santander, en 1964, Jairo Reinaldo Cala Suárez ha dedicado su vida
              al trabajo con las comunidades rurales y a la construcción de paz en Colombia. Su origen
              campesino marcó desde temprano su compromiso con las causas sociales y la defensa de los
              derechos colectivos.
            </p>
            <p className="about-intro">
              Participó en el proceso de paz de La Habana como integrante de las comisiones de sustitución
              de cultivos de uso ilícito y de prisioneros políticos. Tras la firma del Acuerdo de Paz, en 2018
              asumió una curul en la Cámara de Representantes por Santander, donde ha consolidado su labor
              legislativa en temas de desarrollo rural, economía solidaria y control al gasto público.
            </p>
            <div className="about-details">
              <h3>Trabajo en el Congreso</h3>
              <p>
                En el Congreso se ha destacado por la defensa de la empresa pública Fertilizantes Colombianos
                (FERTICOL), la protección del páramo de Santurbán, la oposición al fracking y la promoción de
                audiencias públicas con comunidades y medios alternativos, independientes y comunitarios. Ha
                visibilizado las crisis del sector salud y del campesinado, impulsando políticas de sostenibilidad
                y seguridad alimentaria.
              </p>
              <p>
                Actualmente, desde la Comisión Cuarta de la Cámara, promueve un enfoque de seguridad humana y
                territorial, entendido como acceso a derechos, justicia social y oportunidades reales en los
                territorios.
              </p>

              <h3>Trayectoria Política y Social</h3>
              <ul>
                <li>Trabajador rural y líder social</li>
                <li>Participó en la Mesa de Diálogo de La Habana</li>
                <li>Comisión de sustitución de cultivos de uso ilícito</li>
                <li>Comisión de prisioneros políticos</li>
                <li>Miembro de la Dirección Nacional del Partido Comunes</li>
                <li>Comisión Cuarta de Cámara de Representantes</li>
                <li>Comisión Legal de Paz y Postconflicto</li>
                <li>Comisión Accidental Catatumbo</li>
                <li>Comisiones accidentales: Seguimiento a medios alternativos, obras por regalías, política minera, agua y biodiversidad, sector solidario</li>
              </ul>

              <h3>Compromiso Personal</h3>
              <p>
                Padre de cinco hijos y estudiante de último semestre de Administración Pública, reivindica su
                historia personal como testimonio de reconciliación y transformación. Hoy, Jairo Cala Suárez
                continúa comprometido con una visión de país donde la paz y la seguridad se construyen con
                inclusión, desarrollo rural y dignidad para las comunidades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
