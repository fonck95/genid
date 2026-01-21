import type { VeoResponse, IdentityPhoto } from '../types';
import { downscaleImage } from './imageOptimizer';

// API Key desde variable de entorno (misma que Gemini, es la API de Google AI)
const GOOGLE_API_KEY = import.meta.env.VITE_APP_API_KEY_GOOGLE;

// Modelo de Veo 3.1 para generación de video
const VEO_MODEL = 'veo-3.1-generate-preview';

// URL base para la API de generación de video
const VEO_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${VEO_MODEL}:predictLongRunning`;

// URL para verificar el estado de operaciones
const getOperationUrl = (operationName: string) =>
  `https://generativelanguage.googleapis.com/v1beta/${operationName}`;

// System prompt para consistencia de rostro en generación de video
const VIDEO_FACE_CONSISTENCY_PROMPT = `
[DIRECTIVAS DE CONSISTENCIA FACIAL PARA GENERACIÓN DE VIDEO]

OBJETIVO CRÍTICO:
Generar un video donde la persona mantenga ABSOLUTA CONSISTENCIA FACIAL durante toda la duración del video.
La identidad facial debe permanecer IDÉNTICA frame a frame, sin variaciones ni distorsiones.

═══════════════════════════════════════════════════════════════
1. PRESERVACIÓN DE IDENTIDAD FACIAL (MÁXIMA PRIORIDAD)
═══════════════════════════════════════════════════════════════
- MANTÉN EXACTAMENTE las características faciales descritas en el análisis antropométrico
- La persona debe ser RECONOCIBLE como la misma en cada frame del video
- NO permitas variaciones en:
  * Forma del rostro y estructura ósea
  * Forma, tamaño y color de ojos
  * Forma y características de la nariz
  * Forma, grosor y color de labios
  * Cejas: forma, grosor y posición
  * Tono de piel y marcas distintivas

═══════════════════════════════════════════════════════════════
2. COHERENCIA TEMPORAL
═══════════════════════════════════════════════════════════════
- Los rasgos faciales deben ser ESTABLES durante todo el video
- Las transiciones de expresión deben ser SUAVES y naturales
- Evita "flickering" o parpadeo en características faciales
- La iluminación del rostro debe cambiar gradualmente si hay movimiento

═══════════════════════════════════════════════════════════════
3. MOVIMIENTO NATURAL
═══════════════════════════════════════════════════════════════
- Los movimientos faciales deben ser realistas y fluidos
- Las expresiones deben cambiar de manera natural
- El cabello debe moverse de forma coherente con el movimiento
- Los ojos deben seguir direcciones naturales de mirada

═══════════════════════════════════════════════════════════════
4. CALIDAD DE VIDEO
═══════════════════════════════════════════════════════════════
- Mantener alta resolución y nitidez facial
- Evitar artefactos de compresión en el rostro
- El enfoque debe permanecer en el sujeto principal
- Frame rate consistente sin saltos
`;

/**
 * Convierte una imagen a base64 optimizada para la API de Veo
 */
async function imageToBase64ForVeo(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  // Optimizar imagen a 512px para reducir tamaño
  const optimizedUrl = await downscaleImage(imageUrl, 768, 0.9);

  // Extraer base64 y mimeType del data URL
  if (optimizedUrl.startsWith('data:')) {
    const matches = optimizedUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      return {
        mimeType: matches[1],
        base64: matches[2]
      };
    }
  }

  // Si es una URL externa, descargarla y convertirla
  if (optimizedUrl.startsWith('http')) {
    const response = await fetch(optimizedUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          resolve({
            mimeType: matches[1],
            base64: matches[2]
          });
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  throw new Error('Invalid image URL format');
}

/**
 * Construye el prompt de video con contexto de identidad facial
 */
function buildVideoPrompt(
  userPrompt: string,
  identityName?: string,
  faceDescription?: string
): string {
  let fullPrompt = '';

  // Añadir contexto de identidad si existe
  if (identityName && faceDescription) {
    fullPrompt += `[CONTEXTO DE IDENTIDAD FACIAL - "${identityName}"]
${VIDEO_FACE_CONSISTENCY_PROMPT}

ANÁLISIS ANTROPOMÉTRICO DEL ROSTRO A MANTENER:
${faceDescription}

INSTRUCCIÓN CRÍTICA:
El video DEBE mostrar a la persona descrita arriba, manteniendo su identidad facial EXACTA durante todo el video.
La persona debe ser INMEDIATAMENTE RECONOCIBLE como "${identityName}" en cada frame.

═══════════════════════════════════════════════════════════════
DESCRIPCIÓN DEL VIDEO A GENERAR:
═══════════════════════════════════════════════════════════════
`;
  }

  fullPrompt += userPrompt;

  // Añadir recordatorio final de consistencia
  if (identityName) {
    fullPrompt += `

[RECORDATORIO FINAL]
- Mantener la identidad facial de "${identityName}" EXACTA durante todo el video
- NO alterar los rasgos faciales característicos bajo ninguna circunstancia
- El rostro debe ser ESTABLE y CONSISTENTE frame a frame`;
  }

  return fullPrompt;
}

/**
 * Inicia la generación de un video usando Veo 3
 * Retorna el nombre de la operación para polling
 */
export async function startVideoGeneration(
  imageUrl: string,
  prompt: string,
  identityName?: string,
  identityDescription?: string,
  faceDescriptions?: string[]
): Promise<string> {
  // Preparar la imagen en base64
  const imageData = await imageToBase64ForVeo(imageUrl);

  // Combinar descripciones faciales si existen
  const combinedFaceDescription = faceDescriptions?.filter(Boolean).join('\n\n---\n\n');

  // Construir el prompt completo con contexto de identidad
  const fullPrompt = buildVideoPrompt(
    prompt,
    identityName,
    combinedFaceDescription || identityDescription
  );

  const requestBody = {
    instances: [
      {
        prompt: fullPrompt,
        image: {
          bytesBase64Encoded: imageData.base64,
          mimeType: imageData.mimeType
        }
      }
    ],
    parameters: {
      aspectRatio: '16:9',
      personGeneration: 'allow_adult',
      sampleCount: 1,
      durationSeconds: 8
    }
  };

  const response = await fetch(VEO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GOOGLE_API_KEY || ''
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Check for API disabled error (403)
    if (response.status === 403) {
      try {
        const errorData = JSON.parse(errorText);
        const errorInfo = errorData?.error;

        // Check if it's specifically the API disabled error
        if (errorInfo?.status === 'PERMISSION_DENIED') {
          const metadata = errorInfo?.details?.find(
            (d: { '@type': string }) => d['@type']?.includes('ErrorInfo')
          )?.metadata;

          const activationUrl = metadata?.activationUrl;
          const serviceName = metadata?.serviceTitle || 'Generative Language API';

          throw new Error(
            `⚠️ API No Habilitada: ${serviceName}\n\n` +
            `Para usar la generación de video, necesitas habilitar la API en Google Cloud:\n\n` +
            `1. Visita: ${activationUrl || 'https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com'}\n` +
            `2. Haz clic en "Habilitar" o "Enable"\n` +
            `3. Espera 2-3 minutos para que se propague\n` +
            `4. Intenta generar el video nuevamente`
          );
        }
      } catch (parseError) {
        // If parsing fails, check if error message contains key indicators
        if (errorText.includes('SERVICE_DISABLED') || errorText.includes('has not been used')) {
          throw new Error(
            `⚠️ API No Habilitada\n\n` +
            `Para usar la generación de video, habilita la Generative Language API:\n` +
            `https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com\n\n` +
            `Después de habilitarla, espera 2-3 minutos e intenta de nuevo.`
          );
        }
      }
    }

    throw new Error(`Error iniciando generación de video: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.name) {
    throw new Error('No se recibió nombre de operación de Veo');
  }

  return data.name;
}

/**
 * Verifica el estado de una operación de generación de video
 */
export async function checkVideoGenerationStatus(operationName: string): Promise<VeoResponse> {
  const response = await fetch(getOperationUrl(operationName), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GOOGLE_API_KEY || ''
    }
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Handle API disabled errors
    if (response.status === 403 && (errorText.includes('SERVICE_DISABLED') || errorText.includes('has not been used'))) {
      throw new Error(
        `⚠️ API No Habilitada\n\n` +
        `Habilita la Generative Language API:\n` +
        `https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com`
      );
    }

    throw new Error(`Error verificando estado de video: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Espera a que la generación de video se complete
 * Usa polling con intervalos exponenciales
 */
export async function waitForVideoGeneration(
  operationName: string,
  onProgress?: (status: string) => void,
  maxWaitTime: number = 300000 // 5 minutos máximo
): Promise<string> {
  const startTime = Date.now();
  let pollInterval = 3000; // Empezar con 3 segundos
  const maxPollInterval = 15000; // Máximo 15 segundos entre polls

  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkVideoGenerationStatus(operationName);

    if (status.error) {
      throw new Error(`Error en generación de video: ${status.error.message}`);
    }

    if (status.done) {
      // Video completado, extraer URL
      // La respuesta de Veo 3.1 usa generateVideoResponse como wrapper
      const videoUri = status.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

      if (!videoUri) {
        // Log the actual response structure for debugging
        console.error('Veo response structure:', JSON.stringify(status, null, 2));

        // Check for alternative response paths (API might have changed)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyStatus = status as any;

        // Check if there's an error in the response we missed
        if (anyStatus.error) {
          throw new Error(`Error en generación de video: ${anyStatus.error.message || anyStatus.error.status}`);
        }
        const altVideoUri =
          anyStatus.response?.generatedSamples?.[0]?.video?.uri ||
          anyStatus.response?.videos?.[0]?.uri ||
          anyStatus.result?.generatedSamples?.[0]?.video?.uri ||
          anyStatus.result?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

        if (altVideoUri) {
          console.log('Found video at alternative path:', altVideoUri);
          if (altVideoUri.startsWith('gs://')) {
            return await downloadVideoFromGoogleStorage(altVideoUri);
          }
          return altVideoUri;
        }

        throw new Error(
          'No se encontró video en la respuesta de Veo. ' +
          'La generación puede haber fallado silenciosamente. ' +
          'Estructura de respuesta: ' + JSON.stringify(status.response || status, null, 2).substring(0, 500)
        );
      }

      // Si el video viene en formato URI de Google Storage, construir URL de descarga
      if (videoUri.startsWith('gs://')) {
        // Convertir gs:// a URL de descarga de la API
        return await downloadVideoFromGoogleStorage(videoUri);
      }

      return videoUri;
    }

    // Reportar progreso
    onProgress?.('Generando video...');

    // Esperar antes del siguiente poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    // Aumentar intervalo exponencialmente hasta el máximo
    pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
  }

  throw new Error('Timeout esperando generación de video');
}

/**
 * Descarga un video desde Google Cloud Storage
 */
async function downloadVideoFromGoogleStorage(gsUri: string): Promise<string> {
  // Extraer bucket y path del URI gs://
  const matches = gsUri.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!matches) {
    throw new Error('URI de Google Storage inválido');
  }

  const [, bucket, path] = matches;

  // Try multiple download methods
  const downloadUrls = [
    // Method 1: Direct storage URL
    `https://storage.googleapis.com/${bucket}/${path}`,
    // Method 2: Authenticated storage API URL
    `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`,
  ];

  let lastError: Error | null = null;

  for (const downloadUrl of downloadUrls) {
    try {
      console.log('Attempting video download from:', downloadUrl);

      const response = await fetch(downloadUrl, {
        headers: GOOGLE_API_KEY ? {
          'x-goog-api-key': GOOGLE_API_KEY
        } : {}
      });

      if (response.ok) {
        const blob = await response.blob();
        console.log('Video downloaded successfully, size:', blob.size);
        return URL.createObjectURL(blob);
      }

      // If 403, try next URL
      if (response.status === 403) {
        console.warn(`403 Forbidden for ${downloadUrl}, trying alternative...`);
        lastError = new Error(`Acceso denegado (403) al descargar video desde: ${downloadUrl}`);
        continue;
      }

      lastError = new Error(`Error descargando video: ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error('Download attempt failed:', err);
    }
  }

  // If all methods failed, return the gs:// URI as a fallback (some players might handle it)
  console.error('All download methods failed, returning gs:// URI:', gsUri);

  throw new Error(
    `No se pudo descargar el video. ` +
    `El video fue generado pero está en un bucket privado. ` +
    `URI del video: ${gsUri}. ` +
    `Error: ${lastError?.message || 'Desconocido'}`
  );
}

/**
 * Genera un video a partir de una imagen con contexto de identidad
 * Esta es la función principal que combina inicio + espera
 */
export async function generateVideoFromImage(
  imageUrl: string,
  prompt: string,
  identityName?: string,
  referencePhotos?: IdentityPhoto[],
  identityDescription?: string,
  onProgress?: (status: string) => void
): Promise<string> {
  onProgress?.('Iniciando generación de video...');

  // Extraer descripciones faciales de las fotos de referencia
  const faceDescriptions = referencePhotos
    ?.filter(photo => photo.faceDescription)
    .map(photo => photo.faceDescription!)
    || [];

  // Iniciar la generación
  const operationName = await startVideoGeneration(
    imageUrl,
    prompt,
    identityName,
    identityDescription,
    faceDescriptions
  );

  onProgress?.('Procesando video con IA...');

  // Esperar a que se complete
  const videoUrl = await waitForVideoGeneration(operationName, onProgress);

  onProgress?.('Video completado!');

  return videoUrl;
}

/**
 * Genera un video simple sin identidad
 */
export async function generateSimpleVideo(
  imageUrl: string,
  prompt: string,
  onProgress?: (status: string) => void
): Promise<string> {
  return generateVideoFromImage(imageUrl, prompt, undefined, undefined, undefined, onProgress);
}
