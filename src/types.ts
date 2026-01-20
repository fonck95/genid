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
