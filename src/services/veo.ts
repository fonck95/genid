import type { VeoResponse, IdentityPhoto } from '../types';
import { downscaleImage } from './imageOptimizer';

// Configuración de autenticación para Vertex AI
// Video generation con Veo requiere OAuth2 (no soporta Express Mode con API Keys)
const VERTEX_ACCESS_TOKEN = import.meta.env.VITE_VERTEX_ACCESS_TOKEN;
// Project ID: usar VITE_APP_ID como fuente principal, VITE_VERTEX_PROJECT_ID como fallback
const VERTEX_PROJECT_ID = import.meta.env.VITE_APP_ID || import.meta.env.VITE_VERTEX_PROJECT_ID;
const VERTEX_LOCATION = import.meta.env.VITE_VERTEX_LOCATION || 'us-central1';

// Modelo de Veo 3.1 para generación de video
const VEO_MODEL = 'veo-3.1-generate-preview';

// Determinar si tenemos configuración OAuth2 válida para video generation
const hasOAuth2Config = () => Boolean(VERTEX_ACCESS_TOKEN && VERTEX_PROJECT_ID);

// URL para la API de generación de video
// Veo requiere el endpoint estándar de Vertex AI con proyecto/ubicación
// Formato: https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:predictLongRunning
const getVeoApiUrl = () => {
  if (hasOAuth2Config()) {
    return `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT_ID}/locations/${VERTEX_LOCATION}/publishers/google/models/${VEO_MODEL}:predictLongRunning`;
  }
  // Fallback - This won't work for video generation, but provides clear error
  return `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${VEO_MODEL}:predictLongRunning`;
};

// URL para verificar el estado de operaciones
const getOperationUrl = (operationName: string) => {
  if (hasOAuth2Config()) {
    // Para OAuth2, usar el endpoint estándar con el nombre de operación completo
    // El operationName ya viene con el path completo: projects/{project}/locations/{location}/...
    if (operationName.startsWith('projects/')) {
      return `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/${operationName}`;
    }
    return `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT_ID}/locations/${VERTEX_LOCATION}/operations/${operationName}`;
  }
  // Fallback para Express Mode (no funcionará para video)
  if (operationName.startsWith('operations/')) {
    return `https://aiplatform.googleapis.com/v1beta1/${operationName}`;
  }
  return `https://aiplatform.googleapis.com/v1beta1/operations/${operationName}`;
};

// Headers de autenticación
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (hasOAuth2Config()) {
    headers['Authorization'] = `Bearer ${VERTEX_ACCESS_TOKEN}`;
  }

  return headers;
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
  // Validar configuración OAuth2 (requerida para video generation)
  if (!hasOAuth2Config()) {
    throw new Error(
      '⚠️ Autenticación OAuth2 Requerida\n\n' +
      'La API de generación de video (Veo) requiere autenticación OAuth2.\n' +
      'Express Mode con API Keys NO es compatible con video generation.\n\n' +
      'Para configurar OAuth2:\n\n' +
      '1. **Obtén un Access Token:**\n' +
      '   Ejecuta en tu terminal:\n' +
      '   gcloud auth print-access-token\n\n' +
      '2. **Configura las variables de entorno:**\n' +
      '   VITE_VERTEX_ACCESS_TOKEN=tu_access_token\n' +
      '   VITE_APP_ID=tu_project_id (ya configurado si usas la app)\n' +
      '   VITE_VERTEX_LOCATION=us-central1 (opcional)\n\n' +
      '3. **Asegúrate de tener habilitado Vertex AI:**\n' +
      '   https://console.cloud.google.com/apis/library/aiplatform.googleapis.com\n\n' +
      'Nota: Los access tokens expiran después de ~1 hora.\n' +
      'Visita https://cloud.google.com/vertex-ai/docs/authentication para más información.'
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

  const response = await fetch(getVeoApiUrl(), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Check for INVALID_ARGUMENT errors (400) - including RESOURCE_PROJECT_INVALID
    if (response.status === 400) {
      try {
        const errorData = JSON.parse(errorText);
        const errorInfo = errorData?.error;

        // Check for RESOURCE_PROJECT_INVALID - indicates Express Mode endpoint was used
        const isProjectInvalid = errorInfo?.details?.some(
          (d: { reason?: string }) => d.reason === 'RESOURCE_PROJECT_INVALID'
        );

        if (isProjectInvalid) {
          throw new Error(
            '⚠️ Configuración de Proyecto Inválida\n\n' +
            'La API de generación de video (Veo) requiere un proyecto de Google Cloud válido.\n\n' +
            'Verifica tu configuración:\n\n' +
            '1. **VITE_APP_ID** debe ser un ID de proyecto válido\n' +
            '   • Encuentra tu project ID en: https://console.cloud.google.com\n\n' +
            '2. **VITE_VERTEX_ACCESS_TOKEN** debe ser un token OAuth2 válido\n' +
            '   • Genera uno con: gcloud auth print-access-token\n' +
            '   • Los tokens expiran después de ~1 hora\n\n' +
            '3. **Vertex AI API** debe estar habilitada en tu proyecto:\n' +
            '   https://console.cloud.google.com/apis/library/aiplatform.googleapis.com\n\n' +
            'Nota: Express Mode con API Keys NO soporta generación de video.'
          );
        }

        // Generic invalid argument error
        throw new Error(
          `⚠️ Error en la Solicitud\n\n` +
          `El servidor rechazó la solicitud: ${errorInfo?.message || 'Argumentos inválidos'}\n\n` +
          `Verifica que todos los parámetros sean correctos.`
        );
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('⚠️')) {
          throw parseError;
        }
        throw new Error(`Error iniciando generación de video: ${response.status} - ${errorText}`);
      }
    }

    // Check for authentication errors (401 UNAUTHENTICATED)
    if (response.status === 401) {
      try {
        const errorData = JSON.parse(errorText);
        const errorInfo = errorData?.error;

        if (errorInfo?.status === 'UNAUTHENTICATED' || errorInfo?.code === 401) {
          const isTokenExpired = errorInfo?.message?.includes('expired') ||
            errorInfo?.message?.includes('invalid');

          throw new Error(
            '⚠️ Token de Acceso Inválido o Expirado\n\n' +
            (isTokenExpired
              ? 'Tu access token ha expirado. Los tokens OAuth2 expiran después de ~1 hora.\n\n'
              : 'No se pudo autenticar con la API de Vertex AI.\n\n') +
            'Para obtener un nuevo token:\n\n' +
            '1. Ejecuta en tu terminal:\n' +
            '   gcloud auth print-access-token\n\n' +
            '2. Actualiza la variable de entorno:\n' +
            '   VITE_VERTEX_ACCESS_TOKEN=nuevo_token\n\n' +
            '3. Reinicia la aplicación\n\n' +
            `Detalle: ${errorInfo?.message || 'Error de autenticación'}`
          );
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('⚠️')) {
          throw parseError;
        }
        throw new Error(
          '⚠️ Error de Autenticación\n\n' +
          'No se pudo autenticar con la API de Vertex AI.\n' +
          'Verifica tu access token y que sea válido.\n\n' +
          'Genera un nuevo token: gcloud auth print-access-token'
        );
      }
    }

    // Check for permission denied errors (403)
    if (response.status === 403) {
      try {
        const errorData = JSON.parse(errorText);
        const errorInfo = errorData?.error;

        if (errorInfo?.status === 'PERMISSION_DENIED') {
          const metadata = errorInfo?.details?.find(
            (d: { '@type': string }) => d['@type']?.includes('ErrorInfo')
          )?.metadata;

          const activationUrl = metadata?.activationUrl;
          const serviceName = metadata?.serviceTitle || 'Vertex AI API';

          throw new Error(
            `⚠️ Permiso Denegado: ${serviceName}\n\n` +
            `Posibles causas:\n\n` +
            `1. **API no habilitada:**\n` +
            `   Visita: ${activationUrl || 'https://console.cloud.google.com/apis/library/aiplatform.googleapis.com'}\n\n` +
            `2. **Sin permisos en el proyecto:**\n` +
            `   Tu cuenta necesita el rol "Vertex AI User" o similar\n\n` +
            `3. **Project ID incorrecto:**\n` +
            `   Verifica VITE_APP_ID=${VERTEX_PROJECT_ID || '(no configurado)'}`
          );
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('⚠️')) {
          throw parseError;
        }
        if (errorText.includes('SERVICE_DISABLED') || errorText.includes('has not been used')) {
          throw new Error(
            `⚠️ API No Habilitada\n\n` +
            `Habilita Vertex AI API en tu proyecto:\n` +
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
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Handle authentication errors (401)
    if (response.status === 401) {
      throw new Error(
        '⚠️ Token de Acceso Expirado\n\n' +
        'No se pudo autenticar para verificar el estado del video.\n' +
        'Tu access token puede haber expirado (duran ~1 hora).\n\n' +
        'Genera uno nuevo: gcloud auth print-access-token'
      );
    }

    // Handle permission denied errors (403)
    if (response.status === 403) {
      if (errorText.includes('SERVICE_DISABLED') || errorText.includes('has not been used')) {
        throw new Error(
          `⚠️ API No Habilitada\n\n` +
          `Habilita Vertex AI API:\n` +
          `https://console.cloud.google.com/apis/library/aiplatform.googleapis.com`
        );
      }
      throw new Error(
        `⚠️ Permiso Denegado\n\n` +
        `No tienes permisos para acceder a esta operación.\n` +
        `Verifica que tu cuenta tenga acceso al proyecto.`
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
