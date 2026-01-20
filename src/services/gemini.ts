import type { GeminiResponse, IdentityPhoto, AttachedImage } from '../types';
import { downscaleImage, defaultOptimizationConfig, type ImageOptimizationConfig } from './imageOptimizer';

// API Key desde variable de entorno
const GEMINI_API_KEY = import.meta.env.VITE_APP_API_KEY_GOOGLE;

// Configuración de optimización de imágenes (se puede modificar desde UI)
let optimizationConfig: ImageOptimizationConfig = { ...defaultOptimizationConfig };

// Modelo de texto para análisis de rostro (Flash es más rápido y económico para esta tarea)
// Usando el modelo estable sin sufijo preview para evitar errores 404
const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';

// System prompt para análisis antropométrico de rostros
const FACE_ANALYSIS_SYSTEM_PROMPT = `[ROL]
Actúa como un experto senior en antropometría forense, morfopsicología y especialista en ingeniería de prompts para modelos de difusión (Stable Diffusion, Midjourney, Flux). Tu objetivo es realizar un análisis anatómico exhaustivo de cualquier rostro proporcionado en una imagen para garantizar una reconstrucción 1:1 o mantener la consistencia absoluta en tareas de inpainting y edición.

[TAREA]
Cuando recibas una imagen de un rostro, deberás generar automáticamente un informe técnico dividido en las siguientes secciones obligatorias:

1. Morfología Estructural:
- Forma del cráneo y rostro (ej. braquicefálico, mesoprosopo).
- Línea de la mandíbula (ángulos mandibulares) y proyección del mentón.
- Relación de los tercios faciales (superior, medio e inferior).

2. Anatomía Detallada (Anclajes de Identidad):
- Región Orbital: Forma de los ojos, tipo de párpado (especificar si hay epicanto o es encapotado), distancia interocular, y morfología de las cejas (densidad, arco y posición).
- Región Nasal: Perfil del dorso, ancho de las alas, ángulo nasolabial y forma de la punta.
- Región Labial: Grosor de los bermellones, definición del arco de Cupido, ancho de la boca y profundidad del surco nasogeniano.
- Vello Facial: Patrón exacto de crecimiento, densidad y límites anatómicos.

3. Micro-textura y Tono:
- Fitotipo de Fitzpatrick (tono de piel).
- Detalles de porosidad, manchas, lunares o marcas de consistencia.

4. Prompt Maestro de Consistencia (en Inglés):
Redacta un prompt optimizado para IA (como Nano Banana, SDXL o Midjourney) que resuma todo lo anterior. Usa terminología técnica de fotografía (f-stop, lens, lighting) y descriptores anatómicos precisos.

[RESTRICCIONES]
- Evita adjetivos vagos como "guapo", "normal" o "atractivo".
- Usa términos técnicos (ej. "nasolabial fold", "zygomatic arches", "canthus", "philtrum").
- El prompt final debe estar siempre en inglés para evitar errores de interpretación de la IA generativa.
- Genera SOLO el análisis técnico, sin saludos ni explicaciones adicionales.`;

// System prompt para integración realista de personas en escenarios
// Este prompt asegura que la persona se vea naturalmente integrada en el fondo/ambiente
const SCENE_INTEGRATION_REALISM_PROMPT = `
[DIRECTIVAS DE INTEGRACIÓN FOTORREALISTA EN ESCENA]

Tu objetivo principal es generar imágenes donde la persona aparezca NATURALMENTE INTEGRADA en el escenario, como si realmente hubiera estado físicamente presente en ese lugar durante la captura fotográfica.

═══════════════════════════════════════════════════════════════
1. COHERENCIA DE ILUMINACIÓN (CRÍTICO)
═══════════════════════════════════════════════════════════════
- La fuente de luz principal debe iluminar a la persona desde el MISMO ángulo y con la MISMA intensidad que el entorno
- Las sombras en el rostro y cuerpo deben ser consistentes con las sombras del ambiente
- Si el escenario tiene luz natural (sol, cielo nublado), aplica los mismos tonos de color (warmth/coolness) a la piel
- En interiores, respeta las fuentes de luz artificiales visibles (lámparas, ventanas, neones)
- Los highlights especulares en la piel/cabello deben reflejar las fuentes de luz del escenario
- Evita iluminación "de estudio" cuando el escenario es exterior natural

═══════════════════════════════════════════════════════════════
2. PERSPECTIVA Y PUNTO DE VISTA
═══════════════════════════════════════════════════════════════
- La persona debe estar dibujada desde el MISMO ángulo de cámara que el fondo
- Si el fondo tiene perspectiva de ojo de pez, contrapicado o picado, el sujeto debe reflejar esa misma distorsión
- La línea del horizonte debe atravesar a la persona a la altura correcta según su posición en el plano
- Respeta las líneas de fuga del escenario: la persona no debe "flotar" ni estar fuera de la grilla perspectiva

═══════════════════════════════════════════════════════════════
3. PROFUNDIDAD DE CAMPO Y ENFOQUE
═══════════════════════════════════════════════════════════════
- Si el fondo tiene bokeh (desenfoque), la persona debe tener el enfoque apropiado según su distancia a la cámara
- Si el fondo está enfocado (paisaje con f/11+), la persona también debe estar nítida
- Aplica desenfoque de movimiento si el escenario sugiere dinamismo
- Los bordes de la persona deben fundirse naturalmente con el ambiente, sin "recortes" duros

═══════════════════════════════════════════════════════════════
4. COLOR GRADING Y ARMONÍA CROMÁTICA
═══════════════════════════════════════════════════════════════
- La piel de la persona debe adoptar los tonos ambientales del escenario (luz dorada al atardecer, azulada en sombra, etc.)
- Aplica la misma curva de contraste y saturación del fondo al sujeto
- Si el escenario tiene un color cast (tinte de color), la persona debe tenerlo también
- Los colores de la ropa deben verse afectados por la luz ambiente igual que cualquier objeto del escenario

═══════════════════════════════════════════════════════════════
5. SOMBRAS PROYECTADAS Y CONTACTO CON EL SUELO
═══════════════════════════════════════════════════════════════
- La persona DEBE proyectar sombra sobre el suelo/superficies según las fuentes de luz del escenario
- La sombra debe tener la dureza/suavidad correcta (sol directo = sombra dura, día nublado = sombra difusa)
- El ángulo de la sombra debe ser coherente con la posición de la fuente de luz
- Si la persona está sentada o apoyada, su cuerpo debe "interactuar" visualmente con las superficies

═══════════════════════════════════════════════════════════════
6. ESCALA Y PROPORCIONES ESPACIALES
═══════════════════════════════════════════════════════════════
- El tamaño de la persona debe ser correcto en relación con los objetos del escenario
- Usa referencias de escala del ambiente (puertas, coches, muebles, árboles) para determinar el tamaño
- Si hay otras personas en el escenario, respeta la proporción relativa
- La distancia aparente debe ser consistente con la profundidad del plano

═══════════════════════════════════════════════════════════════
7. INTERACCIÓN AMBIENTAL
═══════════════════════════════════════════════════════════════
- Si hay viento, el cabello y ropa de la persona deben moverse en la dirección correcta
- En lluvia, la persona debe mostrar gotas/humedad apropiada
- En escenas con polvo/niebla/humo, debe haber participación atmosférica parcial sobre la persona
- Si la persona está cerca de superficies reflectantes (agua, espejos, cristales), genera reflejos coherentes

═══════════════════════════════════════════════════════════════
8. MICRODETALLES DE REALISMO
═══════════════════════════════════════════════════════════════
- Añade ruido/grano de imagen consistente entre persona y fondo
- La textura de la piel debe tener el mismo nivel de detalle/suavizado que el resto de la imagen
- Evita que la persona se vea "demasiado perfecta" o renderizada si el fondo es fotográfico
- Si el escenario tiene aberraciones cromáticas o viñeteado, aplícalas también a la persona

═══════════════════════════════════════════════════════════════
VERIFICACIÓN FINAL DE INTEGRACIÓN
═══════════════════════════════════════════════════════════════
Antes de generar, verifica mentalmente:
✓ ¿La luz viene de la misma dirección para persona y escenario?
✓ ¿Las sombras son consistentes?
✓ ¿La perspectiva es correcta?
✓ ¿La persona proyecta sombra sobre el suelo?
✓ ¿Los colores de la piel reflejan la luz ambiente?
✓ ¿El enfoque/desenfoque es coherente?
✓ ¿La escala es realista comparada con objetos del entorno?
✓ ¿Hay interacción con elementos ambientales (viento, lluvia, reflejos)?

El objetivo es que un observador NO pueda distinguir si la persona estuvo realmente en ese lugar o si fue generada por IA.
`;

// Tipos para las partes del contenido de Gemini
type TextPart = { text: string };
type InlineDataPart = { inlineData: { mimeType: string; data: string } };
type FileDataPart = { fileData: { mimeType: string; fileUri: string } };
type ContentPart = TextPart | InlineDataPart | FileDataPart;

/**
 * Actualiza la configuración de optimización de imágenes
 */
export function setOptimizationConfig(config: Partial<ImageOptimizationConfig>): void {
  optimizationConfig = { ...optimizationConfig, ...config };
}

/**
 * Obtiene la configuración actual de optimización
 */
export function getOptimizationConfig(): ImageOptimizationConfig {
  return { ...optimizationConfig };
}

// Helper para crear la parte de imagen según si es URL o base64
function createImagePart(dataUrl: string, mimeType: string = 'image/jpeg'): InlineDataPart | FileDataPart {
  // Si es una URL (http/https), usar fileData
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return {
      fileData: {
        mimeType,
        fileUri: dataUrl
      }
    };
  }
  // Si es base64 data URL, extraer los datos y usar inlineData
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return {
    inlineData: {
      mimeType,
      data: base64Data
    }
  };
}

/**
 * Comprime una imagen antes de enviarla a la API para ahorrar tokens
 */
async function optimizeImageForAPI(dataUrl: string): Promise<string> {
  // Si es una URL externa, no podemos optimizarla localmente
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  return await downscaleImage(
    dataUrl,
    optimizationConfig.maxInputDimension,
    optimizationConfig.compressionQuality
  );
}

/**
 * Optimiza múltiples imágenes en paralelo
 */
async function optimizeImagesForAPI(images: string[]): Promise<string[]> {
  return Promise.all(images.map(img => optimizeImageForAPI(img)));
}

// Modelos de imagen de Gemini (Nano Banana)
// - gemini-2.5-flash-image: Rápido, hasta 1K, ideal para generación simple
// - gemini-3-pro-image-preview: Alta calidad, hasta 4K, razonamiento avanzado, mejor para edición con identidad
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GEMINI_IMAGE_PRO_MODEL = 'gemini-3-pro-image-preview';

const getApiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export async function generateImageWithIdentity(
  prompt: string,
  referencePhotos: IdentityPhoto[],
  identityName: string,
  identityDescription?: string
): Promise<string> {
  const parts: ContentPart[] = [];

  // Construir la descripción de la identidad si existe
  const descriptionContext = identityDescription
    ? `\n\nDESCRIPCIÓN GENERAL DE LA PERSONA:\n${identityDescription}`
    : '';

  // Extraer descripciones faciales antropométricas de las fotos
  const faceDescriptions = referencePhotos
    .filter(photo => photo.faceDescription)
    .map((photo, index) => `[Análisis Foto ${index + 1}]\n${photo.faceDescription}`)
    .join('\n\n');

  const faceDescriptionContext = faceDescriptions
    ? `\n\nANÁLISIS ANTROPOMÉTRICO FACIAL (usar para consistencia absoluta):\n${faceDescriptions}`
    : '';

  // Añadir instrucciones del sistema con realismo e integración
  parts.push({
    text: `Eres un generador de imágenes profesional especializado en mantener consistencia facial y crear composiciones FOTORREALISTAS. Vas a generar una imagen basada en la identidad de "${identityName}".${descriptionContext}${faceDescriptionContext}

INSTRUCCIONES CRÍTICAS DE CONSISTENCIA FACIAL:
- Mantén EXACTAMENTE la identidad facial y características físicas descritas en el análisis antropométrico
- La persona debe ser claramente reconocible como la misma de las fotos de referencia
- Presta especial atención a: morfología craneal, estructura mandibular, forma de ojos, nariz y labios
- Respeta el fototipo de Fitzpatrick y cualquier marca distintiva mencionada
${faceDescriptions ? '- IMPORTANTE: El análisis antropométrico es tu guía principal para la consistencia facial' : ''}

${SCENE_INTEGRATION_REALISM_PROMPT}

OBJETIVO FINAL:
Genera una imagen donde "${identityName}" aparezca NATURALMENTE INTEGRADO/A en el escenario, como si realmente hubiera estado físicamente presente durante la captura fotográfica. La imagen debe ser indistinguible de una fotografía real.

Fotos de referencia de "${identityName}" adjuntas a continuación:`
  });

  // Añadir fotos de referencia (máximo 5 para no sobrecargar)
  // Optimizar imágenes para reducir tokens
  const photosToUse = referencePhotos.slice(0, 5);
  const photoUrls = photosToUse.map(p => p.dataUrl);
  const optimizedPhotos = await optimizeImagesForAPI(photoUrls);

  for (const optimizedUrl of optimizedPhotos) {
    parts.push(createImagePart(optimizedUrl, 'image/jpeg'));
  }

  // Añadir el prompt del usuario con énfasis en integración realista
  parts.push({
    text: `

SITUACIÓN/ESCENARIO A GENERAR:
${prompt}

REQUISITOS DE GENERACIÓN:
1. Mantén la identidad visual exacta de "${identityName}" de las fotos de referencia${faceDescriptions ? ' siguiendo estrictamente el análisis antropométrico proporcionado' : ''}
2. Integra a la persona de forma FOTORREALISTA en el escenario:
   - Iluminación coherente entre persona y ambiente
   - Sombras proyectadas correctas sobre el suelo/superficies
   - Perspectiva y escala apropiadas
   - Color grading uniforme (la piel debe reflejar los tonos de luz ambiente)
   - Interacción natural con elementos del entorno (viento, reflejos, clima)
3. El resultado debe ser INDISTINGUIBLE de una fotografía real donde la persona estuvo presente.`
  });

  const requestBody = {
    contents: [{
      parts
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.9,
    }
  };

  // Usar modelo Pro para generación con identidad (mejor calidad y soporte para múltiples referencias)
  const response = await fetch(`${getApiUrl(GEMINI_IMAGE_PRO_MODEL)}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de API Gemini: ${response.status} - ${errorText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(`Error Gemini: ${data.error.message}`);
  }

  // Buscar la imagen en la respuesta
  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error('No se recibió respuesta válida de Gemini');
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('No se generó ninguna imagen en la respuesta');
}

export async function generateSimpleImage(prompt: string): Promise<string> {
  const requestBody = {
    contents: [{
      parts: [{
        text: `Genera una imagen de alta calidad: ${prompt}`
      }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.9,
    }
  };

  // Usar modelo estándar para generación simple (más rápido)
  const response = await fetch(`${getApiUrl(GEMINI_IMAGE_MODEL)}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de API Gemini: ${response.status} - ${errorText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(`Error Gemini: ${data.error.message}`);
  }

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error('No se recibió respuesta válida de Gemini');
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('No se generó ninguna imagen en la respuesta');
}

export async function generateWithAttachedImages(
  prompt: string,
  attachedImages: AttachedImage[],
  referencePhotos?: IdentityPhoto[],
  identityName?: string,
  identityDescription?: string
): Promise<string> {
  const parts: ContentPart[] = [];

  // Instrucciones del sistema según el contexto
  if (identityName && referencePhotos && referencePhotos.length > 0) {
    // Construir la descripción de la identidad si existe
    const descriptionContext = identityDescription
      ? `\n\nDESCRIPCIÓN GENERAL DE LA PERSONA "${identityName}":\n${identityDescription}`
      : '';

    // Extraer descripciones faciales antropométricas de las fotos
    const faceDescriptions = referencePhotos
      .filter(photo => photo.faceDescription)
      .map((photo, index) => `[Análisis Foto ${index + 1}]\n${photo.faceDescription}`)
      .join('\n\n');

    const faceDescriptionContext = faceDescriptions
      ? `\n\nANÁLISIS ANTROPOMÉTRICO FACIAL (usar para consistencia absoluta):\n${faceDescriptions}`
      : '';

    parts.push({
      text: `Eres un generador y editor de imágenes profesional especializado en consistencia facial y COMPOSICIONES FOTORREALISTAS. Vas a trabajar con las imágenes que el usuario ha adjuntado.

CONTEXTO:
- El usuario ha adjuntado ${attachedImages.length} imagen(es) para que las analices, edites o uses como referencia.
- También tienes fotos de referencia de "${identityName}" para mantener la identidad si es necesario.${descriptionContext}${faceDescriptionContext}

INSTRUCCIONES CRÍTICAS DE CONSISTENCIA FACIAL:
- Analiza las imágenes adjuntas por el usuario
- Si el usuario pide editar o modificar las imágenes, hazlo manteniendo EXACTAMENTE la identidad facial de "${identityName}"
${faceDescriptions ? '- IMPORTANTE: Sigue estrictamente el análisis antropométrico para la consistencia facial (morfología craneal, estructura mandibular, forma de ojos, nariz y labios)' : ''}
- Respeta el fototipo de Fitzpatrick y cualquier marca distintiva mencionada

${SCENE_INTEGRATION_REALISM_PROMPT}

OBJETIVO:
- Si el usuario pide generar algo nuevo basado en las imágenes, úsalas como inspiración
- Genera una imagen de alta calidad siguiendo las instrucciones del usuario
- La persona debe verse NATURALMENTE INTEGRADA en el escenario, como si realmente hubiera estado físicamente presente

Fotos de referencia de "${identityName}":`
    });

    // Añadir fotos de referencia de identidad (optimizadas)
    const photosToUse = referencePhotos.slice(0, 3);
    const refPhotoUrls = photosToUse.map(p => p.dataUrl);
    const optimizedRefPhotos = await optimizeImagesForAPI(refPhotoUrls);

    for (const optimizedUrl of optimizedRefPhotos) {
      parts.push(createImagePart(optimizedUrl, 'image/jpeg'));
    }

    parts.push({ text: '\nImágenes adjuntadas por el usuario:' });
  } else {
    parts.push({
      text: `Eres un generador y editor de imágenes profesional. El usuario ha adjuntado ${attachedImages.length} imagen(es).

INSTRUCCIONES:
- Analiza las imágenes adjuntas
- Si el usuario pide editar o modificar las imágenes, hazlo según sus instrucciones
- Si el usuario pide generar algo nuevo basado en las imágenes, úsalas como referencia/inspiración
- Genera una imagen de alta calidad siguiendo exactamente las instrucciones del usuario

Imágenes adjuntadas:`
    });
  }

  // Añadir las imágenes adjuntas por el usuario (optimizadas para reducir tokens)
  const attachedUrls = attachedImages.map(img => img.dataUrl);
  const optimizedAttached = await optimizeImagesForAPI(attachedUrls);

  for (let i = 0; i < attachedImages.length; i++) {
    parts.push(createImagePart(optimizedAttached[i], attachedImages[i].mimeType));
  }

  // Añadir el prompt del usuario con énfasis en integración realista
  parts.push({
    text: `

INSTRUCCIONES DEL USUARIO:
${prompt}

REQUISITOS DE INTEGRACIÓN FOTORREALISTA:
- Asegura coherencia de iluminación entre la persona y el escenario/fondo
- Genera sombras proyectadas correctas sobre superficies
- Aplica el mismo color grading y tonos de luz ambiente a la piel
- Mantén perspectiva, escala y profundidad de campo consistentes
- La persona debe interactuar naturalmente con el entorno (viento, reflejos, clima si aplica)

Genera una imagen donde la persona aparezca como si REALMENTE hubiera estado en ese lugar.`
  });

  const requestBody = {
    contents: [{
      parts
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.9,
    }
  };

  // Usar modelo Pro para edición de imágenes (mejor calidad y soporte para múltiples referencias)
  const response = await fetch(`${getApiUrl(GEMINI_IMAGE_PRO_MODEL)}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de API Gemini: ${response.status} - ${errorText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(`Error Gemini: ${data.error.message}`);
  }

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error('No se recibió respuesta válida de Gemini');
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('No se generó ninguna imagen en la respuesta');
}

/**
 * Analiza un rostro usando el modelo de visión de Gemini y genera
 * una descripción antropométrica detallada para mantener consistencia
 * en la generación de imágenes.
 */
export async function analyzeFaceForConsistency(imageUrl: string): Promise<string> {
  const parts: ContentPart[] = [];

  // Añadir el system prompt con las instrucciones de análisis
  parts.push({
    text: FACE_ANALYSIS_SYSTEM_PROMPT + '\n\nAnaliza el siguiente rostro:'
  });

  // Optimizar la imagen antes de enviar (reduce tokens)
  const optimizedImageUrl = await optimizeImageForAPI(imageUrl);

  // Añadir la imagen del rostro
  parts.push(createImagePart(optimizedImageUrl, 'image/jpeg'));

  // Solicitar el análisis
  parts.push({
    text: '\nGenera el análisis antropométrico completo del rostro en la imagen.'
  });

  const requestBody = {
    contents: [{
      parts
    }],
    generationConfig: {
      temperature: 0.3, // Baja temperatura para análisis más consistente
      maxOutputTokens: 4096,
    }
  };

  const response = await fetch(
    `${getApiUrl(GEMINI_TEXT_MODEL)}?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de API Gemini: ${response.status} - ${errorText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(`Error Gemini: ${data.error.message}`);
  }

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error('No se recibió respuesta válida de Gemini');
  }

  // Buscar la respuesta de texto
  for (const part of candidate.content.parts) {
    if (part.text) {
      return part.text;
    }
  }

  throw new Error('No se generó descripción del rostro');
}
