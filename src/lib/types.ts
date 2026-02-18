export interface GenerateRequest {
  prompt: string;
  aspectRatio: string;
  resolution: string;
  mode: "text-to-image";
}

export interface ErrorResponse {
  error: string;
}

export interface GenerateSuccessMetadata {
  textResponse?: string;
  mimeType: string;
  contentLength: number;
}

// Image upload state for image-to-image editing flow
export interface ImageUploadState {
  dataUrl: string; // Full data URL: "data:image/png;base64,..."
  fileName: string;
  fileSize: number; // Bytes
  mimeType: string; // "image/jpeg" | "image/png" | "image/webp"
}
