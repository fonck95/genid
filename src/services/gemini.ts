import type { GeminiResponse, IdentityPhoto, AttachedImage } from '../types';

// API Key desde variable de entorno
const GEMINI_API_KEY = import.meta.env.VITE_APP_API_KEY_GOOGLE;

// Función auxiliar para convertir URL a base64
async function urlToBase64(url: string): Promise<string> {
  // Si ya es un data URL, extraer solo la parte base64
  if (url.startsWith('data:')) {
    return url.replace(/^data:image\/\w+;base64,/, '');
  }

  // Si es una URL, descargar y convertir a base64
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extraer solo la parte base64 del data URL
      resolve(result.replace(/^data:image\/\w+;base64,/, ''));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Construir la descripción de la identidad si existe
  const descriptionContext = identityDescription
    ? `\n\nDESCRIPCIÓN DE LA PERSONA:\n${identityDescription}\n\nUsa esta descripción junto con las fotos de referencia para generar una imagen más precisa y consistente con la identidad de esta persona.`
    : '';

  // Añadir instrucciones del sistema
  parts.push({
    text: `Eres un generador de imágenes profesional. Vas a generar una imagen basada en la identidad de "${identityName}".${descriptionContext}

INSTRUCCIONES IMPORTANTES:
- Mantén la identidad facial y características físicas de la persona en las fotos de referencia
- La persona debe ser claramente reconocible como la misma de las fotos de referencia
- Genera la imagen siguiendo exactamente la situación/escenario descrito
- Calidad profesional, alta resolución
${identityDescription ? '- Ten en cuenta la descripción proporcionada para mantener la consistencia de la persona' : ''}

Fotos de referencia de "${identityName}" adjuntas a continuación:`
  });

  // Añadir fotos de referencia (máximo 5 para no sobrecargar)
  const photosToUse = referencePhotos.slice(0, 5);
  for (const photo of photosToUse) {
    const base64Data = await urlToBase64(photo.dataUrl);
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    });
  }

  // Añadir el prompt del usuario
  parts.push({
    text: `

SITUACIÓN A GENERAR:
${prompt}

Genera una imagen de "${identityName}" en esta situación, manteniendo su identidad visual de las fotos de referencia${identityDescription ? ' y considerando la descripción proporcionada de la persona' : ''}.`
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
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Instrucciones del sistema según el contexto
  if (identityName && referencePhotos && referencePhotos.length > 0) {
    // Construir la descripción de la identidad si existe
    const descriptionContext = identityDescription
      ? `\n\nDESCRIPCIÓN DE LA PERSONA "${identityName}":\n${identityDescription}\n`
      : '';

    parts.push({
      text: `Eres un generador y editor de imágenes profesional. Vas a trabajar con las imágenes que el usuario ha adjuntado.

CONTEXTO:
- El usuario ha adjuntado ${attachedImages.length} imagen(es) para que las analices, edites o uses como referencia.
- También tienes fotos de referencia de "${identityName}" para mantener la identidad si es necesario.${descriptionContext}

INSTRUCCIONES:
- Analiza las imágenes adjuntas por el usuario
- Si el usuario pide editar o modificar las imágenes, hazlo manteniendo la identidad de "${identityName}"${identityDescription ? ' y considerando la descripción proporcionada de esta persona' : ''}
- Si el usuario pide generar algo nuevo basado en las imágenes, úsalas como inspiración
- Genera una imagen de alta calidad siguiendo las instrucciones del usuario
${identityDescription ? '- Asegúrate de que la persona generada sea consistente con la descripción y las fotos de referencia' : ''}

Fotos de referencia de "${identityName}":`
    });

    // Añadir fotos de referencia de identidad
    const photosToUse = referencePhotos.slice(0, 3);
    for (const photo of photosToUse) {
      const base64Data = await urlToBase64(photo.dataUrl);
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
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
    const base64Data = await urlToBase64(image.dataUrl);
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: base64Data
      }
    });
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
