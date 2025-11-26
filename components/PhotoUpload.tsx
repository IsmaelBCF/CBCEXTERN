import React, { useState } from 'react';
import { IconCamera } from './ui/Icons';

interface PhotoUploadProps {
  onPhotosChange: (photos: string[]) => void;
  label: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotosChange, label }) => {
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPreviews: string[] = [];
      const files = Array.from(e.target.files);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            newPreviews.push(reader.result);
            if (newPreviews.length === files.length) {
              const updated = [...previews, ...newPreviews];
              setPreviews(updated);
              onPhotosChange(updated);
            }
          }
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removePhoto = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        {previews.map((src, idx) => (
          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img src={src} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
            <button 
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
            </button>
          </div>
        ))}
        
        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors">
          <IconCamera className="w-6 h-6 text-slate-400 mb-1" />
          <span className="text-xs text-slate-500 font-medium">Adicionar</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
};

export default PhotoUpload;