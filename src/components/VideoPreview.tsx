import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Tv, 
  Sliders, 
  Eye, 
  Film,
  Sparkles,
  Info,
  Clock,
  Gauge,
  Scissors,
  Bookmark,
  Check,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { VideoVersion } from '../types';

interface VideoPreviewProps {
  videoUrl: string;
  originalVideoUrl?: string;
  versions?: VideoVersion[];
  currentVersionId?: string;
  onSelectVersion?: (versionId: string) => void;
  fps?: number;
  resolution?: string;
  aspectRatio?: string;
  title?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  // Range Segment Definition Props
  startTime?: number;
  endTime?: number;
  onSegmentChange?: (startTime: number, endTime: number) => void;
  enableSegmentTrimming?: boolean;
}

// Utility: format seconds into SMPTE timecode (HH:MM:SS:FF)
export const formatTimecode = (seconds: number, fps: number = 30): string => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * fps);
  
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  const ff = frames.toString().padStart(2, '0');
  
  return h > 0 ? `${hh}:${mm}:${ss}:${ff}` : `${mm}:${ss}:${ff}`;
};

// Utility: simple MM:SS formatting
export const formatSimpleTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
};

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  originalVideoUrl,
  versions = [],
  currentVersionId,
  onSelectVersion,
  fps = 30,
  resolution = '1080p',
  aspectRatio = '16:9',
  title,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onPlayPause,
  onSeek,
  className = '',
  videoRef: externalVideoRef,
  startTime: propStartTime,
  endTime: propEndTime,
  onSegmentChange,
  enableSegmentTrimming = true
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);

  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showInfoOverlay, setShowInfoOverlay] = useState<boolean>(false);
  const [hoverPosition, setHoverPosition] = useState<{ time: number; frame: number; percent: number } | null>(null);
  const [actualDimensions, setActualDimensions] = useState<{ width: number; height: number } | null>(null);

  // Segment In/Out Timestamps State
  const [segmentStart, setSegmentStart] = useState<number>(propStartTime !== undefined ? propStartTime : 0);
  const [segmentEnd, setSegmentEnd] = useState<number>(
    propEndTime !== undefined ? propEndTime : (duration > 0 ? duration : 10)
  );
  const [isSegmentLoopActive, setIsSegmentLoopActive] = useState<boolean>(false);
  const [showSegmentControls, setShowSegmentControls] = useState<boolean>(true);

  const effectiveFps = fps > 0 ? fps : 30;
  const currentFrame = Math.floor(currentTime * effectiveFps);
  const totalFrames = duration > 0 ? Math.floor(duration * effectiveFps) : 0;

  // Sync props to internal segment timestamps
  useEffect(() => {
    if (propStartTime !== undefined) {
      setSegmentStart(propStartTime);
    }
  }, [propStartTime]);

  useEffect(() => {
    if (propEndTime !== undefined) {
      setSegmentEnd(propEndTime);
    } else if (duration > 0 && segmentEnd === 10 && segmentStart === 0) {
      setSegmentEnd(duration);
    }
  }, [propEndTime, duration]);

  // Handler to update segment and notify parent
  const updateSegment = useCallback((newStart: number, newEnd: number) => {
    const frameStep = 1 / effectiveFps;
    const maxDuration = duration > 0 ? duration : 10;
    
    let safeStart = Math.max(0, Math.min(newStart, maxDuration - frameStep));
    let safeEnd = Math.max(safeStart + frameStep, Math.min(newEnd, maxDuration));

    setSegmentStart(safeStart);
    setSegmentEnd(safeEnd);

    if (onSegmentChange) {
      onSegmentChange(safeStart, safeEnd);
    }
  }, [duration, effectiveFps, onSegmentChange]);

  // Sync internal HTML5 video state with props
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && onDurationChange) {
        onDurationChange(video.duration);
        // If segment end was unset, initialize it
        if (propEndTime === undefined && segmentEnd <= 10) {
          updateSegment(segmentStart, video.duration);
        }
      }
      setActualDimensions({
        width: video.videoWidth,
        height: video.videoHeight
      });
      setIsBuffering(false);
    };

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        onTimeUpdate(video.currentTime);

        // If loop segment is active, wrap around when reaching segmentEnd
        if (isSegmentLoopActive && video.currentTime >= segmentEnd) {
          video.currentTime = segmentStart;
          onSeek(segmentStart);
        }
      }
    };

    const handleSeeking = () => setIsSeeking(true);
    const handleSeeked = () => setIsSeeking(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleRateChange = () => {
      setPlaybackRate(video.playbackRate);
    };
    const handleEnded = () => {
      if (isSegmentLoopActive) {
        video.currentTime = segmentStart;
        video.play().catch(() => {});
      } else if (!isLooping && isPlaying) {
        onPlayPause();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoRef, isSeeking, isLooping, isPlaying, isSegmentLoopActive, segmentStart, segmentEnd, onDurationChange, onTimeUpdate, onPlayPause, onSeek, propEndTime, segmentEnd, updateSegment]);

  // Handle Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Frame-by-frame navigation using HTML5 currentTime seek events
  const stepFrame = useCallback((deltaFrames: number) => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      onPlayPause();
    }

    const frameDuration = 1 / effectiveFps;
    const targetTime = Math.max(0, Math.min(duration || video.duration || 1000, video.currentTime + deltaFrames * frameDuration));
    
    video.currentTime = targetTime;
    onSeek(targetTime);
    onTimeUpdate(targetTime);
  }, [videoRef, isPlaying, effectiveFps, duration, onPlayPause, onSeek, onTimeUpdate]);

  // Jump seconds navigation
  const jumpSeconds = useCallback((deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const targetTime = Math.max(0, Math.min(duration || video.duration || 1000, video.currentTime + deltaSeconds));
    video.currentTime = targetTime;
    onSeek(targetTime);
    onTimeUpdate(targetTime);
  }, [videoRef, duration, onSeek, onTimeUpdate]);

  // In-Point & Out-Point quick setter methods
  const setInPointToCurrent = () => {
    const cur = currentTime;
    if (cur < segmentEnd) {
      updateSegment(cur, segmentEnd);
    } else {
      updateSegment(cur, Math.min(duration || 10, cur + 1));
    }
  };

  const setOutPointToCurrent = () => {
    const cur = currentTime;
    if (cur > segmentStart) {
      updateSegment(segmentStart, cur);
    } else {
      updateSegment(Math.max(0, cur - 1), cur);
    }
  };

  const resetSegmentRange = () => {
    const maxDur = duration > 0 ? duration : 10;
    updateSegment(0, maxDur);
  };

  const playSegmentPreview = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = segmentStart;
    onSeek(segmentStart);
    onTimeUpdate(segmentStart);

    setIsSegmentLoopActive(true);
    if (!isPlaying) {
      video.play().then(() => onPlayPause()).catch((e) => console.warn(e));
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        onPlayPause();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          jumpSeconds(-1);
        } else {
          stepFrame(-1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          jumpSeconds(1);
        } else {
          stepFrame(1);
        }
      } else if (e.key === 'j') {
        e.preventDefault();
        stepFrame(-1);
      } else if (e.key === 'l') {
        e.preventDefault();
        stepFrame(1);
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'i' || e.key === '[') {
        e.preventDefault();
        setInPointToCurrent();
      } else if (e.key === 'o' || e.key === ']') {
        e.preventDefault();
        setOutPointToCurrent();
      } else if (e.key === 'Home') {
        e.preventDefault();
        const video = videoRef.current;
        if (video) {
          video.currentTime = 0;
          onSeek(0);
          onTimeUpdate(0);
        }
      } else if (e.key === 'End') {
        e.preventDefault();
        const video = videoRef.current;
        if (video && duration > 0) {
          video.currentTime = duration;
          onSeek(duration);
          onTimeUpdate(duration);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, stepFrame, jumpSeconds, onSeek, onTimeUpdate, duration, videoRef, currentTime, segmentStart, segmentEnd, updateSegment]);

  // Volume & Mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
    setIsMuted(val === 0);
  };

  // Playback Rate Speed
  const handleSetSpeed = (speed: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackRate(speed);
    }
    setShowSpeedMenu(false);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  // Picture in picture
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("PiP not supported or failed:", e);
    }
  };

  // Scrubber mouse drag / hover
  const calculateTimeFromEvent = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!scrubberRef.current) return 0;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return pos * (duration || 1);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = percent * (duration || 0);
    const targetFrame = Math.floor(targetTime * effectiveFps);
    setHoverPosition({ time: targetTime, frame: targetFrame, percent: percent * 100 });
  };

  const handleScrubberMouseLeave = () => {
    setHoverPosition(null);
  };

  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetTime = calculateTimeFromEvent(e);
    const video = videoRef.current;
    if (video) {
      video.currentTime = targetTime;
    }
    onSeek(targetTime);
    onTimeUpdate(targetTime);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveTime = calculateTimeFromEvent(moveEvent);
      if (video) {
        video.currentTime = moveTime;
      }
      onSeek(moveTime);
      onTimeUpdate(moveTime);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const segmentStartPercent = duration > 0 ? (segmentStart / duration) * 100 : 0;
  const segmentEndPercent = duration > 0 ? (segmentEnd / duration) * 100 : 100;
  const segmentDuration = Math.max(0, segmentEnd - segmentStart);
  const segmentFrames = Math.floor(segmentDuration * effectiveFps);

  return (
    <div 
      ref={containerRef} 
      id="video-preview-workspace"
      className={`relative flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}
    >
      {/* Top Header / Metadata Bar */}
      <div className="h-10 px-4 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-1.5 text-indigo-400">
            <Film className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Preview Monitor</span>
          </div>
          <div className="h-3.5 w-px bg-slate-700"></div>
          {title && (
            <span className="text-xs text-slate-300 font-medium truncate max-w-[200px]" title={title}>
              {title}
            </span>
          )}
        </div>

        {/* Video Specs Badges & Version Selector */}
        <div className="flex items-center space-x-2">
          {/* Multiple Version Tabs if available */}
          {versions.length > 0 && onSelectVersion && (
            <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => onSelectVersion('original')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  !currentVersionId || currentVersionId === 'original'
                    ? 'bg-slate-800 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Original
              </button>
              {versions.map((ver, idx) => (
                <button
                  key={ver.id}
                  onClick={() => onSelectVersion(ver.id)}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center space-x-1 ${
                    currentVersionId === ver.id
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={ver.prompt}
                >
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                  <span>v{ver.versionNumber || idx + 1}</span>
                </button>
              ))}
            </div>
          )}

          {/* Trimming Toggle Button */}
          {enableSegmentTrimming && (
            <button
              onClick={() => setShowSegmentControls(!showSegmentControls)}
              className={`px-2 py-0.5 text-[11px] rounded font-medium flex items-center space-x-1 transition-colors ${
                showSegmentControls 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Edit Segment Trimming Sliders"
            >
              <Scissors className="w-3 h-3" />
              <span className="hidden sm:inline">Range Sliders</span>
            </button>
          )}

          {/* Video Metadata Badges */}
          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-300">
            <span className="px-2 py-0.5 bg-slate-800/90 border border-slate-700/60 rounded text-indigo-300">
              {resolution || (actualDimensions ? `${actualDimensions.width}x${actualDimensions.height}` : '1080p')}
            </span>
            <span className="px-2 py-0.5 bg-slate-800/90 border border-slate-700/60 rounded text-emerald-300">
              {effectiveFps} FPS
            </span>
            <button
              onClick={() => setShowInfoOverlay(!showInfoOverlay)}
              className={`p-1 rounded transition-colors ${showInfoOverlay ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Toggle Video Stats Overlay"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div 
        className="relative flex-1 bg-black flex items-center justify-center overflow-hidden select-none group min-h-[260px]"
        onClick={(e) => {
          // Toggle play when clicking canvas background directly
          if (e.target === e.currentTarget || e.target === videoRef.current) {
            onPlayPause();
          }
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          className="w-full h-full object-contain max-h-full"
        />

        {/* Buffering Spinner */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-10 pointer-events-none">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="text-xs font-medium text-slate-300">Buffering...</span>
            </div>
          </div>
        )}

        {/* Center Play Overlay on Pause */}
        {!isPlaying && !isBuffering && (
          <div 
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors cursor-pointer z-10"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-600/90 backdrop-blur flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-all border border-indigo-400/30">
              <Play className="w-8 h-8 text-white ml-1 fill-white/80" />
            </div>
          </div>
        )}

        {/* HUD Info Overlay */}
        {showInfoOverlay && (
          <div className="absolute top-4 left-4 z-20 bg-slate-950/85 backdrop-blur border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-200 space-y-1.5 shadow-2xl">
            <div className="font-semibold text-indigo-400 border-b border-slate-800 pb-1 flex items-center">
              <Info className="w-3.5 h-3.5 mr-1.5" /> Technical Stream Diagnostics
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px]">
              <span className="text-slate-400">SMPTE Timecode:</span>
              <span className="text-white font-bold">{formatTimecode(currentTime, effectiveFps)}</span>
              <span className="text-slate-400">Current Frame:</span>
              <span className="text-amber-300 font-bold">#{currentFrame} / {totalFrames}</span>
              <span className="text-slate-400">Segment Cut Range:</span>
              <span className="text-amber-400 font-bold">{formatTimecode(segmentStart, effectiveFps)} → {formatTimecode(segmentEnd, effectiveFps)}</span>
              <span className="text-slate-400">Cut Duration:</span>
              <span>{segmentDuration.toFixed(2)}s ({segmentFrames} frames)</span>
              <span className="text-slate-400">Framerate:</span>
              <span>{effectiveFps} fps ({((1 / effectiveFps) * 1000).toFixed(2)} ms/f)</span>
              <span className="text-slate-400">Dimensions:</span>
              <span>{actualDimensions ? `${actualDimensions.width} × ${actualDimensions.height}` : resolution}</span>
              <span className="text-slate-400">Playback Rate:</span>
              <span>{playbackRate}x</span>
              <span className="text-slate-400">Audio Volume:</span>
              <span>{isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}</span>
            </div>
          </div>
        )}

        {/* Active Frame & Segment Status Pill in Top-Right */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none flex flex-col items-end space-y-1">
          <div className="px-2.5 py-1 bg-black/75 backdrop-blur border border-white/10 rounded-md text-xs font-mono text-white flex items-center space-x-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-amber-300 font-semibold">Frame {currentFrame}</span>
            <span className="text-slate-500">•</span>
            <span>{formatTimecode(currentTime, effectiveFps)}</span>
          </div>

          {/* Segment In/Out Pill */}
          {enableSegmentTrimming && (
            <div className="px-2 py-0.5 bg-amber-950/80 backdrop-blur border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 flex items-center space-x-1.5 shadow-md">
              <Scissors className="w-3 h-3 text-amber-400" />
              <span>Cut: {formatTimecode(segmentStart, effectiveFps)} - {formatTimecode(segmentEnd, effectiveFps)}</span>
              <span className="text-amber-400/70">({segmentDuration.toFixed(1)}s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Frame Scrubber Bar with Visual Range Segment Window */}
      <div 
        className="relative bg-slate-900 px-4 pt-2.5 pb-1 border-t border-slate-800 select-none cursor-pointer"
        ref={scrubberRef}
        onMouseMove={handleScrubberMouseMove}
        onMouseLeave={handleScrubberMouseLeave}
        onMouseDown={handleScrubberMouseDown}
      >
        {/* Scrubber Hover Tooltip */}
        {hoverPosition && (
          <div 
            className="absolute -top-9 z-30 transform -translate-x-1/2 bg-slate-900 border border-indigo-500/50 text-white rounded-md px-2 py-1 text-[10px] font-mono shadow-2xl pointer-events-none whitespace-nowrap flex items-center space-x-1.5"
            style={{ left: `${hoverPosition.percent}%` }}
          >
            <span className="text-amber-300">Frame #{hoverPosition.frame}</span>
            <span className="text-slate-400">({formatTimecode(hoverPosition.time, effectiveFps)})</span>
          </div>
        )}

        {/* Hover Line */}
        {hoverPosition && (
          <div 
            className="absolute top-2.5 bottom-1 w-px bg-indigo-400/70 pointer-events-none z-10"
            style={{ left: `${hoverPosition.percent}%` }}
          />
        )}

        {/* Progress Track Container */}
        <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
          {/* Active Segment Highlight Window (In/Out Zone) */}
          {enableSegmentTrimming && duration > 0 && (
            <div 
              className="absolute top-0 bottom-0 bg-amber-500/30 border-x-2 border-amber-400 z-5 pointer-events-none"
              style={{ 
                left: `${segmentStartPercent}%`, 
                width: `${Math.max(0.5, segmentEndPercent - segmentStartPercent)}%` 
              }}
              title={`Selected Segment: ${formatTimecode(segmentStart, effectiveFps)} to ${formatTimecode(segmentEnd, effectiveFps)}`}
            />
          )}

          {/* Filled Playhead Bar */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-linear-to-r from-indigo-600 to-indigo-400 rounded-full transition-none z-10"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* In-Point Marker Flag on Track */}
        {enableSegmentTrimming && duration > 0 && (
          <div 
            className="absolute top-1 -translate-x-1/2 w-2 h-4 bg-amber-400 rounded-xs shadow-md z-15 pointer-events-none flex items-center justify-center text-[8px] font-bold text-slate-950 font-mono"
            style={{ left: `${segmentStartPercent}%` }}
            title={`In-Point: ${formatTimecode(segmentStart, effectiveFps)}`}
          >
            [
          </div>
        )}

        {/* Out-Point Marker Flag on Track */}
        {enableSegmentTrimming && duration > 0 && (
          <div 
            className="absolute top-1 -translate-x-1/2 w-2 h-4 bg-amber-400 rounded-xs shadow-md z-15 pointer-events-none flex items-center justify-center text-[8px] font-bold text-slate-950 font-mono"
            style={{ left: `${segmentEndPercent}%` }}
            title={`Out-Point: ${formatTimecode(segmentEnd, effectiveFps)}`}
          >
            ]
          </div>
        )}

        {/* Current Playhead Handle */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-md pointer-events-none z-20"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Dedicated Segment Range Input Sliders Bar */}
      {enableSegmentTrimming && showSegmentControls && (
        <div 
          id="video-range-slider-controls"
          className="bg-slate-950/90 border-t border-slate-800/90 px-4 py-3 space-y-3 z-20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            
            {/* Segment Title & Summary Badge */}
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-amber-500/20 text-amber-400 rounded">
                <Scissors className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-white">Target Edit Segment Range</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900/40 text-amber-300 border border-amber-700/50">
                    {segmentDuration.toFixed(2)}s ({segmentFrames} frames)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick In/Out & Play Segment Buttons */}
            <div className="flex items-center space-x-1.5 text-xs font-mono">
              <button
                onClick={setInPointToCurrent}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded border border-slate-700 transition-colors flex items-center space-x-1"
                title="Mark In-point at Current Playhead Frame (Key: [ or I)"
                id="btn-set-in-point"
              >
                <span>[ Set In</span>
              </button>

              <button
                onClick={setOutPointToCurrent}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded border border-slate-700 transition-colors flex items-center space-x-1"
                title="Mark Out-point at Current Playhead Frame (Key: ] or O)"
                id="btn-set-out-point"
              >
                <span>Set Out ]</span>
              </button>

              <button
                onClick={playSegmentPreview}
                className={`px-2 py-1 rounded border transition-colors flex items-center space-x-1 ${
                  isSegmentLoopActive 
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Preview Segment Cut (Loops segment start to end)"
                id="btn-play-segment-loop"
              >
                <Play className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Loop Segment</span>
              </button>

              <button
                onClick={resetSegmentRange}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Reset to Full Video (0 to duration)"
                id="btn-reset-segment"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dual Range Sliders for Start & End Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            
            {/* Start Timestamp Slider (In-Point) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-semibold text-slate-300">Start Timestamp (In)</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400 font-bold">{formatTimecode(segmentStart, effectiveFps)}</span>
                  <span className="text-slate-500">({segmentStart.toFixed(2)}s)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateSegment(Math.max(0, segmentStart - (1 / effectiveFps)), segmentEnd)}
                  className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-mono"
                  title="Step Start -1 Frame"
                >
                  -1F
                </button>

                {/* HTML Range Input for Start Timestamp */}
                <input
                  type="range"
                  id="slider-segment-start-time"
                  min="0"
                  max={duration > 0 ? duration : 10}
                  step={1 / effectiveFps}
                  value={segmentStart}
                  onChange={(e) => {
                    const newStart = parseFloat(e.target.value);
                    if (newStart < segmentEnd) {
                      updateSegment(newStart, segmentEnd);
                    }
                  }}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                <button
                  onClick={() => updateSegment(Math.min(segmentEnd - (1 / effectiveFps), segmentStart + (1 / effectiveFps)), segmentEnd)}
                  className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-mono"
                  title="Step Start +1 Frame"
                >
                  +1F
                </button>
              </div>
            </div>

            {/* End Timestamp Slider (Out-Point) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span className="font-semibold text-slate-300">End Timestamp (Out)</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-rose-400 font-bold">{formatTimecode(segmentEnd, effectiveFps)}</span>
                  <span className="text-slate-500">({segmentEnd.toFixed(2)}s)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateSegment(segmentStart, Math.max(segmentStart + (1 / effectiveFps), segmentEnd - (1 / effectiveFps)))}
                  className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-mono"
                  title="Step End -1 Frame"
                >
                  -1F
                </button>

                {/* HTML Range Input for End Timestamp */}
                <input
                  type="range"
                  id="slider-segment-end-time"
                  min="0"
                  max={duration > 0 ? duration : 10}
                  step={1 / effectiveFps}
                  value={segmentEnd}
                  onChange={(e) => {
                    const newEnd = parseFloat(e.target.value);
                    if (newEnd > segmentStart) {
                      updateSegment(segmentStart, newEnd);
                    }
                  }}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />

                <button
                  onClick={() => updateSegment(segmentStart, Math.min(duration || 10, segmentEnd + (1 / effectiveFps)))}
                  className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-mono"
                  title="Step End +1 Frame"
                >
                  +1F
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Primary Playback & Frame-Scrubbing Control Bar */}
      <div className="h-14 px-4 bg-slate-900 flex items-center justify-between border-t border-slate-800/80 z-20 shrink-0">
        
        {/* Left: Frame-by-Frame Scrubbing Controls & Playback */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {/* Jump -1s */}
          <button
            onClick={() => jumpSeconds(-1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs font-mono"
            title="Step Back 1s (Shift + Left Arrow)"
            id="btn-step-back-1s"
          >
            -1s
          </button>

          {/* Frame Step Backward (-1 Frame) */}
          <button
            onClick={() => stepFrame(-1)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-indigo-600/30 rounded-lg transition-colors flex items-center space-x-0.5 border border-slate-700/60"
            title="Step Backward 1 Frame (Left Arrow or J)"
            id="btn-step-frame-prev"
          >
            <ChevronLeft className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-mono font-medium hidden sm:inline pr-1">-1F</span>
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={() => {
              if (isSegmentLoopActive) setIsSegmentLoopActive(false);
              onPlayPause();
            }}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md transition-all flex items-center justify-center transform active:scale-95"
            title={isPlaying ? "Pause (Space / K)" : "Play (Space / K)"}
            id="btn-play-pause-toggle"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          {/* Frame Step Forward (+1 Frame) */}
          <button
            onClick={() => stepFrame(1)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-indigo-600/30 rounded-lg transition-colors flex items-center space-x-0.5 border border-slate-700/60"
            title="Step Forward 1 Frame (Right Arrow or L)"
            id="btn-step-frame-next"
          >
            <span className="text-[10px] font-mono font-medium hidden sm:inline pl-1">+1F</span>
            <ChevronRight className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Jump +1s */}
          <button
            onClick={() => jumpSeconds(1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs font-mono"
            title="Step Forward 1s (Shift + Right Arrow)"
            id="btn-step-forward-1s"
          >
            +1s
          </button>

          {/* Time & Frame Counter */}
          <div className="h-5 w-px bg-slate-800 mx-1"></div>
          <div className="flex items-center space-x-2 font-mono text-xs text-slate-300">
            <span className="text-white font-semibold">{formatTimecode(currentTime, effectiveFps)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatTimecode(duration, effectiveFps)}</span>
          </div>
        </div>

        {/* Right: Audio Volume, Speed, Loop, PiP & Fullscreen Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          
          {/* Volume Control */}
          <div className="flex items-center space-x-1.5 group">
            <button
              onClick={toggleMute}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isMuted ? "Unmute (M)" : "Mute (M)"}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeSlider}
              className="w-14 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>

          {/* Speed Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-md text-xs font-mono transition-colors flex items-center space-x-1"
              title="Playback Speed"
            >
              <Gauge className="w-3 h-3 text-indigo-400" />
              <span>{playbackRate}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 w-24 z-30 font-mono text-xs">
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSetSpeed(speed)}
                    className={`w-full px-3 py-1 text-left transition-colors flex items-center justify-between ${
                      playbackRate === speed ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{speed}x</span>
                    {playbackRate === speed && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loop Toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLooping ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isLooping ? "Looping Enabled" : "Enable Loop"}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* PiP Button */}
          <button
            onClick={togglePiP}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:inline-flex"
            title="Picture-in-Picture"
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            id="btn-fullscreen-toggle"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
