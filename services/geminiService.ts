import { GoogleGenAI, Modality } from '@google/genai';
import type { Character, GeneratedImage, Part } from '../types';

const MODEL_NAME = 'gemini-2.5-flash-image';

const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/png';
  }
};


const createApiPayload = (characters: Character[], prompt: string, aspectRatio: string): Part[] => {
  const parts: Part[] = [];

  characters.forEach(character => {
    if (character.base64 && character.file) {
      parts.push({
        inlineData: {
          mimeType: getMimeType(character.file.name),
          data: character.base64,
        },
      });
      parts.push({
        text: `This is the reference image for a character named "${character.name}".`,
      });
    }
  });

  const characterNames = characters.map(c => `"${c.name}"`).join(', ');
  
  parts.push({
    text: `
      Generate a single 4K image for the following scene: "${prompt}" featuring the characters ${characterNames}.

      **MANDATORY ART STYLE**:
      - Style: High-end comic book meets semi-realistic cartoon hybrid.
      - Line Work: Detailed and clean outlines.
      - Anatomy: Semi-realistic.
      - Expressions: Slightly exaggerated.
      - Shading: Stylized cartoon shading with dynamic shadows.
      - Colors: Graphic novel color palettes.
      - Vibe: Avoid photorealism and anime style. Ensure perfect character consistency with the provided reference images.
      - Aspect Ratio: ${aspectRatio}
    `
  });

  return parts;
};

const createRemixApiPayload = (
    characters: Character[], 
    originalImage: GeneratedImage, 
    newPrompt: string, 
    aspectRatio: string,
    maskBase64?: string | null
): Part[] => {
  const parts: Part[] = [];

  characters.forEach(character => {
    if (character.base64 && character.file) {
      parts.push({
        inlineData: {
          mimeType: getMimeType(character.file.name),
          data: character.base64,
        },
      });
      parts.push({ text: `This is a reference image for a character named "${character.name}".` });
    }
  });

  parts.push({
    inlineData: {
      mimeType: 'image/png',
      data: originalImage.base64,
    },
  });

  if (maskBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: maskBase64,
      },
    });
  }

  const characterNames = characters.map(c => `"${c.name}"`).join(', ');
  
  const promptText = maskBase64
    ? `
      This is an inpainting task. Use the provided black and white mask.
      Modify ONLY the white area of the mask based on this prompt: "${newPrompt}".
      The black area of the mask MUST remain completely unchanged.
      The image features the characters ${characterNames}.
    `
    : `
      Generate a single 4K image by remixing the provided image based on the following scene: "${newPrompt}" featuring the characters ${characterNames}.
    `;

  parts.push({
    text: `
      ${promptText}

      **MANDATORY ART STYLE & CONSISTENCY**:
      - It is CRITICAL to maintain the exact art style and character identities from the reference images and the original image being remixed.
      - Style: High-end comic book meets semi-realistic cartoon hybrid.
      - Line Work: Detailed and clean outlines.
      - Shading: Stylized cartoon shading with dynamic shadows.
      - Vibe: Avoid photorealism and anime style.
      - Aspect Ratio: ${aspectRatio}
    `
  });

  return parts;
};


export const generateStoryImages = async (
  characters: Character[],
  prompts: string[],
  aspectRatio: string
): Promise<GeneratedImage[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const generationPromises = prompts.map(prompt => {
    const parts = createApiPayload(characters, prompt, aspectRatio);
    return ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
  });

  const responses = await Promise.all(generationPromises);

  const generatedImages: GeneratedImage[] = [];
  responses.forEach((response, index) => {
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImages.push({
            id: `img-${Date.now()}-${index}`,
            base64: part.inlineData.data,
            prompt: prompts[index],
          });
        }
    }
  });
  
  if (generatedImages.length !== prompts.length) {
    console.error("Mismatch between prompts and generated images", {prompts, generatedImages});
    throw new Error("Could not generate an image for every prompt. Please try again.");
  }

  return generatedImages;
};

export const remixImage = async (
  characters: Character[],
  originalImage: GeneratedImage,
  newPrompt: string,
  aspectRatio: string,
  maskBase64?: string | null
): Promise<GeneratedImage> => {
   if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts = createRemixApiPayload(characters, originalImage, newPrompt, aspectRatio, maskBase64);
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return {
        id: `img-remix-${Date.now()}`,
        base64: part.inlineData.data,
        prompt: newPrompt,
      };
    }
  }

  throw new Error("Could not generate the remixed image. Please try again.");
};
