/**
 * Servicio de integración con Kling AI API para generación de videos
 * Las llamadas se realizan a través de API routes en /api/kling para evitar CORS
 */

// API base for proxy endpoints (relative URLs work in both dev and prod)
const API_BASE = '/api/kling';

// Tipos para la API de Kling
export interface KlingVideoTask {
  task_id: string;
  task_status: 'submitted' | 'processing' | 'succeed' | 'failed';
  task_status_msg?: string;
  task_info?: {
    external_task_id?: string;
  };
  created_at: number;
  updated_at: number;
  task_result?: {
    videos?: Array<{
      id: string;
      url: string;
      duration: string;
    }>;
  };
}

export interface KlingApiResponse<T> {
  code: number;
  message: string;
  request_id: string;
  data: T;
}

export interface KlingVideoOptions {
  model_name?: 'kling-v1' | 'kling-v1-5' | 'kling-v1-6' | 'kling-v2-master' | 'kling-v2-1' | 'kling-v2-1-master';
  mode?: 'std' | 'pro';
  duration?: '3' | '5' | '10';
  cfg_scale?: number;
  negative_prompt?: string;
  /** Descripción antropométrica facial para mantener consistencia de identidad */
  faceDescription?: string;
}

export interface KlingMotionControlOptions {
  prompt?: string;
  keep_original_sound?: 'yes' | 'no';
  character_orientation: 'image' | 'video';
  mode: 'std' | 'pro';
}

/**
 * Mapeo de códigos de error de Kling API a mensajes amigables para el usuario
 */
const KLING_ERROR_MESSAGES: Record<number, string> = {
  // Errores de autenticación (401)
  1000: 'Error de autenticación. Verifica las credenciales de Kling AI.',
  1001: 'Falta la autorización. Configura las credenciales de Kling AI.',
  1002: 'Autorización inválida. Verifica las credenciales de Kling AI.',
  1003: 'El token de autorización aún no es válido. Intenta de nuevo en unos segundos.',
  1004: 'El token de autorización ha expirado. Se regenerará automáticamente.',

  // Errores de cuenta (429)
  1100: 'Error en la cuenta de Kling AI. Verifica la configuración de tu cuenta.',
  1101: 'Cuenta de Kling AI con saldo pendiente. Recarga tu cuenta para continuar.',
  1102: 'Sin créditos disponibles en Kling AI. Compra más créditos o activa el servicio de pago por uso en tu cuenta de Kling AI (https://klingai.com).',
  1103: 'No tienes permiso para acceder a este recurso o modelo de Kling AI.',

  // Errores de parámetros (400/404)
  1200: 'Parámetros de solicitud inválidos.',
  1201: 'Parámetro con valor incorrecto o no permitido.',
  1202: 'Método de solicitud inválido.',
  1203: 'El recurso solicitado no existe.',

  // Errores de políticas (400/429)
  1300: 'Se activó una política de la plataforma.',
  1301: 'El contenido no cumple con las políticas de seguridad de Kling AI. Modifica el prompt o la imagen.',
  1302: 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.',
  1303: 'Se excedió el límite de uso del paquete de recursos. Espera o contacta soporte.',
  1304: 'Tu IP no está en la lista blanca de Kling AI.',

  // Errores internos (500)
  5000: 'Error interno del servidor de Kling AI. Intenta de nuevo más tarde.',
  5001: 'El servidor de Kling AI no está disponible temporalmente (mantenimiento).',
  5002: 'Tiempo de espera agotado en el servidor de Kling AI. Intenta de nuevo más tarde.',
};

/**
 * Obtiene un mensaje de error amigable para un código de error de Kling
 */
function getKlingErrorMessage(code: number, defaultMessage: string): string {
  const friendlyMessage = KLING_ERROR_MESSAGES[code];
  if (friendlyMessage) {
    return friendlyMessage;
  }
  return `${defaultMessage} (código ${code})`;
}


/**
 * Optimiza una imagen para Kling API
 * Redimensiona imágenes muy grandes para reducir bytes transferidos
 * mantiendo buena calidad para generación de video
 */
async function optimizeImageForKling(imageUrl: string): Promise<string> {
  const MAX_DIMENSION = 1280; // Kling funciona bien con imágenes de 1280px
  const QUALITY = 0.92; // Alta calidad para video

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Si la imagen ya es pequeña, devolver sin cambios
      if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
        resolve(imageUrl);
        return;
      }

      // Calcular nuevas dimensiones manteniendo aspecto
      let newWidth = img.width;
      let newHeight = img.height;

      if (img.width > img.height) {
        newWidth = MAX_DIMENSION;
        newHeight = Math.round((img.height / img.width) * MAX_DIMENSION);
      } else {
        newHeight = MAX_DIMENSION;
        newWidth = Math.round((img.width / img.height) * MAX_DIMENSION);
      }

      // Redimensionar con canvas
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      resolve(canvas.toDataURL('image/jpeg', QUALITY));
    };

    img.onerror = () => {
      // Si hay error, devolver la URL original
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}

async function imageToBase64(imageUrl: string): Promise<string> {
  // Primero optimizar la imagen
  const optimizedUrl = await optimizeImageForKling(imageUrl);

  // Si ya es base64, extraer solo los datos
  if (optimizedUrl.startsWith('data:')) {
    return optimizedUrl.replace(/^data:image\/\w+;base64,/, '');
  }

  // Si es una URL, descargar y convertir
  const response = await fetch(optimizedUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.replace(/^data:image\/\w+;base64,/, ''));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Crea una tarea de generación de video a partir de una imagen
 * Las llamadas se hacen a través del proxy /api/kling para evitar CORS
 */
export async function createImageToVideoTask(
  imageUrl: string,
  prompt: string,
  options: KlingVideoOptions = {}
): Promise<KlingVideoTask> {
  // Convertir imagen a base64
  const imageBase64 = await imageToBase64(imageUrl);

  const requestBody = {
    model_name: options.model_name || 'kling-v1-6',
    image: imageBase64,
    prompt: prompt,
    negative_prompt: options.negative_prompt,
    mode: options.mode || 'std',
    duration: options.duration || '5',
    cfg_scale: options.cfg_scale ?? 0.5,
    // Face description for anthropometric consistency (processed server-side)
    faceDescription: options.faceDescription
  };

  const response = await fetch(`${API_BASE}/image2video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de Kling API: ${response.status} - ${errorText}`);
  }

  const result: KlingApiResponse<KlingVideoTask> = await response.json();

  if (result.code !== 0) {
    throw new Error(getKlingErrorMessage(result.code, result.message));
  }

  return result.data;
}

/**
 * Consulta el estado de una tarea de generación de video
 * Las llamadas se hacen a través del proxy /api/kling para evitar CORS
 */
export async function getVideoTaskStatus(taskId: string): Promise<KlingVideoTask> {
  const response = await fetch(`${API_BASE}/status?taskId=${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de Kling API: ${response.status} - ${errorText}`);
  }

  const result: KlingApiResponse<KlingVideoTask> = await response.json();

  if (result.code !== 0) {
    throw new Error(getKlingErrorMessage(result.code, result.message));
  }

  return result.data;
}

/**
 * Espera a que una tarea de video se complete (polling)
 */
export async function waitForVideoCompletion(
  taskId: string,
  onProgress?: (status: string, progress?: number) => void,
  maxWaitMs: number = 600000, // 10 minutos máximo
  pollIntervalMs: number = 5000 // Consultar cada 5 segundos
): Promise<KlingVideoTask> {
  const startTime = Date.now();
  let lastStatus = '';

  while (Date.now() - startTime < maxWaitMs) {
    const task = await getVideoTaskStatus(taskId);

    if (task.task_status !== lastStatus) {
      lastStatus = task.task_status;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const progress = Math.min(elapsed / 120 * 100, 95); // Estimado, máximo 95%
      onProgress?.(task.task_status, progress);
    }

    if (task.task_status === 'succeed') {
      onProgress?.('succeed', 100);
      return task;
    }

    if (task.task_status === 'failed') {
      throw new Error(`La generación del video falló: ${task.task_status_msg || 'Error desconocido'}`);
    }

    // Esperar antes de la siguiente consulta
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Tiempo de espera agotado para la generación del video');
}

/**
 * Genera un video a partir de una imagen y espera el resultado
 */
export async function generateVideoFromImage(
  imageUrl: string,
  prompt: string,
  options: KlingVideoOptions = {},
  onProgress?: (status: string, progress?: number) => void
): Promise<{ videoUrl: string; duration: string; taskId: string }> {
  // Crear la tarea
  onProgress?.('creating', 0);
  const task = await createImageToVideoTask(imageUrl, prompt, options);

  onProgress?.('submitted', 5);

  // Esperar a que termine
  const completedTask = await waitForVideoCompletion(task.task_id, onProgress);

  // Extraer el video del resultado
  const video = completedTask.task_result?.videos?.[0];
  if (!video) {
    throw new Error('No se encontró video en la respuesta');
  }

  return {
    videoUrl: video.url,
    duration: video.duration,
    taskId: task.task_id
  };
}

/**
 * Verifica si las credenciales de Kling están configuradas
 * Nota: Las credenciales ahora se verifican en el servidor
 */
export function isKlingConfigured(): boolean {
  // Credentials are now checked server-side in the API routes
  return true;
}

// ==================== MOTION CONTROL ====================

/**
 * Crea una tarea de Motion Control
 * Aplica el movimiento de un video de referencia a una imagen
 */
export async function createMotionControlTask(
  imageUrl: string,
  videoUrl: string,
  options: KlingMotionControlOptions
): Promise<KlingVideoTask> {
  const requestBody = {
    image: imageUrl,
    video: videoUrl,
    prompt: options.prompt,
    keep_original_sound: options.keep_original_sound || 'no',
    character_orientation: options.character_orientation,
    mode: options.mode
  };

  const response = await fetch(`${API_BASE}/motion-control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de Kling Motion Control API: ${response.status} - ${errorText}`);
  }

  const result: KlingApiResponse<KlingVideoTask> = await response.json();

  if (result.code !== 0) {
    throw new Error(getKlingErrorMessage(result.code, result.message));
  }

  return result.data;
}

/**
 * Consulta el estado de una tarea de Motion Control
 */
export async function getMotionControlTaskStatus(taskId: string): Promise<KlingVideoTask> {
  const response = await fetch(`${API_BASE}/motion-control-status?taskId=${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de Kling Motion Control API: ${response.status} - ${errorText}`);
  }

  const result: KlingApiResponse<KlingVideoTask> = await response.json();

  if (result.code !== 0) {
    throw new Error(getKlingErrorMessage(result.code, result.message));
  }

  return result.data;
}

/**
 * Espera a que una tarea de Motion Control se complete (polling)
 */
export async function waitForMotionControlCompletion(
  taskId: string,
  onProgress?: (status: string, progress?: number) => void,
  maxWaitMs: number = 600000,
  pollIntervalMs: number = 5000
): Promise<KlingVideoTask> {
  const startTime = Date.now();
  let lastStatus = '';

  while (Date.now() - startTime < maxWaitMs) {
    const task = await getMotionControlTaskStatus(taskId);

    if (task.task_status !== lastStatus) {
      lastStatus = task.task_status;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const progress = Math.min(elapsed / 120 * 100, 95);
      onProgress?.(task.task_status, progress);
    }

    if (task.task_status === 'succeed') {
      onProgress?.('succeed', 100);
      return task;
    }

    if (task.task_status === 'failed') {
      throw new Error(`La generación del video Motion Control falló: ${task.task_status_msg || 'Error desconocido'}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Tiempo de espera agotado para la generación del video Motion Control');
}

/**
 * Genera un video con Motion Control y espera el resultado
 * Aplica el movimiento de un video de referencia a una imagen
 */
export async function generateMotionControlVideo(
  imageUrl: string,
  videoUrl: string,
  options: KlingMotionControlOptions,
  onProgress?: (status: string, progress?: number) => void
): Promise<{ videoUrl: string; duration: string; taskId: string }> {
  onProgress?.('creating', 0);
  const task = await createMotionControlTask(imageUrl, videoUrl, options);

  onProgress?.('submitted', 5);

  const completedTask = await waitForMotionControlCompletion(task.task_id, onProgress);

  const video = completedTask.task_result?.videos?.[0];
  if (!video) {
    throw new Error('No se encontró video en la respuesta de Motion Control');
  }

  return {
    videoUrl: video.url,
    duration: video.duration,
    taskId: task.task_id
  };
}
