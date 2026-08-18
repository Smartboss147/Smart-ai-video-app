import React, { useState, useRef } from 'react';
import { Upload, Film, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VideoUploaderProps {
  token: string;
  onUploadSuccess: (project: any) => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ token, onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const processAndUploadFile = async (file: File) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|m4v)$/i)) {
      setError('Unsupported video format. Please upload MP4, MOV, or WebM.');
      return;
    }

    // Validate size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError('File size exceeds 500MB limit.');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append('video', file);

    try {
      // Simulate smooth progress increments during upload
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 300);

      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(interval);
      setProgress(100);

      const data = await res.json();
      if (res.ok && data.project) {
        setTimeout(() => {
          onUploadSuccess(data.project);
        }, 500);
      } else {
        setError(data.error || 'Upload failed');
        setUploading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Network error during upload');
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-xl w-full p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 mb-6">
          <Upload className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-white">Upload a Video to Begin</h2>
        <p className="text-sm text-slate-400 mt-2 mb-8">
          Drag and drop your video file here, or click to browse. Supports MP4, MOV, and WebM up to 500MB.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-center space-x-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
          }`}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Uploading and analyzing video...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">Securely uploading to AetherCut cloud storage</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Film className="w-10 h-10 text-indigo-400 mx-auto" />
              <p className="text-sm font-medium text-white">Drag & drop your video file here</p>
              <p className="text-xs text-slate-500">or click to browse from your device</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};
