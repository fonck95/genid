import type { VeoResponse, IdentityPhoto } from '../types';
import { downscaleImage } from './imageOptimizer';

// API Key desde variable de entorno para Vertex AI / Google AI
const VERTEX_API_KEY = import.meta.env.VITE_APP_API_KEY_VERTEX;

// Modelo de Veo 3.1 para generación de video
const VEO_MODEL = 'veo-3.1-generate-preview';

// URL base para la API de generación de video usando Vertex AI Express Mode
// Express mode soporta autenticación con API Key (no requiere OAuth2)
// Formato: https://aiplatform.googleapis.com/v1beta1/publishers/google/models/{model}:predictLongRunning
const VEO_API_URL = `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${VEO_MODEL}:predictLongRunning`;

// URL para verificar el estado de operaciones en Vertex AI Express Mode
const getOperationUrl = (operationName: string) => {
  // Si el operationName ya incluye el path completo, usar el endpoint base
  if (operationName.startsWith('operations/')) {
    return `https://aiplatform.googleapis.com/v1beta1/${operationName}`;
  }
  // Si es solo un ID, construir el path completo
  return `https://aiplatform.googleapis.com/v1beta1/operations/${operationName}`;
};

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
  // Validar API key
  if (!VERTEX_API_KEY) {
    throw new Error(
      '⚠️ API Key no configurada\n\n' +
      'Para usar la generación de video, configura la variable de entorno VITE_APP_API_KEY_VERTEX con tu API key de Google Cloud.\n\n' +
      'Puedes obtener una API key en:\n' +
      'https://console.cloud.google.com/apis/credentials'
    );
  }

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
          imageBytes: imageData.base64,
          mimeType: imageData.mimeType
        }
      }
    ],
    parameters: {
      aspectRatio: '16:9',
      personGeneration: 'allow_adult',
      sampleCount: 1,
      resolution: '720p'
    }
  };

  const response = await fetch(VEO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': VERTEX_API_KEY || ''
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Check for authentication errors (401 UNAUTHENTICATED)
    if (response.status === 401) {
      try {
        const errorData = JSON.parse(errorText);
        const errorInfo = errorData?.error;

        // Check for API key issues
        if (errorInfo?.status === 'UNAUTHENTICATED' || errorInfo?.code === 401) {
          const isInvalidApiKey = errorInfo?.message?.includes('API key not valid') ||
            errorInfo?.message?.includes('invalid') ||
            errorInfo?.details?.some((d: { reason?: string }) => d.reason === 'API_KEY_INVALID');

          if (isInvalidApiKey) {
            throw new Error(
              '⚠️ API Key Inválida\n\n' +
              'La API Key proporcionada no es válida o no tiene permisos para Vertex AI.\n\n' +
              'Para resolver este problema:\n\n' +
              '1. **Verifica tu API Key:**\n' +
              '   • Ve a https://console.cloud.google.com/apis/credentials\n' +
              '   • Asegúrate de que la API Key esté activa\n' +
              '   • Verifica que no tenga restricciones que bloqueen Vertex AI\n\n' +
              '2. **Habilita Vertex AI API:**\n' +
              '   • Ve a https://console.cloud.google.com/apis/library/aiplatform.googleapis.com\n' +
              '   • Haz clic en "Habilitar" si no está habilitada\n\n' +
              '3. **Asegúrate de usar una API Key de Express Mode:**\n' +
              '   • Visita https://aistudio.google.com/apikey\n' +
              '   • Genera una nueva API Key si es necesario'
            );
          }

          // Generic authentication error
          throw new Error(
            '⚠️ Error de Autenticación\n\n' +
            'No se pudo autenticar con la API de Vertex AI.\n\n' +
            'Verifica que:\n' +
            '• Tu API Key (VITE_APP_API_KEY_VERTEX) sea correcta\n' +
            '• Vertex AI API esté habilitada en tu proyecto\n' +
            '• La API Key tenga los permisos necesarios\n\n' +
            `Detalle: ${errorInfo?.message || 'Error de autenticación'}`
          );
        }
      } catch (parseError) {
        // If parseError is our thrown error, rethrow it
        if (parseError instanceof Error && parseError.message.includes('⚠️')) {
          throw parseError;
        }
        // Generic auth error for unparseable responses
        throw new Error(
          '⚠️ Error de Autenticación\n\n' +
          'No se pudo autenticar con la API de Vertex AI.\n' +
          'Verifica tu API Key y que Vertex AI esté habilitada en tu proyecto.'
        );
      }
    }

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
          const serviceName = metadata?.serviceTitle || 'Vertex AI API';

          throw new Error(
            `⚠️ API No Habilitada: ${serviceName}\n\n` +
            `Para usar la generación de video, necesitas habilitar la API en Google Cloud:\n\n` +
            `1. Visita: ${activationUrl || 'https://console.cloud.google.com/apis/library/aiplatform.googleapis.com'}\n` +
            `2. Haz clic en "Habilitar" o "Enable"\n` +
            `3. Espera 2-3 minutos para que se propague\n` +
            `4. Intenta generar el video nuevamente`
          );
        }
      } catch (parseError) {
        // If parseError is our thrown error, rethrow it
        if (parseError instanceof Error && parseError.message.includes('⚠️')) {
          throw parseError;
        }
        // If parsing fails, check if error message contains key indicators
        if (errorText.includes('SERVICE_DISABLED') || errorText.includes('has not been used')) {
          throw new Error(
            `⚠️ API No Habilitada\n\n` +
            `Para usar la generación de video, habilita Vertex AI API:\n` +
            `https://console.cloud.google.com/apis/library/aiplatform.googleapis.com\n\n` +
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
      'x-goog-api-key': VERTEX_API_KEY || ''
    }
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Handle authentication errors (401)
    if (response.status === 401) {
      throw new Error(
        '⚠️ Error de Autenticación\n\n' +
        'No se pudo autenticar para verificar el estado del video.\n' +
        'Verifica tu API Key y que Vertex AI esté habilitada en tu proyecto.\n\n' +
        'Obtén una API Key en: https://aistudio.google.com/apikey'
      );
    }

    // Handle API disabled errors
    if (response.status === 403 && (errorText.includes('SERVICE_DISABLED') || errorText.includes('has not been used'))) {
      throw new Error(
        `⚠️ API No Habilitada\n\n` +
        `Habilita Vertex AI API:\n` +
        `https://console.cloud.google.com/apis/library/aiplatform.googleapis.com`
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
        throw new Error('No se encontró video en la respuesta de Veo');
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

  // Construir URL de descarga pública
  const downloadUrl = `https://storage.googleapis.com/${bucket}/${path}`;

  // Descargar el video y convertirlo a blob URL
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Error descargando video: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
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
