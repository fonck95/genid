import type { VeoResponse, IdentityPhoto } from '../types';
import { downscaleImage } from './imageOptimizer';
import { getValidAccessToken, isAuthenticated as isUserAuthenticated } from './googleAuth';

// Configuración de Vertex AI
// Función para extraer Project ID de un email de service account o valor directo
function extractProjectId(value: string | undefined): string | undefined {
  if (!value) return undefined;

  // Si es un email de service account (ejemplo: vertex-express@gen-lang-client-0249478362.iam.gserviceaccount.com)
  // Extraer el project ID del dominio
  const serviceAccountMatch = value.match(/@([^.]+)\.iam\.gserviceaccount\.com$/);
  if (serviceAccountMatch) {
    return serviceAccountMatch[1];
  }

  // Si no es un email de service account, usar el valor directamente
  return value;
}

// Project ID: prioridad VITE_APP_ID_VERTEX > VITE_APP_ID > VITE_VERTEX_PROJECT_ID
const rawVertexId = import.meta.env.VITE_APP_ID_VERTEX || import.meta.env.VITE_APP_ID || import.meta.env.VITE_VERTEX_PROJECT_ID;
const VERTEX_PROJECT_ID = extractProjectId(rawVertexId);
const VERTEX_LOCATION = import.meta.env.VITE_VERTEX_LOCATION || 'us-central1';

// Access token de respaldo desde variables de entorno
// VITE_APP_API_KEY_VERTEX puede contener un access token pre-generado para Vertex AI
// IMPORTANTE: Debe ser un token OAuth2 válido (empieza con 'ya29.')
// NO es una API key tradicional - es un access token temporal (~1 hora)
const RAW_FALLBACK_TOKEN = import.meta.env.VITE_APP_API_KEY_VERTEX || null;

// Validar que el token de respaldo tenga el formato correcto
// Los access tokens de Google OAuth2 empiezan con 'ya29.'
function isValidAccessToken(token: string | null): boolean {
  if (!token) return false;
  // Access tokens válidos de Google empiezan con 'ya29.' o 'ya39.'
  return token.startsWith('ya29.') || token.startsWith('ya39.');
}

// Solo usar el fallback token si es válido
const FALLBACK_ACCESS_TOKEN = isValidAccessToken(RAW_FALLBACK_TOKEN) ? RAW_FALLBACK_TOKEN : null;

// Log warning si hay un token inválido configurado
if (RAW_FALLBACK_TOKEN && !FALLBACK_ACCESS_TOKEN) {
  // Mostrar los primeros caracteres del token para ayudar al usuario a identificar el problema
  const tokenPreview = RAW_FALLBACK_TOKEN.length > 10
    ? RAW_FALLBACK_TOKEN.substring(0, 10) + '...'
    : RAW_FALLBACK_TOKEN;

  console.warn(
    '╔══════════════════════════════════════════════════════════════════╗\n' +
    '║  [GenID] ERROR: Token de Vertex AI Inválido                      ║\n' +
    '╚══════════════════════════════════════════════════════════════════╝\n\n' +
    '❌ PROBLEMA:\n' +
    `   VITE_APP_API_KEY_VERTEX contiene: "${tokenPreview}"\n` +
    '   Esto NO es un access token válido de Google OAuth2.\n\n' +
    '✅ FORMATO CORRECTO:\n' +
    '   Los access tokens de Google SIEMPRE empiezan con "ya29." o "ya39."\n' +
    '   Ejemplo: ya29.a0AfH6SMBxxxxxxxxxxxxxxxxxxxxxxxx\n\n' +
    '🔧 SOLUCIÓN:\n' +
    '   OPCIÓN 1 (Recomendada): Usar OAuth\n' +
    '   → Haz clic en "Iniciar sesión con Google" en la app\n\n' +
    '   OPCIÓN 2: Generar token manual\n' +
    '   → Ejecuta en terminal: gcloud auth print-access-token\n' +
    '   → Copia el token que empieza con "ya29."\n' +
    '   → Configura: VITE_APP_API_KEY_VERTEX=ya29.xxx...\n\n' +
    '⚠️ IMPORTANTE: Los access tokens expiran en ~1 hora.\n' +
    '   Si usas un token manual, deberás regenerarlo periódicamente.'
  );
}

// Modelo de Veo 3.1 para generación de video
const VEO_MODEL = 'veo-3.1-generate-preview';

// Variable para almacenar el token actual (se actualiza dinámicamente)
let currentAccessToken: string | null = null;

/**
 * Set the access token for API calls
 * Called from the auth context when user logs in
 */
export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  return currentAccessToken;
}

/**
 * Check if user is authenticated and has a valid token
 */
export async function hasValidAuth(): Promise<boolean> {
  // First check if user is authenticated via OAuth
  if (isUserAuthenticated()) {
    // Try to get a valid token (refreshes if needed)
    const token = await getValidAccessToken();
    if (token) {
      currentAccessToken = token;
      return true;
    }
  }

  // Si no hay OAuth pero hay token de respaldo y project ID configurado, también es válido
  if (FALLBACK_ACCESS_TOKEN && VERTEX_PROJECT_ID) {
    return true;
  }

  return false;
}

// Determinar si tenemos configuración válida para video generation
const hasProjectConfig = () => Boolean(VERTEX_PROJECT_ID);
const hasOAuth2Config = () => Boolean((currentAccessToken || FALLBACK_ACCESS_TOKEN) && VERTEX_PROJECT_ID);

// URL para la API de generación de video
// Veo requiere el endpoint estándar de Vertex AI con proyecto/ubicación
// Formato: https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:predictLongRunning
const getVeoApiUrl = () => {
  return `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT_ID}/locations/${VERTEX_LOCATION}/publishers/google/models/${VEO_MODEL}:predictLongRunning`;
};

// URL para verificar el estado de operaciones
const getOperationUrl = (operationName: string) => {
  // El operationName ya viene con el path completo: projects/{project}/locations/{location}/...
  if (operationName.startsWith('projects/')) {
    return `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/${operationName}`;
  }
  return `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT_ID}/locations/${VERTEX_LOCATION}/operations/${operationName}`;
};

// Obtener el token de acceso efectivo (OAuth > fallback)
const getEffectiveAccessToken = (): string | null => {
  return currentAccessToken || FALLBACK_ACCESS_TOKEN;
};

// Headers de autenticación
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const token = getEffectiveAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
  // Validar configuración de proyecto
  if (!hasProjectConfig()) {
    throw new Error(
      '⚠️ Configuracion de Proyecto Requerida\n\n' +
      'La API de generacion de video (Veo) requiere un proyecto de Google Cloud.\n\n' +
      'Configura una de estas variables de entorno:\n' +
      '• VITE_APP_ID_VERTEX=tu_project_id (o email de service account)\n' +
      '• VITE_APP_ID=tu_project_id\n' +
      '• VITE_VERTEX_PROJECT_ID=tu_project_id\n\n' +
      'Encuentra tu project ID en:\n' +
      'https://console.cloud.google.com'
    );
  }

  // Validar autenticación OAuth2 (requerida para video generation)
  if (!hasOAuth2Config()) {
    // Construir mensaje de error detallado
    const hasInvalidFallbackToken = RAW_FALLBACK_TOKEN && !FALLBACK_ACCESS_TOKEN;
    const projectId = VERTEX_PROJECT_ID || '(no configurado)';

    let errorMessage = '⚠️ Autenticacion Requerida para Vertex AI\n\n';

    if (hasInvalidFallbackToken) {
      // Mostrar preview del token inválido para ayudar a identificar el problema
      const tokenPreview = RAW_FALLBACK_TOKEN && RAW_FALLBACK_TOKEN.length > 10
        ? RAW_FALLBACK_TOKEN.substring(0, 10) + '...'
        : RAW_FALLBACK_TOKEN || '';

      errorMessage +=
        '╔══════════════════════════════════════════════════════════════╗\n' +
        '║  ❌ TOKEN INVALIDO DETECTADO                                   ║\n' +
        '╚══════════════════════════════════════════════════════════════╝\n\n' +
        `Valor actual: "${tokenPreview}"\n\n` +
        '• Esto NO es un access token valido de Google OAuth2\n' +
        '• Los tokens validos SIEMPRE empiezan con "ya29." o "ya39."\n' +
        '• Parece que configuraste una API key en lugar de un access token\n\n' +
        '💡 DIFERENCIA IMPORTANTE:\n' +
        '   • API Key: AIzaSy... (NO funciona con Vertex AI)\n' +
        '   • Access Token: ya29.a0... (REQUERIDO para Vertex AI)\n\n';
    }

    errorMessage +=
      '═══════════════════════════════════════════════════════════\n' +
      'OPCION 1: Iniciar sesion con Google OAuth (RECOMENDADO)\n' +
      '═══════════════════════════════════════════════════════════\n' +
      '1. Haz clic en "Iniciar sesion con Google" en la parte superior\n' +
      '2. Tu cuenta debe tener acceso al proyecto: ' + projectId + '\n' +
      '3. Debes tener el rol "Vertex AI User" en IAM\n\n' +
      '═══════════════════════════════════════════════════════════\n' +
      'OPCION 2: Token de acceso temporal (avanzado)\n' +
      '═══════════════════════════════════════════════════════════\n' +
      '1. Instala gcloud CLI: https://cloud.google.com/sdk/docs/install\n' +
      '2. Ejecuta: gcloud auth login\n' +
      '3. Ejecuta: gcloud auth print-access-token\n' +
      '4. Copia el token (empieza con "ya29.")\n' +
      '5. Configura: VITE_APP_API_KEY_VERTEX=ya29.xxx...\n' +
      '6. NOTA: El token expira en ~1 hora\n\n' +
      'Si ya iniciaste sesion y ves este mensaje:\n' +
      '• Tu sesion puede haber expirado - vuelve a iniciar sesion\n' +
      '• Tu cuenta puede no tener permisos en el proyecto';

    throw new Error(errorMessage);
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
            '⚠️ Sesion Expirada\n\n' +
            (isTokenExpired
              ? 'Tu sesion ha expirado.\n\n'
              : 'No se pudo autenticar con la API de Vertex AI.\n\n') +
            'Por favor cierra sesion y vuelve a iniciar sesion con Google\n' +
            'para obtener un nuevo token de acceso.\n\n' +
            `Detalle: ${errorInfo?.message || 'Error de autenticacion'}`
          );
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('⚠️')) {
          throw parseError;
        }
        throw new Error(
          '⚠️ Error de Autenticacion\n\n' +
          'No se pudo autenticar con la API de Vertex AI.\n\n' +
          'Por favor cierra sesion y vuelve a iniciar sesion con Google.'
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
          const projectId = VERTEX_PROJECT_ID || '(no configurado)';

          // Build project-specific console links
          const apiEnableUrl = activationUrl ||
            `https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${projectId}`;
          const iamUrl = `https://console.cloud.google.com/iam-admin/iam?project=${projectId}`;

          throw new Error(
            `⚠️ Permiso Denegado: ${serviceName}\n\n` +
            `Proyecto: ${projectId}\n` +
            `Region: ${VERTEX_LOCATION}\n\n` +
            `Pasos para solucionar:\n\n` +
            `1. **Habilitar Vertex AI API:**\n` +
            `   ${apiEnableUrl}\n\n` +
            `2. **Agregar permisos IAM:**\n` +
            `   ${iamUrl}\n` +
            `   - Agrega tu email con rol "Vertex AI User"\n\n` +
            `3. **Verificar Project ID:**\n` +
            `   - VITE_APP_ID_VERTEX debe coincidir con tu proyecto\n` +
            `   - Actual: ${projectId}\n\n` +
            `4. **Esperar propagacion:**\n` +
            `   - Despues de cambios, espera 2-3 minutos`
          );
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('⚠️')) {
          throw parseError;
        }
        const projectId = VERTEX_PROJECT_ID || '(no configurado)';
        if (errorText.includes('SERVICE_DISABLED') || errorText.includes('has not been used')) {
          throw new Error(
            `⚠️ API No Habilitada\n\n` +
            `Habilita Vertex AI API en tu proyecto:\n` +
            `https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${projectId}\n\n` +
            `Despues de habilitarla, espera 2-3 minutos e intenta de nuevo.`
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
        '⚠️ Sesion Expirada\n\n' +
        'No se pudo autenticar para verificar el estado del video.\n' +
        'Tu sesion puede haber expirado.\n\n' +
        'Por favor cierra sesion y vuelve a iniciar sesion con Google.'
      );
    }

    // Handle permission denied errors (403)
    if (response.status === 403) {
      const projectId = VERTEX_PROJECT_ID || '(no configurado)';
      if (errorText.includes('SERVICE_DISABLED') || errorText.includes('has not been used')) {
        throw new Error(
          `⚠️ API No Habilitada\n\n` +
          `Habilita Vertex AI API:\n` +
          `https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${projectId}`
        );
      }
      throw new Error(
        `⚠️ Permiso Denegado\n\n` +
        `No tienes permisos para acceder a esta operación.\n\n` +
        `Verifica:\n` +
        `- Tu cuenta tenga acceso al proyecto: ${projectId}\n` +
        `- Tengas el rol "Vertex AI User" en IAM\n\n` +
        `IAM: https://console.cloud.google.com/iam-admin/iam?project=${projectId}`
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
