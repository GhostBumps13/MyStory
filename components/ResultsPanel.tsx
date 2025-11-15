import React from 'react';
import type { GeneratedImage } from '../types';
import { downloadImage } from '../utils/fileUtils';
import { DownloadIcon, RemixIcon } from './icons';

interface ResultsPanelProps {
  images: GeneratedImage[];
  isLoading: boolean;
  error: string | null;
  onDownloadAll: () => void;
  onView: (image: GeneratedImage, index: number) => void;
  onRemix: (image: GeneratedImage, index: number) => void;
}

const ImageCard: React.FC<{ image: GeneratedImage, index: number, onView: () => void, onRemix: () => void }> = ({ image, index, onView, onRemix }) => {
  const handleDownload = () => {
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${image.prompt.slice(0, 20).replace(/\s/g, '_')}_${date}.png`;
    downloadImage(image.base64, filename);
  };
  
  return (
    <div className="group relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-red-500/30 hover:scale-[1.02]">
      <img
        src={`data:image/png;base64,${image.base64}`}
        alt={image.prompt}
        className="w-full h-full object-cover cursor-pointer"
        onClick={onView}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <p className="text-white text-xs line-clamp-2 mb-2">{image.prompt}</p>
        <div className="flex justify-end gap-2">
            <button
              onClick={onRemix}
              className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white p-2 text-xs rounded-md hover:bg-red-500 transition-colors"
              title="Remix Image"
            >
              <RemixIcon /> Remix
            </button>
            <button
              onClick={handleDownload}
              className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-md hover:bg-red-500 transition-colors"
              title="Download Image"
            >
              <DownloadIcon />
            </button>
        </div>
      </div>
    </div>
  );
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  images,
  isLoading,
  error,
  onDownloadAll,
  onView,
  onRemix,
}) => {
  const hasImages = images.length > 0;

  return (
    <div className="bg-gray-900/50 border border-red-500/30 rounded-lg p-4 md:p-6 min-h-[60vh] shadow-lg shadow-red-500/10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Results</h2>
        {hasImages && (
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            <DownloadIcon />
            Download All
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
          <svg className="animate-spin h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg text-gray-300">Generating your story... this may take a moment.</p>
          <p className="text-gray-500 text-sm">Please remain on this page.</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-full min-h-[50vh]">
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                <p className="font-bold">Generation Failed</p>
                <p className="text-sm">{error}</p>
            </div>
        </div>
      )}

      {!isLoading && !error && !hasImages && (
        <div className="flex items-center justify-center h-full min-h-[50vh] text-center border-2 border-dashed border-gray-700 rounded-lg">
            <div className="text-gray-600">
                <p className="text-xl font-semibold">Your generated story will appear here.</p>
                <p>Upload characters, add prompts, and click "Generate" to begin.</p>
            </div>
        </div>
      )}
      
      {hasImages && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <ImageCard 
                key={image.id} 
                image={image} 
                index={index} 
                onView={() => onView(image, index)}
                onRemix={() => onRemix(image, index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};