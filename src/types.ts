export interface Identity {
  id: string;
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
}

export interface GeneratedImage {
  id: string;
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
