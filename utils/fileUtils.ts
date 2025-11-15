
import type { GeneratedImage } from '../types';

declare const JSZip: any;

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const downloadImage = (base64: string, filename: string) => {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


const getFormattedDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day}${month}${year}`;
};

export const downloadAllAsZip = async (images: GeneratedImage[]): Promise<void> => {
  if (typeof JSZip === 'undefined') {
    console.error('JSZip library is not loaded.');
    alert('Could not download all images. JSZip library is missing.');
    return;
  }
  const zip = new JSZip();
  const date = getFormattedDate();

  images.forEach((image, index) => {
    const filename = `${String(index + 1).padStart(3, '0')}_${date}.png`;
    zip.file(filename, image.base64, { base64: true });
  });

  const content = await zip.generateAsync({ type: 'blob' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `MY_Story_${date}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
