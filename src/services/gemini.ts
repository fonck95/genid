import type { GeminiResponse, IdentityPhoto } from '../types';

// API Key hardcodeada (solo para pruebas)
const GEMINI_API_KEY = 'AIzaSyCwglAP66Y3h0Bims1rudXNXjPlkd25MZo';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export async function generateImageWithIdentity(
  prompt: string,
  referencePhotos: IdentityPhoto[],
  identityName: string
): Promise<string> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Añadir instrucciones del sistema
  parts.push({
    text: `Eres un generador de imágenes profesional. Vas a generar una imagen basada en la identidad de "${identityName}".

INSTRUCCIONES IMPORTANTES:
- Mantén la identidad facial y características físicas de la persona en las fotos de referencia
- La persona debe ser claramente reconocible como la misma de las fotos de referencia
- Genera la imagen siguiendo exactamente la situación/escenario descrito
- Calidad profesional, alta resolución

Fotos de referencia de "${identityName}" adjuntas a continuación:`
  });

  // Añadir fotos de referencia (máximo 5 para no sobrecargar)
  const photosToUse = referencePhotos.slice(0, 5);
  for (const photo of photosToUse) {
    const base64Data = photo.dataUrl.replace(/^data:image\/\w+;base64,/, '');
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

Genera una imagen de "${identityName}" en esta situación, manteniendo su identidad visual de las fotos de referencia.`
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

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
