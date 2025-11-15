import React, { useRef, useState, useEffect } from 'react';
import type { Character } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { UploadIcon } from './icons';

interface CharacterUploaderProps {
  character: Character;
  onCharacterChange: (id: number, updatedCharacter: Partial<Character>) => void;
}

export const CharacterUploader: React.FC<CharacterUploaderProps> = ({
  character,
  onCharacterChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (character.file) {
      const objectUrl = URL.createObjectURL(character.file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [character.file]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        onCharacterChange(character.id, { file, base64 });
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onCharacterChange(character.id, { name: event.target.value });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-3">
      <div
        onClick={handleUploadClick}
        className="w-16 h-16 rounded-md bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-red-500 transition-colors overflow-hidden"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {preview ? (
          <img src={preview} alt="Character preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400">
            <UploadIcon />
          </div>
        )}
      </div>
      <input
        type="text"
        value={character.name}
        onChange={handleNameChange}
        className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
      />
    </div>
  );
};