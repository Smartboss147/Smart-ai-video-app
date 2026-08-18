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
  const [uploadStatus, setUploadStatus] = useState<string>('Uploading video...');
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
    // Basic frontend validation - just check if it claims to be a video or has a video-like extension
    const isLikelyVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|avi|mkv|mpeg|mpg|m4v|3gp|3g2|wmv|flv|ogv|ts|mts|m2ts)$/i);
    
    if (!isLikelyVideo) {
      setError('This file does not appear to be a supported video format. Please select a video file.');
      return;
    }

    // Validate size for Vercel Serverless Function Limits (4.5MB)
    const MAX_FILE_SIZE = 4.5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large for the current serverless environment (max 4.5MB). Please upload a smaller video.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError(null);
    setUploading(true);
    setUploadStatus('Uploading video...');
    setProgress(5);

    const formData = new FormData();
    const safeFilename = (file.name || 'upload.mp4').replace(/[^\x20-\x7E]/g, '').trim() || 'upload.mp4';
    const safeToken = token.replace(/[^\x20-\x7E]/g, '').trim();

    console.log("[UPLOAD_VIEW] Safe filename:", safeFilename);

    // Safari Fix: Convert iOS File object to a raw Blob to strip buggy WebKit File metadata 
    const safeBlob = new Blob([file], { type: file.type || 'video/mp4' });
    formData.append('video', safeBlob, safeFilename);

    try {
      // Simulate smooth progress increments during upload
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 60) return prev + 5;
          if (prev < 85) {
            setUploadStatus('Analyzing video format and structure...');
            return prev + 2;
          }
          if (prev < 95) {
            setUploadStatus('Preparing compatible preview...');
            return prev + 1;
          }
          return prev;
        });
      }, 400);

      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/videos/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${safeToken}`
        },
        body: formData
      });

      clearInterval(interval);
      setProgress(100);
      setUploadStatus('Processing complete!');

      // Safe JSON Parsing Fix
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const textResponse = await res.text();
        console.error("[UPLOAD_VIEW] Non-JSON response:", textResponse.substring(0, 200));
        
        if (res.status === 413) {
          throw new Error("File is too large for the server to process. Please upload a smaller video (under 4.5MB).");
        } else {
          throw new Error(`Server returned an invalid response (Status ${res.status}). Please try again later.`);
        }
      }

      if (res.ok && data.project) {
        setTimeout(() => {
          onUploadSuccess(data.project);
        }, 800);
      } else {
        setError(`Server Error: ${data.error || 'Upload failed'}`);
        setUploading(false);
      }
    } catch (err: any) {
      console.error("[UPLOAD_VIEW] Exception:", err);
      setError(`Exception: ${err?.name || 'Error'} - ${err?.message}`);
      setUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-xl w-full p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 mb-6">
          <Upload className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-white">Add Video</h2>
        <p className="text-sm text-slate-400 mt-2 mb-8">
          Upload a video in any supported format. We’ll automatically prepare it for editing.
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
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 transition-all ${
            uploading ? 'cursor-wait' : 'cursor-pointer hover:border-slate-700 hover:bg-slate-950/50'
          } ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 bg-slate-950/50'
          }`}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>{uploadStatus}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">Do not close this window while we prepare your studio</p>
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
          accept="video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};
