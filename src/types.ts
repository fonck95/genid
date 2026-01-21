export interface Identity {
  id: string;
  deviceId: string;
  name: string;
  description: string;
  photos: IdentityPhoto[];
  createdAt: number;
  updatedAt: number;
}

export interface IdentityPhoto {
  id: string;
  dataUrl: string;
  thumbnail: string;
  cloudinaryId?: string;
  addedAt: number;
  /** Descripción antropométrica del rostro generada por IA */
  faceDescription?: string;
  /** Timestamp de cuando se generó la descripción */
  faceDescriptionGeneratedAt?: number;
}

/** Tipo de variante étnica para generación de rostros */
export type FaceVariantType = 'afroamerican' | 'latin' | 'caucasian';

/** Información de una variante de rostro generada */
export interface FaceVariant {
  id: string;
  type: FaceVariantType;
  /** Nombre descriptivo de la variante */
  label: string;
  /** URL de la imagen generada */
  imageUrl: string;
  /** Thumbnail para preview */
  thumbnail: string;
  /** ID de Cloudinary si está almacenada */
  cloudinaryId?: string;
  /** Timestamp de creación */
  createdAt: number;
}

/** Conjunto de variantes de rostro generadas a partir de una foto base */
export interface FaceVariantsSet {
  id: string;
  /** ID de la identidad asociada */
  identityId: string;
  /** URL de la imagen base usada */
  baseImageUrl: string;
  /** Thumbnail de la imagen base */
  baseImageThumbnail: string;
  /** Variantes generadas */
  variants: FaceVariant[];
  /** Timestamp de creación */
  createdAt: number;
}

export interface GeneratedImage {
  id: string;
  deviceId: string;
  identityId: string;
  identityName: string;
  prompt: string;
  imageUrl: string;
  cloudinaryId?: string;
  createdAt: number;
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export interface AttachedImage {
  id: string;
  dataUrl: string;
  thumbnail: string;
  mimeType: string;
}

/**
 * Representa un paso individual en un hilo de edición.
 * Cada paso contiene la imagen resultante y el prompt usado.
 */
export interface EditingStep {
  id: string;
  /** URL de la imagen en este paso (puede ser Cloudinary o base64) */
  imageUrl: string;
  /** Thumbnail de la imagen para preview rápido */
  thumbnail: string;
  /** Prompt usado para generar/editar esta imagen */
  prompt: string;
  /** ID de Cloudinary si está almacenada */
  cloudinaryId?: string;
  /** Timestamp de creación */
  createdAt: number;
}

/**
 * Representa un hilo de edición de imágenes.
 * Permite iterar sobre una imagen hasta obtener el resultado deseado.
 */
export interface EditingThread {
  id: string;
  deviceId: string;
  /** ID de la identidad asociada (opcional, puede ser edición sin identidad) */
  identityId?: string;
  /** Nombre de la identidad para referencia rápida */
  identityName?: string;
  /** Nombre/título del hilo de edición */
  name: string;
  /** Historial de pasos de edición (el último es el más reciente) */
  steps: EditingStep[];
  /** Si el hilo está activo o fue finalizado */
  isActive: boolean;
  /** ID de la imagen guardada en galería si se finalizó */
  savedImageId?: string;
  createdAt: number;
  updatedAt: number;
}

// === TIPOS PARA VIDEOS GENERADOS (KLING) ===

/** Estado del proceso de generación de video */
export type VideoGenerationStatus = 'idle' | 'creating' | 'submitted' | 'processing' | 'succeed' | 'failed';

/** Modelo de Kling disponible */
export type KlingModel = 'kling-v1' | 'kling-v1-5' | 'kling-v1-6' | 'kling-v2-master' | 'kling-v2-1' | 'kling-v2-1-master';

/** Modo de generación de video */
export type KlingVideoMode = 'std' | 'pro';

/** Duración del video */
export type KlingVideoDuration = '3' | '5' | '10';

/** Opciones para generación de video */
export interface VideoGenerationOptions {
  model_name?: KlingModel;
  mode?: KlingVideoMode;
  duration?: KlingVideoDuration;
  cfg_scale?: number;
  negative_prompt?: string;
}

/** Video generado almacenado */
export interface GeneratedVideo {
  id: string;
  deviceId: string;
  /** ID de la identidad asociada */
  identityId?: string;
  /** Nombre de la identidad para referencia rapida */
  identityName?: string;
  /** ID de la imagen de origen */
  sourceImageId?: string;
  /** URL de la imagen de origen */
  sourceImageUrl: string;
  /** Thumbnail de la imagen de origen */
  sourceImageThumbnail?: string;
  /** Prompt usado para generar el video */
  prompt: string;
  /** URL del video generado */
  videoUrl: string;
  /** Duración del video en segundos */
  duration: string;
  /** ID de la tarea en Kling API */
  klingTaskId: string;
  /** Modelo usado */
  model: string;
  /** Modo usado (std/pro) */
  mode: string;
  /** Timestamp de creación */
  createdAt: number;
}
