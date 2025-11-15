import React, { useState, useCallback, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ResultsPanel } from './components/ResultsPanel';
import type { Character, GeneratedImage, ViewingImage } from './types';
import { generateStoryImages, remixImage } from './services/geminiService';
import { downloadAllAsZip } from './utils/fileUtils';
import { CloseIcon, RemixIcon, BrushIcon } from './components/icons';
import { MaskEditor, MaskEditorRef } from './components/MaskEditor';


const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>(
    Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      name: `Character Ref ${i + 1}`,
      file: null,
      base64: null,
    }))
  );
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [customRatio, setCustomRatio] = useState({ width: 16, height: 9 });
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewingImage, setViewingImage] = useState<ViewingImage | null>(null);
  const [remixingImage, setRemixingImage] = useState<ViewingImage | null>(null);
  const [remixPrompt, setRemixPrompt] = useState('');
  const [isRemixing, setIsRemixing] = useState(false);
  const [maskBase64, setMaskBase64] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(40);
  const maskEditorRef = useRef<MaskEditorRef>(null);

  const handleGenerate = useCallback(async () => {
    const activeCharacters = characters.filter((c) => c.file && c.base64);
    if (activeCharacters.length === 0) {
      setError('Please upload at least one character reference image.');
      return;
    }

    const promptList = prompts.map((p) => p.trim()).filter(Boolean);

    if (promptList.length === 0) {
      setError('Please enter at least one prompt.');
      return;
    }
    if (promptList.length > 10) {
      setError('You can process a maximum of 10 prompts at a time.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    const finalAspectRatio = aspectRatio === 'Custom' 
      ? `${customRatio.width}:${customRatio.height}` 
      : aspectRatio;

    try {
      const images = await generateStoryImages(activeCharacters, promptList, finalAspectRatio);
      setGeneratedImages(images);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during image generation.');
    } finally {
      setIsLoading(false);
    }
  }, [characters, prompts, aspectRatio, customRatio]);

  const handleRemix = useCallback(async () => {
    if (!remixingImage) return;

    const activeCharacters = characters.filter((c) => c.file && c.base64);
     if (activeCharacters.length === 0) {
      alert('Cannot remix without at least one character reference.');
      return;
    }

    setIsRemixing(true);
    setError(null);
    
    const finalAspectRatio = aspectRatio === 'Custom' 
      ? `${customRatio.width}:${customRatio.height}` 
      : aspectRatio;
      
    try {
      const originalImage = generatedImages[remixingImage.index];
      const newImage = await remixImage(activeCharacters, originalImage, remixPrompt, finalAspectRatio, maskBase64);

      setGeneratedImages(prev => {
        const newImages = [...prev];
        newImages[remixingImage.index] = newImage;
        return newImages;
      });
      
      setRemixingImage(null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'An unknown error occurred during remix.');
    } finally {
      setIsRemixing(false);
      setMaskBase64(null);
    }
  }, [remixingImage, remixPrompt, characters, generatedImages, aspectRatio, customRatio, maskBase64]);

  const handleDownloadAll = useCallback(() => {
    if (generatedImages.length > 0) {
      downloadAllAsZip(generatedImages);
    }
  }, [generatedImages]);

  const openRemixModal = (image: GeneratedImage, index: number) => {
    setRemixingImage({ ...image, index });
    setRemixPrompt(image.prompt);
    setMaskBase64(null);
    setViewingImage(null); // Close viewer if open
  }

  const handleClearMask = () => {
    setMaskBase64(null);
    maskEditorRef.current?.clear();
  };

  const renderImageViewer = () => {
    if (!viewingImage) return null;
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
        <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
          <img src={`data:image/png;base64,${viewingImage.base64}`} alt={viewingImage.prompt} className="w-full h-auto object-contain max-h-[90vh] rounded-lg"/>
          <button onClick={() => setViewingImage(null)} className="absolute -top-4 -right-4 bg-gray-800 text-white rounded-full p-2 hover:bg-red-500 transition-colors">
            <CloseIcon />
          </button>
           <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 rounded-b-lg flex justify-between items-center">
            <p className="text-sm flex-1">{viewingImage.prompt}</p>
            <button onClick={() => openRemixModal(viewingImage, viewingImage.index)} className="ml-4 flex items-center gap-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors hover:bg-red-500">
              <RemixIcon /> Remix
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRemixModal = () => {
    if (!remixingImage) return null;
    return (
       <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setRemixingImage(null)}>
          <div className="bg-gray-900 border border-red-500/30 rounded-lg shadow-2xl p-6 w-full max-w-5xl flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Remix Image</h3>
              <button onClick={() => setRemixingImage(null)} className="text-gray-400 hover:text-white"><CloseIcon /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <p className="text-gray-400 text-sm">
                  Draw on the image to select an area to change (inpainting), or simply modify the prompt for a full-image remix.
                </p>
                <MaskEditor
                  ref={maskEditorRef}
                  imageUrl={`data:image/png;base64,${remixingImage.base64}`}
                  onMaskChange={setMaskBase64}
                  brushSize={brushSize}
                />
                <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-md">
                    <BrushIcon />
                    <span className="text-sm text-gray-300">Brush Size:</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={brushSize}
                      onChange={e => setBrushSize(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <button onClick={handleClearMask} className="text-sm text-red-400 hover:text-red-300 whitespace-nowrap">Clear Mask</button>
                </div>
              </div>

              <div className="w-full flex flex-col">
                <label htmlFor="remix-prompt" className="text-white font-semibold mb-2">Prompt</label>
                <textarea
                  id="remix-prompt"
                  value={remixPrompt}
                  onChange={(e) => setRemixPrompt(e.target.value)}
                  rows={8}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-white flex-grow"
                  placeholder={maskBase64 ? "Describe the change for the selected area..." : "Describe your changes for the whole image..."}
                />
                <div className="mt-4 flex justify-end gap-3">
                   <button onClick={() => setRemixingImage(null)} className="py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">Cancel</button>
                   <button onClick={handleRemix} disabled={isRemixing} className="py-2 px-6 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors disabled:bg-red-800 disabled:cursor-not-allowed flex items-center justify-center">
                      {isRemixing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Remixing...
                        </>
                      ) : 'Generate Remix'}
                   </button>
                </div>
              </div>
            </div>
          </div>
       </div>
    );
  };


  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans">
      <header className="bg-black/80 backdrop-blur-sm sticky top-0 z-20 border-b border-red-500/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            MY Story <span className="text-red-500">-</span> Consistent Character Story Creator
          </h1>
          <p className="text-gray-400 mt-1">AI-powered comic style story generation</p>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <ControlPanel
              characters={characters}
              setCharacters={setCharacters}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              customRatio={customRatio}
              setCustomRatio={setCustomRatio}
              prompts={prompts}
              setPrompts={setPrompts}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
            <ResultsPanel
              images={generatedImages}
              isLoading={isLoading}
              error={error}
              onDownloadAll={handleDownloadAll}
              onView={(image, index) => setViewingImage({ ...image, index })}
              onRemix={(image, index) => openRemixModal(image, index)}
            />
          </div>
        </div>
      </main>
      {renderImageViewer()}
      {renderRemixModal()}
    </div>
  );
};

export default App;
