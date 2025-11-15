import React from 'react';
import { CharacterUploader } from './CharacterUploader';
import { GenerateIcon, PlusIcon, TrashIcon } from './icons';
import type { Character } from '../types';

interface ControlPanelProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  aspectRatio: string;
  setAspectRatio: (value: string) => void;
  customRatio: { width: number, height: number };
  setCustomRatio: (value: { width: number, height: number }) => void;
  prompts: string[];
  setPrompts: (value: string[] | ((prev: string[]) => string[])) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  characters,
  setCharacters,
  aspectRatio,
  setAspectRatio,
  customRatio,
  setCustomRatio,
  prompts,
  setPrompts,
  onGenerate,
  isLoading,
}) => {

  const handleCharacterChange = (id: number, updatedCharacter: Partial<Character>) => {
    setCharacters(prev =>
      prev.map(char => (char.id === id ? { ...char, ...updatedCharacter } : char))
    );
  };

  const handlePromptChange = (index: number, value: string) => {
    setPrompts(prev => {
        const newPrompts = [...prev];
        newPrompts[index] = value;
        return newPrompts;
    });
  };

  const addPrompt = () => {
    if(prompts.length < 10) {
        setPrompts(prev => [...prev, '']);
    }
  };

  const removePrompt = (index: number) => {
    if(prompts.length > 1) {
        setPrompts(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const aspectRatioOptions = ["16:9", "9:16", "1:1", "4:3", "Custom"];

  return (
    <div className="bg-gray-900/50 border border-red-500/30 rounded-lg p-4 md:p-6 space-y-6 sticky top-24 shadow-lg shadow-red-500/10">
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Character References</h2>
        <div className="space-y-4">
          {characters.map((char) => (
            <CharacterUploader
              key={char.id}
              character={char}
              onCharacterChange={handleCharacterChange}
            />
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Aspect Ratio</h2>
        <div className="grid grid-cols-3 gap-2">
            {aspectRatioOptions.map(ratio => (
                 <button 
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${aspectRatio === ratio ? 'bg-red-600 text-white font-semibold shadow-[0_0_8px_rgba(239,68,68,0.7)]' : 'bg-gray-800 hover:bg-gray-700'}`}>
                    {ratio}
                 </button>
            ))}
        </div>
        {aspectRatio === 'Custom' && (
            <div className="mt-3 flex items-center gap-2">
                <input 
                    type="number" 
                    value={customRatio.width}
                    onChange={(e) => setCustomRatio({...customRatio, width: parseInt(e.target.value) || 1})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center"
                    min="1"
                />
                <span className="text-gray-400">:</span>
                 <input 
                    type="number" 
                    value={customRatio.height}
                    onChange={(e) => setCustomRatio({...customRatio, height: parseInt(e.target.value) || 1})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center"
                    min="1"
                />
            </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-white">Prompt List</h2>
           <button onClick={addPrompt} disabled={prompts.length >= 10} className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 disabled:text-gray-500 transition-colors">
            <PlusIcon /> Add
          </button>
        </div>
        <div className="space-y-3">
            {prompts.map((prompt, index) => (
                <div key={index} className="flex items-center gap-2">
                    <label className="text-gray-400 text-sm w-16">P{index + 1}:</label>
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => handlePromptChange(index, e.target.value)}
                        placeholder={`Scene ${index + 1} description...`}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    />
                    <button onClick={() => removePrompt(index)} disabled={prompts.length <= 1} className="text-gray-500 hover:text-red-500 disabled:text-gray-700 disabled:cursor-not-allowed transition-colors">
                        <TrashIcon />
                    </button>
                </div>
            ))}
        </div>
      </div>
      
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed disabled:scale-100 shadow-[0_0_10px_rgba(239,68,68,0.5)] hover:shadow-[0_0_20px_rgba(239,68,68,0.8)]"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <GenerateIcon />
            GENERATE STORY IMAGES
          </>
        )}
      </button>
    </div>
  );
};