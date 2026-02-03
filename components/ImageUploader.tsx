import React, { useRef, useState } from 'react';
import { ImageFile } from '../types';
import { Upload, X, Image as ImageIcon, Box } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  image: ImageFile | null;
  onImageChange: (image: ImageFile | null) => void;
  id: string;
  accept?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  image, 
  onImageChange, 
  id,
  accept = "image/*" 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (accept.includes('image') && !file.type.startsWith('image/')) {
         if (!file.name.match(/\.(glb|gltf)$/)) return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
        onDragLeave={() => setIsHovering(false)}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer 
          h-56 w-full
          flex flex-col items-center justify-center 
          transition-all duration-500 ease-out
          overflow-hidden
          border
          ${isHovering 
            ? 'scale-[1.01] bg-white/10 border-white shadow-lg shadow-white/5' 
            : 'bg-white/5 border-slate-800 hover:border-slate-600'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept={accept} 
          className="hidden" 
          id={id}
        />

        {/* Corner Accents for "Frame" look */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-600 group-hover:border-white transition-colors"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-600 group-hover:border-white transition-colors"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-600 group-hover:border-white transition-colors"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-600 group-hover:border-white transition-colors"></div>

        {image ? (
          <>
            <img 
              src={image.previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-start justify-end p-2">
              <button 
                onClick={clearImage}
                className="bg-black/50 hover:bg-black p-2 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 border border-white/20"
              >
                <X size={16} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm px-4 py-2 border-t border-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-[10px] font-mono text-slate-300 truncate">{image.file.name}</p>
            </div>
          </>
        ) : (
          <div className="text-center p-6 flex flex-col items-center gap-3">
            <div className={`
              p-4 rounded-full border border-slate-700 bg-white/5
              transition-all duration-500 group-hover:scale-110 group-hover:border-slate-500 group-hover:bg-white/10
            `}>
              {accept.includes('glb') ? <Box size={20} className="text-slate-400 group-hover:text-white" /> : <Upload size={20} className="text-slate-400 group-hover:text-white" />}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                Select File
              </p>
              <p className="text-[10px] text-slate-600 mt-1 font-light group-hover:text-slate-500">
                {accept === "image/*" ? "JPG or PNG" : "Images or 3D Models"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};