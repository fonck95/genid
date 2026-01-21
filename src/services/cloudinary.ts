// Cloudinary configuration - hardcoded for testing
const CLOUDINARY_CLOUD_NAME = 'diaaseefm';
const CLOUDINARY_UPLOAD_PRESET = 'carendary';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Sube una imagen a Cloudinary desde un data URL (base64)
 */
export async function uploadToCloudinary(
  dataUrl: string,
  folder?: string
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', dataUrl);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error subiendo a Cloudinary: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  };
}

/**
 * Sube una imagen desde un File object
 */
export async function uploadFileToCloudinary(
  file: File,
  folder?: string
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error subiendo a Cloudinary: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  };
}

/**
 * Genera URL optimizada de Cloudinary con transformaciones
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: number | 'auto';
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);

  const transformStr = transformations.join(',');

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformStr}/${publicId}`;
}

/**
 * Genera thumbnail URL
 */
export function getThumbnailUrl(publicId: string, size: number = 150): string {
  return getOptimizedUrl(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    quality: 80
  });
}

/**
 * Genera URL de imagen de alta calidad
 */
export function getFullImageUrl(publicId: string): string {
  return getOptimizedUrl(publicId, {
    quality: 'auto',
    format: 'auto'
  });
}
