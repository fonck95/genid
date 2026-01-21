/**
 * Servicio de integración con Kling AI API para generación de videos
 * https://api-singapore.klingai.com
 */

// API Keys desde variables de entorno
const KLING_ACCESS_KEY = import.meta.env.VITE_APP_API_KLING_KEY;
const KLING_SECRET_KEY = import.meta.env.VITE_APP_SECRET_KLING;
const KLING_API_BASE = 'https://api-singapore.klingai.com';

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
  duration?: '5' | '10';
  cfg_scale?: number;
  negative_prompt?: string;
}

/**
 * Genera un JWT token para autenticación con Kling API
 * Siguiendo el estándar RFC 7519
 */
async function generateJwtToken(): Promise<string> {
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    throw new Error('Faltan las credenciales de Kling API. Configura VITE_APP_API_KLING_KEY y VITE_APP_SECRET_KLING');
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: now + 1800, // Válido por 30 minutos
    nbf: now - 5     // Efectivo desde 5 segundos antes
  };

  // Codificar header y payload en base64url
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Crear la firma usando HMAC-SHA256
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSha256(KLING_SECRET_KEY, signatureInput);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Codifica un string en base64url (sin padding)
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Genera firma HMAC-SHA256 y la codifica en base64url
 */
async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Convierte una imagen a base64 sin el prefijo data:
 */
async function imageToBase64(imageUrl: string): Promise<string> {
  // Si ya es base64, extraer solo los datos
  if (imageUrl.startsWith('data:')) {
    return imageUrl.replace(/^data:image\/\w+;base64,/, '');
  }

  // Si es una URL, descargar y convertir
  const response = await fetch(imageUrl);
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
 */
export async function createImageToVideoTask(
  imageUrl: string,
  prompt: string,
  options: KlingVideoOptions = {}
): Promise<KlingVideoTask> {
  const token = await generateJwtToken();

  // Convertir imagen a base64
  const imageBase64 = await imageToBase64(imageUrl);

  const requestBody = {
    model_name: options.model_name || 'kling-v1-6',
    image: imageBase64,
    prompt: prompt,
    negative_prompt: options.negative_prompt,
    mode: options.mode || 'std',
    duration: options.duration || '5',
    cfg_scale: options.cfg_scale ?? 0.5
  };

  const response = await fetch(`${KLING_API_BASE}/v1/videos/image2video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de Kling API: ${response.status} - ${errorText}`);
  }

  const result: KlingApiResponse<KlingVideoTask> = await response.json();

  if (result.code !== 0) {
    throw new Error(`Error Kling: ${result.message} (código ${result.code})`);
  }

  return result.data;
}

/**
 * Consulta el estado de una tarea de generación de video
 */
export async function getVideoTaskStatus(taskId: string): Promise<KlingVideoTask> {
  const token = await generateJwtToken();

  const response = await fetch(`${KLING_API_BASE}/v1/videos/image2video/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de Kling API: ${response.status} - ${errorText}`);
  }

  const result: KlingApiResponse<KlingVideoTask> = await response.json();

  if (result.code !== 0) {
    throw new Error(`Error Kling: ${result.message} (código ${result.code})`);
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
 */
export function isKlingConfigured(): boolean {
  return !!(KLING_ACCESS_KEY && KLING_SECRET_KEY);
}
