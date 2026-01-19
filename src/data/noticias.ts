export interface Noticia {
  id: number;
  titulo: string;
  subtitulo: string;
  contenido: string;
  imagen: string;
  categoria: string;
  fecha: string;
  destacada?: boolean;
}

export const noticias: Noticia[] = [
  {
    id: 1,
    titulo: "Crisis de gobernabilidad electoral marcó a Girón",
    subtitulo: "Elecciones atípicas tras anulación del mandato por doble militancia política",
    contenido: `El 18 de enero de 2026, los habitantes de Girón acudieron a las urnas en unas elecciones atípicas convocadas tras la anulación del mandato de Campo Elías Ramírez por el Consejo de Estado. La causal: doble militancia política, al haber obtenido el aval de la Liga de Gobernantes Anticorrupción mientras apoyaba públicamente candidatos al Concejo por el partido MAIS.

Un total de 131.355 ciudadanos habilitados pudieron ejercer su derecho al voto en 357 mesas electorales distribuidas en 39 puestos de votación. Seis candidatos disputaron la alcaldía, entre ellos Óscar Enrique Álvarez Ascanio, propietario del Atlético Bucaramanga, quien se presentó con el aval del Nuevo Liberalismo.

La Procuraduría General de la Nación desplegó 37 funcionarios en labores de vigilancia preventiva, una medida que evidencia la tensión institucional generada por el proceso. El evento constituyó la primera prueba electoral del año en Colombia y funcionó como indicador de las correlaciones de fuerzas políticas santandereanas de cara a las elecciones legislativas de marzo de 2026.`,
    imagen: "/optimized/eleccions.webp",
    categoria: "Política",
    fecha: "18 de enero de 2026",
    destacada: true
  },
  {
    id: 2,
    titulo: "Contratos de megacolegios en Girón generan denuncias por $192.000 millones",
    subtitulo: "Sindicato de Educadores denuncia presuntas irregularidades en adjudicación",
    contenido: `El Sindicato de Educadores de Santander formalizó denuncias ante la Contraloría General, la Fiscalía General de la Nación y la Procuraduría por presuntas irregularidades en la adjudicación de tres contratos que entregan por 12 años la operación de los megacolegios Mario Morales Delgado, Gabriel García Márquez y Nuestra Señora de Belén a la Corporación Crecer Educados, entidad privada con sede en Cúcuta. El monto total de los contratos supera los 192.000 millones de pesos.

Las irregularidades señaladas incluyen que la corporación adjudicataria obtuvo su reconocimiento jurídico apenas en octubre de 2023, incumpliendo presuntamente el requisito de 10 años de experiencia establecido en los términos de referencia. Adicionalmente, las comunidades educativas no habrían sido consultadas previamente sobre la modalidad de operación.

Heriberto Delgado, presidente del SES, interpuso además una acción popular con solicitud de medida cautelar para suspender la ejecución de los contratos. El caso configura un escenario de presunta privatización de la educación pública mediante mecanismos contractuales que beneficiarían a operadores sin trayectoria comprobada en el sector.`,
    imagen: "/optimized/megacolegio.webp",
    categoria: "Educación",
    fecha: "17 de enero de 2026",
    destacada: true
  },
  {
    id: 3,
    titulo: "César Loza se convierte en el primer obrero en la junta directiva de Ecopetrol en 74 años",
    subtitulo: "Presidente de la USO fue elegido representante de los trabajadores",
    contenido: `En un hecho sin precedentes para el sindicalismo colombiano, César Eduardo Loza, presidente de la Unión Sindical Obrera (USO), fue elegido representante de los trabajadores en la Junta Directiva de Ecopetrol. Loza obtuvo 1.724 votos, equivalentes al 28.6% de la participación, superando a 15 candidatos en una votación que contó con más de 6.000 sindicalizados habilitados.

La jornada electoral cerró a las 4:30 de la tarde del 15 de enero y los resultados oficiales se conocieron cerca de la medianoche del día 16. Loza deberá renunciar a la presidencia de la USO para asumir su nuevo cargo en marzo de 2026, siendo reemplazado por Martín Fernando Ravelo, operador de la refinería de Barrancabermeja.

El proceso, sin embargo, estuvo acompañado de controversia. Asopetrol y otras organizaciones sindicales denunciaron que la fecha electoral fue adelantada del 22-23 de enero al 14-15 de enero sin notificación adecuada. El Juzgado Séptimo de Familia de Bogotá admitió una tutela contra el proceso, aunque no concedió medida cautelar. Ricardo Roa, presidente de Ecopetrol, defendió la transparencia de la elección y se abstuvo de votar argumentando imparcialidad institucional.`,
    imagen: "/optimized/uso.webp",
    categoria: "Economía",
    fecha: "16 de enero de 2026",
    destacada: true
  },
  {
    id: 4,
    titulo: "Clan Aguilar busca reposicionamiento en el liberalismo hacia 2026",
    subtitulo: "Richard Aguilar aspira al Senado con el aval del Partido Liberal",
    contenido: `Los hermanos Aguilar, figuras históricas del poder político santandereano, buscan recuperar su presencia en el Congreso tras haber transitado por múltiples organizaciones partidistas incluyendo Convergencia Ciudadana, el Partido de la U, Cambio Radical y el Partido Conservador.

Richard Aguilar, quien fue capturado en 2021 por presunto peculado y concierto para delinquir y posteriormente liberado en 2022 por vencimiento de términos procesales, aspira ahora al Senado de la República con el aval del Partido Liberal. Su hermano Mauricio Aguilar, exgobernador del departamento durante el período 2020-2023, realiza campaña en favor del senador Jaime Durán Barrera, configurando una división al interior del núcleo familiar.

Hugo Aguilar Naranjo, patriarca de la familia y coronel retirado del Ejército Nacional, fue condenado por parapolítica y permanece bajo investigación por presunto enriquecimiento ilícito. El movimiento representa un reacomodo de las fuerzas políticas tradicionales santandereanas frente al gobernador Juvenal Díaz Mateus, quien derrotó electoralmente al clan en 2023 y actualmente busca consolidar su propia estructura de poder con representación en el Congreso.`,
    imagen: "/optimized/aguilar.webp",
    categoria: "Política",
    fecha: "17 de enero de 2026"
  },
  {
    id: 5,
    titulo: "Sismo de magnitud 5.0 se sintió en el centro del país",
    subtitulo: "Epicentro localizado entre Los Santos y Piedecuesta con 149 km de profundidad",
    contenido: `A las 2:05 de la madrugada del 16 de enero de 2026, un movimiento telúrico de magnitud 5.0 en la escala de Richter sacudió el departamento de Santander. El epicentro fue localizado en la zona limítrofe entre los municipios de Los Santos y Piedecuesta, con una profundidad registrada de 149 kilómetros.

El sismo se percibió ampliamente en Bogotá, Medellín, Manizales, Tunja y departamentos circunvecinos. El área metropolitana de Bucaramanga acumuló 117 reportes ciudadanos ante las autoridades de gestión del riesgo. Las entidades competentes confirmaron que no se registraron víctimas ni daños materiales como consecuencia del evento sísmico.`,
    imagen: "/optimized/sismo.webp",
    categoria: "Región",
    fecha: "16 de enero de 2026"
  },
  {
    id: 6,
    titulo: "Bucaramanga invertirá $15.000 millones en sistema de seguridad con inteligencia artificial",
    subtitulo: "Cámaras con reconocimiento facial y lectores de placas en zonas prioritarias",
    contenido: `La Alcaldía de Bucaramanga, bajo la administración de Cristian Portilla, anunció la implementación de un plan tecnológico de seguridad urbana que contempla la instalación de cámaras equipadas con inteligencia artificial, sistemas de reconocimiento facial y lectores automáticos de placas vehiculares. La inversión proyectada asciende a 15.000 millones de pesos.

El objetivo declarado es elevar la tasa de esclarecimiento de delitos del rango actual de 27-30% hasta un 55%. Para ello se creará un nuevo Centro Integrado de Monitoreo que articulará a la Sijín, el Ejército Nacional, el Cuerpo de Bomberos, la Alcaldía y la Fiscalía General de la Nación. Las zonas prioritarias de intervención serán el Centro histórico, el sector de Cabecera y las plazas de mercado, con un cronograma de implementación de cinco meses.

Paralelamente, el programa "Transforma tu Negocio", una iniciativa conjunta de la Cámara de Comercio de Bucaramanga y la Gobernación de Santander, reportó 56 negocios transformados durante su último año de operación, fortaleciendo el ecosistema emprendedor local.`,
    imagen: "/optimized/IA.webp",
    categoria: "Tecnología",
    fecha: "17 de enero de 2026"
  },
  {
    id: 7,
    titulo: "Santurbán: ausencia mediática en un contexto de conflicto latente",
    subtitulo: "Niveles de mercurio en el río Suratá superan 40 veces los límites internacionales",
    contenido: `Durante el período comprendido entre el 15 y el 18 de enero de 2026, no se registraron noticias específicas sobre el páramo de Santurbán, proyectos de fracking ni conflictos minero-ambientales en los medios de comunicación consultados. No obstante, el contexto estructural del conflicto permanece activo.

Aris Mining, empresa operadora del proyecto Soto Norte, tenía previsto presentar su solicitud de licencia ambiental ante la Autoridad Nacional de Licencias Ambientales (ANLA) a inicios de 2026. El Tribunal Administrativo de Santander mantiene abierto un incidente de desacato contra el Ministerio de Ambiente y Desarrollo Sostenible por el proceso de delimitación del páramo. Estudios técnicos han documentado que los niveles de mercurio en el río Suratá superan hasta 40 veces los límites establecidos por estándares internacionales como consecuencia de la minería ilegal.

El Comité para la Defensa del Agua y del Páramo de Santurbán mantiene actividades de monitoreo y vigilancia ciudadana. La ausencia de cobertura mediática durante el período analizado no debe interpretarse como resolución del conflicto socioambiental; cualquier movimiento regulatorio podría reactivar la movilización ciudadana que históricamente ha congregado más de 100.000 participantes.`,
    imagen: "/optimized/paramo.webp",
    categoria: "Ambiente",
    fecha: "18 de enero de 2026"
  },
  {
    id: 8,
    titulo: "Cuatro homicidios sacudieron a Santander en una sola noche",
    subtitulo: "Jornada violenta entre el 17 y 18 de enero dejó múltiples víctimas",
    contenido: `La jornada comprendida entre el 17 y el 18 de enero de 2026 registró un saldo de cuatro homicidios en diferentes puntos del departamento, configurando una de las noches más violentas del inicio del año.

En el centro de Bucaramanga, un hombre identificado como Jefferson Alexander Carrillo Estévez fue asesinado mediante arma blanca tras una disputa de carácter personal. El caso quedó bajo investigación de la Unidad de Homicidio de la Sijín de la Policía Metropolitana.

En Barrancabermeja, la Gobernación de Santander duplicó a 30 millones de pesos la recompensa por información que conduzca a la captura de los responsables del asesinato del patrullero Hammer Guisseppe Martínez Sarmiento, uniformado de 29 años adscrito a la unidad antinarcóticos que fue baleado el 10 de enero en el barrio San Judas de la Comuna 3 durante un intento de hurto. El policía, quien se encontraba en período de permiso, recibió cuatro impactos de arma de fuego por parte de sicarios que se movilizaban en motocicleta.

En el ámbito judicial, se conoció la sentencia condenatoria de 31 años y 2 meses de prisión contra José Miguel Barrios Galán por el feminicidio agravado ocurrido en octubre de 2025 en el barrio Kennedy de Bucaramanga.`,
    imagen: "/optimized/4enunanoche.webp",
    categoria: "Judicial",
    fecha: "18 de enero de 2026",
    destacada: true
  },
  {
    id: 9,
    titulo: "Emergencia ambiental: 15 manatíes muertos en la Ciénaga El Llanito",
    subtitulo: "Contaminación por hidrocarburos afecta especie en vía de extinción",
    contenido: `Una de las noticias ambientales de mayor gravedad del fin de semana fue la detección de contaminación por hidrocarburos en la Ciénaga El Llanito, ubicada en el corregimiento homónimo de Barrancabermeja. Pescadores de la zona alertaron sobre la presencia de residuos petroleros y la muerte de al menos 15 manatíes antillanos (Trichechus manatus), especie catalogada en vía de extinción.

Leonardo Granados, secretario de Ambiente de Barrancabermeja, confirmó que se impuso una medida preventiva a Ecopetrol tras una visita técnica realizada al sector Rincón del Peñate. La Corporación Autónoma Regional de Santander (CAS) y la Policía Ambiental constataron in situ la presencia de hidrocarburos en el cuerpo de agua. La situación se ve agravada por la temporada de sequía que ha reducido significativamente los niveles hídricos del humedal.

Se convocó una mesa técnica interinstitucional para el 20 de enero de 2026 con participación de la ANLA, la CAS, ISAGEN, Ecopetrol y la Procuraduría Delegada para Asuntos Ambientales con el objetivo de establecer responsabilidades y definir acciones de remediación.`,
    imagen: "/optimized/manati.webp",
    categoria: "Ambiente",
    fecha: "18 de enero de 2026",
    destacada: true
  },
  {
    id: 10,
    titulo: "Laboratorio internacional de danza valida producción cultural santandereana",
    subtitulo: "Más de 40 artistas de 5 países participaron en 'Lo Poroso'",
    contenido: `El laboratorio de danza contemporánea "Lo Poroso" reunió a más de 40 artistas nacionales e internacionales en Bucaramanga, incluyendo creadores provenientes de Reino Unido, Estados Unidos, Suecia, Finlandia y Suiza, quienes trabajaron junto al colectivo bumangués La Sastrería.

La directora del laboratorio, Alejandra Gissler, destacó la relevancia del conocimiento generado en el espacio de intercambio artístico. La muestra final de los trabajos desarrollados durante el laboratorio se presentó en el Teatro Santander el 16 de enero de 2026. Posteriormente, los artistas participantes se trasladaron al municipio de Zapatoca para desarrollar talleres con población infantil.

De manera simultánea, intervenciones de arte urbano en instituciones educativas de Bucaramanga generaron espacios de conversación sobre identidad regional y expresión cultural.`,
    imagen: "/optimized/profile.webp",
    categoria: "Cultura",
    fecha: "16 de enero de 2026"
  },
  {
    id: 11,
    titulo: "Victoria del Atlético Bucaramanga ante Millonarios en Liga BetPlay",
    subtitulo: "Luciano Pons anotó el gol de la victoria para el equipo bumangués",
    contenido: `El equipo bumangués derrotó a Millonarios Fútbol Club con anotación de Luciano Pons en el marco de la Liga BetPlay I-2026, manteniendo las expectativas deportivas de la afición regional.

Otras noticias de impacto regional incluyen la tragedia en la plaza de mercado del centro de Bucaramanga, donde un adulto mayor falleció el 15 de enero tras caer por las escaleras. Las circunstancias del hecho permanecen bajo investigación.

También se informó sobre la identificación del cuerpo de Ángel Luciano Morales, ciudadano argentino de 30 años conocido como "El Argentino", hallado en el río de Oro en jurisdicción de Piedecuesta el 11 de enero e identificado formalmente el día 16. La Fiscalía General de la Nación adelanta investigaciones para determinar las causas del deceso.

En cuanto al calendario escolar, más de 300.000 estudiantes santandereanos retornaron a las instituciones educativas públicas a partir del 20 de enero. La Universidad Industrial de Santander reinició actividades institucionales el 15 de enero sin que se reportaran manifestaciones estudiantiles.`,
    imagen: "/optimized/banner.webp",
    categoria: "Deportes",
    fecha: "18 de enero de 2026"
  }
];

export const categorias = [
  "Todas",
  "Política",
  "Educación",
  "Economía",
  "Región",
  "Tecnología",
  "Ambiente",
  "Judicial",
  "Cultura",
  "Deportes"
];
