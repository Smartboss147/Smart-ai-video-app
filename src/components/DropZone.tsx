import React, { useState } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  title?: string;
  subtitle?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileDrop, title = "Drag & drop video", subtitle = "or click to upload" }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) onFileDrop(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer ${
        isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <Upload className="w-8 h-8 text-indigo-400 mb-2" />
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
};
