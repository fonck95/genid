export interface Identity {
  id: string;
  deviceId: string;
  name: string;
  description: string;
  /** Contexto detallado que define la personalidad, sesgos y características de la identidad */
  context?: string;
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

/** Tipo de etnia para generación de rostros */
export type FaceEthnicity =
  | 'afroamerican'
  | 'latin'
  | 'caucasian'
  | 'asian'
  | 'middleeastern'
  | 'southasian'
  | 'mixed';

/** Tipo de variante étnica (alias para compatibilidad) */
export type FaceVariantType = FaceEthnicity;

/** Rango de edad para generación de rostros */
export type FaceAgeRange =
  | '18-25'
  | '26-35'
  | '36-45'
  | '46-55'
  | '56+';

/** Sexo biológico para generación de rostros */
export type FaceSex = 'female' | 'male';

/** Accesorios faciales disponibles */
export type FacialAccessory =
  | 'glasses'
  | 'sunglasses'
  | 'earrings'
  | 'nose_piercing'
  | 'lip_piercing'
  | 'eyebrow_piercing'
  | 'headscarf'
  | 'hat'
  | 'headband'
  | 'beard'
  | 'mustache'
  | 'goatee';

/** Color de iris/ojos */
export type IrisColor =
  | 'brown'
  | 'dark_brown'
  | 'light_brown'
  | 'hazel'
  | 'green'
  | 'blue'
  | 'gray'
  | 'amber';

/** Color de cabello */
export type HairColor =
  | 'black'
  | 'dark_brown'
  | 'medium_brown'
  | 'light_brown'
  | 'blonde'
  | 'platinum_blonde'
  | 'red'
  | 'auburn'
  | 'gray'
  | 'white';

/** Tipo/textura de cabello */
export type HairType =
  | 'straight'
  | 'wavy'
  | 'curly'
  | 'coily'
  | 'bald'
  | 'short_cropped';

/** Opciones de personalización para generar una variante */
export interface FaceVariantOptions {
  ethnicity: FaceEthnicity;
  ageRange: FaceAgeRange;
  sex: FaceSex;
  accessories: FacialAccessory[];
  /** Color de iris/ojos (opcional - si no se especifica, se adapta a la etnia) */
  irisColor?: IrisColor;
  /** Color de cabello (opcional - si no se especifica, se adapta a la etnia) */
  hairColor?: HairColor;
  /** Tipo/textura de cabello (opcional - si no se especifica, se adapta a la etnia) */
  hairType?: HairType;
}

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
  /** Opciones usadas para generar esta variante */
  options?: FaceVariantOptions;
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
  /** Variante generada (ahora es una sola) */
  variant: FaceVariant;
  /** @deprecated Mantener para compatibilidad con datos antiguos */
  variants?: FaceVariant[];
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
    finishReason?: string;
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
  /** Tipo de generación de video */
  generationType?: 'image2video' | 'motion-control';
  /** URL del video de referencia de movimiento (solo para motion-control) */
  motionVideoUrl?: string;
  /** Orientación del personaje (solo para motion-control) */
  characterOrientation?: 'image' | 'video';
  /** Timestamp de creación */
  createdAt: number;
}

// === TIPOS PARA MOTION CONTROL (KLING) ===

/** Orientación del personaje en Motion Control */
export type MotionControlOrientation = 'image' | 'video';

/** Opciones para Motion Control */
export interface MotionControlOptions {
  /** Texto prompt opcional */
  prompt?: string;
  /** Mantener sonido original del video */
  keep_original_sound?: 'yes' | 'no';
  /** Orientación del personaje */
  character_orientation: MotionControlOrientation;
  /** Modo de generación */
  mode: 'std' | 'pro';
}

// === TIPOS PARA FEED DE COMENTARIOS ===

/** Comentario generado por una identidad en el feed */
export interface FeedComment {
  id: string;
  /** ID de la identidad que "escribe" el comentario */
  identityId: string;
  /** Nombre de la identidad */
  identityName: string;
  /** Avatar/thumbnail de la identidad */
  identityThumbnail?: string;
  /** Texto del comentario generado */
  content: string;
  /** Tipo de reacción/sentimiento del comentario */
  sentiment: 'positive' | 'negative' | 'neutral' | 'controversial' | 'humorous';
  /** Timestamp de generación */
  createdAt: number;
  /** Indica si es una respuesta a otro comentario (para hilos) */
  isReplyTo?: string;
  /** Índice del comentario en el hilo (para mostrar orden) */
  threadIndex?: number;
}

/** Comentario existente de una persona real (para contexto) */
export interface ExistingComment {
  id: string;
  /** Nombre/username del autor */
  authorName: string;
  /** Texto del comentario */
  content: string;
  /** Es destacado/popular */
  isHighlighted?: boolean;
}

/** Imagen del feed (publicación o captura de comentarios) */
export interface FeedImage {
  id: string;
  /** URL de la imagen */
  url: string;
  /** Thumbnail de la imagen */
  thumbnail: string;
  /** Tipo de imagen */
  type: 'post' | 'comments_screenshot' | 'other';
  /** Descripción opcional */
  description?: string;
}

/** Sesión de feed con imagen y comentarios */
export interface FeedSession {
  id: string;
  deviceId: string;
  /** URL de la imagen del post/publicación (legacy) */
  postImageUrl: string;
  /** Thumbnail de la imagen (legacy) */
  postImageThumbnail: string;
  /** Múltiples imágenes del feed */
  images?: FeedImage[];
  /** Descripción opcional del post */
  postDescription?: string;
  /** Comentarios existentes de personas reales */
  existingComments?: ExistingComment[];
  /** Comentarios generados */
  comments: FeedComment[];
  /** Timestamp de creación */
  createdAt: number;
}
