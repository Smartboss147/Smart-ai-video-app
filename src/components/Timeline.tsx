import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Scissors, Copy, Trash2 } from 'lucide-react';
import { Project, Scene } from '../types';

interface TimelineProps {
  project: Project;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  project, 
  currentTime, 
  duration, 
  isPlaying, 
  onPlayPause, 
  onSeek 
}) => {
  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-64 bg-slate-900 border-t border-slate-800 flex flex-col select-none">
      {/* Timeline Controls */}
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <button onClick={() => onSeek(0)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={onPlayPause} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-2"></div>
          <span className="text-xs font-mono text-slate-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Split">
            <Scissors className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Copy">
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tracks Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none"
          style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 clip-playhead"></div>
        </div>

        {/* Video Track */}
        <div className="flex h-16 border-b border-slate-800/50">
          <div className="w-32 bg-slate-800/50 flex-shrink-0 flex items-center px-3 border-r border-slate-800">
            <span className="text-xs font-medium text-slate-400">VIDEO</span>
          </div>
          <div className="flex-1 relative bg-slate-900/50 p-2">
            <div className="absolute top-2 bottom-2 left-0 right-0 bg-indigo-900/30 border border-indigo-500/50 rounded flex overflow-hidden">
               {/* Placeholder segments */}
               <div className="h-full w-1/3 border-r border-indigo-500/30 bg-indigo-800/20"></div>
               <div className="h-full w-1/3 border-r border-indigo-500/30 bg-indigo-800/20"></div>
               <div className="h-full w-1/3 bg-indigo-800/20"></div>
            </div>
          </div>
        </div>

        {/* Audio Track */}
        <div className="flex h-16 border-b border-slate-800/50">
          <div className="w-32 bg-slate-800/50 flex-shrink-0 flex items-center px-3 border-r border-slate-800">
            <span className="text-xs font-medium text-slate-400">AUDIO</span>
          </div>
          <div className="flex-1 relative bg-slate-900/50 p-2">
            <div className="absolute top-2 bottom-2 left-0 right-0 bg-emerald-900/30 border border-emerald-500/50 rounded flex items-center justify-center opacity-50">
              <svg className="w-full h-8 text-emerald-500/50 preserve-aspect-none" viewBox="0 0 100 20">
                <path d="M0 10 Q 5 0 10 10 T 20 10 T 30 10 T 40 10 T 50 10 T 60 10 T 70 10 T 80 10 T 90 10 T 100 10" stroke="currentColor" fill="none" strokeWidth="0.5"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Subtitles Track */}
        <div className="flex h-12 border-b border-slate-800/50">
          <div className="w-32 bg-slate-800/50 flex-shrink-0 flex items-center px-3 border-r border-slate-800">
            <span className="text-xs font-medium text-slate-400">SUBTITLES</span>
          </div>
          <div className="flex-1 relative bg-slate-900/50 p-2">
          </div>
        </div>
      </div>
    </div>
  );
};
