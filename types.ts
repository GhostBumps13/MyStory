export interface Character {
  id: number;
  name: string;
  file: File | null;
  base64: string | null;
}

export interface GeneratedImage {
  id: string;
  base64: string;
  prompt: string;
}

export interface ViewingImage extends GeneratedImage {
  index: number;
}

export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}