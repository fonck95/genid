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

/** Estado de generación de video */
export type VideoGenerationStatus = 'pending' | 'generating' | 'processing' | 'completed' | 'failed';

/** Representa un video generado */
export interface GeneratedVideo {
  id: string;
  deviceId: string;
  /** ID de la identidad asociada */
  identityId?: string;
  /** Nombre de la identidad para referencia rápida */
  identityName?: string;
  /** Prompt usado para generar el video */
  prompt: string;
  /** URL de la imagen base usada para generar el video */
  sourceImageUrl: string;
  /** Thumbnail de la imagen base */
  sourceImageThumbnail: string;
  /** URL del video generado (Cloudinary o base64) */
  videoUrl: string;
  /** ID de Cloudinary del video */
  cloudinaryId?: string;
  /** Duración del video en segundos */
  duration: number;
  /** Estado de la generación */
  status: VideoGenerationStatus;
  /** Mensaje de error si falló */
  errorMessage?: string;
  /** Timestamp de creación */
  createdAt: number;
  /** Timestamp de última actualización */
  updatedAt: number;
}

/** Modelo Veo disponible */
export interface VeoModel {
  id: string;
  name: string;
  version: '2.0' | '3.0' | '3.1';
  supportsAudio: boolean;
  supportsEnhancePrompt: boolean;
  durationRange: {
    min: number;
    max: number;
    allowed?: number[];
  };
  defaultDuration: number;
  resolutions: string[];
  supportsReferenceImages: boolean;
  supportsStyleImages?: boolean;
  supportsLastFrame?: boolean;
  supportsVideoExtension?: boolean;
  supportsMask?: boolean;
}

/** Tipo de imagen de referencia para Veo */
export type VeoReferenceType = 'asset' | 'style';

/** Imagen de referencia para generación de video */
export interface VeoReferenceImage {
  imageUrl: string;
  referenceType: VeoReferenceType;
}

/** Opciones de generación de video Veo */
export interface VeoGenerationOptions {
  /** ID del modelo a usar (default: veo-3.1-generate-preview) */
  modelId?: string;
  /** Relación de aspecto del video ("16:9" | "9:16") */
  aspectRatio?: '16:9' | '9:16';
  /** Duración del video en segundos */
  durationSeconds?: number;
  /** Generar audio con el video (requerido para Veo 3+) */
  generateAudio?: boolean;
  /** Resolución del video ("720p" | "1080p" | "4k") */
  resolution?: '720p' | '1080p' | '4k';
  /** Número de videos a generar (1-4) */
  sampleCount?: number;
  /** Control de generación de personas */
  personGeneration?: 'allow_adult' | 'dont_allow' | 'allow_all';
  /** Prompt negativo para evitar ciertos elementos */
  negativePrompt?: string;
  /** Mejorar prompt con Gemini (solo Veo 2) */
  enhancePrompt?: boolean;
  /** Seed para reproducibilidad */
  seed?: number;
  /** URI de Google Cloud Storage para guardar resultados */
  storageUri?: string;
  /** Modo de redimensionado para imagen a video (solo Veo 3) */
  resizeMode?: 'pad' | 'crop';
  /** Calidad de compresión */
  compressionQuality?: 'optimized' | 'lossless';
  // Identity context
  /** Nombre de la identidad para consistencia facial */
  identityName?: string;
  /** Descripción de la identidad */
  identityDescription?: string;
  /** Descripciones faciales de las fotos de referencia */
  faceDescriptions?: string[];
  // Reference images
  /** Imágenes de referencia (asset o style) */
  referenceImages?: VeoReferenceImage[];
  /** Último frame para interpolación */
  lastFrame?: string;
}

/** Video generado en la respuesta de Veo */
export interface VeoGeneratedVideo {
  /** URI de Google Cloud Storage del video */
  gcsUri?: string;
  /** Video codificado en base64 */
  bytesBase64Encoded?: string;
  /** Tipo MIME del video */
  mimeType?: string;
  /** URI del video (formato anterior) */
  uri?: string;
  /** Codificación del video */
  encoding?: string;
}

/** Respuesta de la API de Veo para generación de video */
export interface VeoResponse {
  name?: string;
  done?: boolean;
  metadata?: {
    '@type': string;
  };
  response?: {
    '@type'?: string;
    /** Número de videos filtrados por políticas de IA responsable */
    raiMediaFilteredCount?: number;
    /** Razones de filtrado */
    raiMediaFilteredReasons?: string[];
    /** Videos generados (formato nuevo) */
    videos?: VeoGeneratedVideo[];
    /** Formato anterior de respuesta */
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: {
          uri?: string;
          encoding?: string;
        };
      }>;
    };
  };
  error?: {
    code: number;
    message: string;
    status: string;
    details?: Array<{
      '@type'?: string;
      reason?: string;
      metadata?: Record<string, string>;
    }>;
  };
}
