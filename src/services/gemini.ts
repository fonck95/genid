import type { GeminiResponse, IdentityPhoto, AttachedImage } from '../types';

// API Key desde variable de entorno
const GEMINI_API_KEY = import.meta.env.VITE_APP_API_KEY_GOOGLE;

// Modelo de texto para análisis de rostro (Flash es más rápido y económico para esta tarea)
const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-05-20';

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

// Tipos para las partes del contenido de Gemini
type TextPart = { text: string };
type InlineDataPart = { inlineData: { mimeType: string; data: string } };
type FileDataPart = { fileData: { mimeType: string; fileUri: string } };
type ContentPart = TextPart | InlineDataPart | FileDataPart;

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

  // Añadir instrucciones del sistema
  parts.push({
    text: `Eres un generador de imágenes profesional especializado en mantener consistencia facial. Vas a generar una imagen basada en la identidad de "${identityName}".${descriptionContext}${faceDescriptionContext}

INSTRUCCIONES CRÍTICAS DE CONSISTENCIA:
- Mantén EXACTAMENTE la identidad facial y características físicas descritas en el análisis antropométrico
- La persona debe ser claramente reconocible como la misma de las fotos de referencia
- Presta especial atención a: morfología craneal, estructura mandibular, forma de ojos, nariz y labios
- Respeta el fototipo de Fitzpatrick y cualquier marca distintiva mencionada
- Genera la imagen siguiendo exactamente la situación/escenario descrito
- Calidad profesional, alta resolución
${faceDescriptions ? '- IMPORTANTE: El análisis antropométrico es tu guía principal para la consistencia facial' : ''}

Fotos de referencia de "${identityName}" adjuntas a continuación:`
  });

  // Añadir fotos de referencia (máximo 5 para no sobrecargar)
  const photosToUse = referencePhotos.slice(0, 5);
  for (const photo of photosToUse) {
    parts.push(createImagePart(photo.dataUrl, 'image/jpeg'));
  }

  // Añadir el prompt del usuario
  parts.push({
    text: `

SITUACIÓN A GENERAR:
${prompt}

Genera una imagen de "${identityName}" en esta situación, manteniendo su identidad visual exacta de las fotos de referencia${faceDescriptions ? ' siguiendo estrictamente el análisis antropométrico proporcionado' : ''}.`
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
      text: `Eres un generador y editor de imágenes profesional especializado en consistencia facial. Vas a trabajar con las imágenes que el usuario ha adjuntado.

CONTEXTO:
- El usuario ha adjuntado ${attachedImages.length} imagen(es) para que las analices, edites o uses como referencia.
- También tienes fotos de referencia de "${identityName}" para mantener la identidad si es necesario.${descriptionContext}${faceDescriptionContext}

INSTRUCCIONES CRÍTICAS DE CONSISTENCIA:
- Analiza las imágenes adjuntas por el usuario
- Si el usuario pide editar o modificar las imágenes, hazlo manteniendo EXACTAMENTE la identidad facial de "${identityName}"
${faceDescriptions ? '- IMPORTANTE: Sigue estrictamente el análisis antropométrico para la consistencia facial (morfología craneal, estructura mandibular, forma de ojos, nariz y labios)' : ''}
- Si el usuario pide generar algo nuevo basado en las imágenes, úsalas como inspiración
- Genera una imagen de alta calidad siguiendo las instrucciones del usuario
- Respeta el fototipo de Fitzpatrick y cualquier marca distintiva mencionada

Fotos de referencia de "${identityName}":`
    });

    // Añadir fotos de referencia de identidad
    const photosToUse = referencePhotos.slice(0, 3);
    for (const photo of photosToUse) {
      parts.push(createImagePart(photo.dataUrl, 'image/jpeg'));
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

  // Añadir las imágenes adjuntas por el usuario
  for (const image of attachedImages) {
    parts.push(createImagePart(image.dataUrl, image.mimeType));
  }

  // Añadir el prompt del usuario
  parts.push({
    text: `

INSTRUCCIONES DEL USUARIO:
${prompt}

Genera una imagen basándote en las instrucciones anteriores.`
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

  // Añadir la imagen del rostro
  parts.push(createImagePart(imageUrl, 'image/jpeg'));

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
