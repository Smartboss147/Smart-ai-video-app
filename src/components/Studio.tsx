import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, Wand2, Play, Pause, Volume2, VolumeX, Download, RefreshCw, Sliders, CheckCircle2, AlertCircle, Layers, ArrowLeft, Maximize2 } from 'lucide-react';
import { Project, AdvancedSettingsConfig, VideoJob } from '../types';
import { VideoUploader } from './VideoUploader';

interface StudioProps {
  token: string;
  projectId?: string;
  onBackToDashboard: () => void;
}

export const Studio: React.FC<StudioProps> = ({ token, projectId, onBackToDashboard }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Prompt and settings state
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(false);

  const [settings, setSettings] = useState<AdvancedSettingsConfig>({
    resolution: '1080p',
    aspectRatio: '16:9',
    quality: 'balanced',
    strength: 'moderate',
    characterConsistency: 'high',
    preserveOriginalAudio: true,
    preserveOriginalTiming: true,
    preserveOriginalComposition: true,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Job progress state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<VideoJob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Video playback refs & states
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const generatedVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [compareMode, setCompareMode] = useState<'split' | 'side-by-side'>('side-by-side');

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  // Poll job status if active job exists
  useEffect(() => {
    if (!activeJobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/jobs/${activeJobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.job) {
          setJobStatus(data.job);
          if (data.job.status === 'completed' || data.job.status === 'failed' || data.job.status === 'cancelled') {
            setIsProcessing(false);
            setActiveJobId(null);
            if (data.job.status === 'completed' && projectId) {
              fetchProject(projectId);
            }
          }
        }
      } catch (e) {
        console.error('Job poll error:', e);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeJobId, token, projectId]);

  const fetchProject = async (id: string) => {
    try {
      setLoadingProject(true);
      const res = await fetch(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.project) {
        setProject(data.project);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProject(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      console.log("[UPLOAD] File selected:", { name: file.name, type: file.type, size: file.size });

      const formData = new FormData();
      const safeFilename = (file.name || 'upload.mp4').replace(/[^\x20-\x7E]/g, '').trim() || 'upload.mp4';
      const safeToken = token.replace(/[^\x20-\x7E]/g, '').trim();
      
      console.log("[UPLOAD] Safe filename:", safeFilename);

      // Safari Fix: Convert iOS File object to a raw Blob to strip buggy WebKit File metadata 
      // that causes "The string did not match the expected pattern" during fetch serialization.
      const safeBlob = new Blob([file], { type: file.type || 'video/mp4' });
      formData.append('video', safeBlob, safeFilename);

      console.log("[UPLOAD] Executing fetch /api/videos/upload");

      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${safeToken}` },
        body: formData
      });

      console.log("[UPLOAD] Fetch response received");

      const data = await res.json();
      if (res.ok && data.project) {
        setProject(data.project);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (e: any) {
      console.error("[UPLOAD] Exception:", e);
      alert(`Upload Exception: ${e?.name || 'Error'}\nMessage: ${e?.message}\nStack: ${e?.stack ? e.stack.substring(0, 300) : 'N/A'}`);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input so same file can be chosen again
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    try {
      setIsEnhancing(true);
      const res = await fetch('/api/prompts/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (res.ok && data.enhancedPrompt) {
        setEnhancedPrompt(data.enhancedPrompt);
        setShowEnhanced(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleStartTransformation = async () => {
    if (!project || !prompt.trim()) return;
    try {
      setIsProcessing(true);
      const res = await fetch('/api/video/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: project.id,
          prompt,
          enhancedPrompt: enhancedPrompt || prompt,
          settings
        })
      });
      const data = await res.json();
      if (res.ok && data.jobId) {
        setActiveJobId(data.jobId);
        setJobStatus({
          id: data.jobId,
          projectId: project.id,
          userId: '',
          status: 'queued',
          progress: 5,
          currentStep: 'Initializing transformation job...',
          prompt,
          settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        alert(data.error || 'Failed to start job');
        setIsProcessing(false);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to start job');
      setIsProcessing(false);
    }
  };

  const currentVersion = project?.versions.find((v) => v.id === project.currentVersionId) || project?.versions[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Studio Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>{project ? project.title : 'New Video Studio'}</span>
              {project && (
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-medium">
                  v{currentVersion?.versionNumber || 1}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              {project ? `Resolution: ${project.metadata?.resolution || '1080p'}` : 'Upload video & describe edits'}
            </p>
          </div>
        </div>

        {project && (
          <div className="flex items-center space-x-3">
            <a
              href={currentVersion?.videoUrl}
              download
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center space-x-2 transition-colors border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>Download Result</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Studio Body */}
      {!project ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 mb-6">
              <Upload className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Upload a Video to Begin</h2>
            <p className="text-sm text-slate-400 mt-2 mb-8">
              Support MP4, MOV, or WebM. AI will analyze scenes, motion, and style for precise natural-language transformations.
            </p>

            <label className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 cursor-pointer transition-all transform hover:-translate-y-0.5">
              <span>{uploading ? 'Uploading & Analyzing...' : 'Select Video File'}</span>
              <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* Left Column: Video Preview Stage (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col border-r border-slate-800/80 bg-slate-950">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Video Preview Stage</h2>
              <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setCompareMode('side-by-side')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    compareMode === 'side-by-side' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Side by Side
                </button>
                <button
                  onClick={() => setCompareMode('split')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    compareMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single View
                </button>
              </div>
            </div>

            {/* Video Players Container */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-900/40 border border-slate-800 rounded-2xl p-4 relative min-h-[400px]">
              {/* Original Video */}
              <div className="flex flex-col space-y-2">
                <span className="text-xs font-medium text-slate-400 flex items-center justify-between">
                  <span>Original Video</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Source</span>
                </span>
                <div className="aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 relative shadow-lg">
                  {(project.normalizedVideoUrl || project.originalVideoUrl) ? (
                    <video
                      ref={originalVideoRef}
                      src={project.normalizedVideoUrl || project.originalVideoUrl}
                      className="w-full h-full object-contain"
                      onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                      onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
                      onError={(e) => {
                        console.warn("Original video preview error - possible format incompatibility");
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <p className="text-xs text-slate-500">Video source unavailable</p>
                    </div>
                  )}
                  {(!project.normalizedVideoUrl && project.originalVideoUrl && !project.originalVideoUrl.match(/\.(mp4|webm)$/i)) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 p-4 text-center">
                      <p className="text-[10px] text-slate-400">
                        Browser cannot preview this format directly.<br/>Creating compatible preview...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Video */}
              <div className="flex flex-col space-y-2">
                <span className="text-xs font-medium text-indigo-400 flex items-center justify-between">
                  <span>Generated Transformation</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30">
                    v{currentVersion?.versionNumber}
                  </span>
                </span>
                <div className="aspect-video rounded-xl overflow-hidden bg-black border border-indigo-500/40 relative shadow-2xl">
                  {currentVersion?.videoUrl ? (
                    <video
                      ref={generatedVideoRef}
                      src={currentVersion.normalizedVideoUrl || currentVersion.videoUrl}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <Sparkles className="w-8 h-8 text-indigo-500/30 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const next = !isPlaying;
                    setIsPlaying(next);
                    if (originalVideoRef.current) next ? originalVideoRef.current.play() : originalVideoRef.current.pause();
                    if (generatedVideoRef.current) next ? generatedVideoRef.current.play() : generatedVideoRef.current.pause();
                  }}
                  className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <div className="text-xs text-slate-300 font-mono">
                  {Math.floor(currentTime)}s / {Math.floor(duration)}s
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {[1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      setPlaybackSpeed(spd);
                      if (originalVideoRef.current) originalVideoRef.current.playbackRate = spd;
                      if (generatedVideoRef.current) generatedVideoRef.current.playbackRate = spd;
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      playbackSpeed === spd ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Version History bar */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Version History</h3>
              <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                {project.versions.map((ver) => (
                  <button
                    key={ver.id}
                    onClick={() => {
                      setProject({ ...project, currentVersionId: ver.id });
                    }}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-left border transition-all ${
                      project.currentVersionId === ver.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-semibold">Version {ver.versionNumber}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{ver.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Prompt Editor & Advanced Settings (5 Cols) */}
          <div className="lg:col-span-5 p-6 flex flex-col bg-slate-950 overflow-y-auto">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Natural Language Prompt</h2>

            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to change (e.g., 'Change main character's shirt from red to blue, keep hairstyle and timing unchanged')..."
                  rows={4}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner"
                />
                <button
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}</span>
                </button>
              </div>

              {/* Example Suggestions */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Example prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Change shirt from red to blue",
                    "Transform into cinematic 3D animation",
                    "Replace background with futuristic city",
                    "Make the scene look like nighttime"
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setPrompt(ex)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Prompt Preview */}
              {showEnhanced && enhancedPrompt && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/50 text-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Enhanced AI Prompt</span>
                    </span>
                    <button onClick={() => setPrompt(enhancedPrompt)} className="text-xs underline text-purple-300 hover:text-white">
                      Use This
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-purple-200/90">{enhancedPrompt}</p>
                </div>
              )}

              {/* Advanced Settings Accordion */}
              <div className="pt-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Advanced Settings</span>
                  </span>
                  <span>{showAdvanced ? '▲' : '▼'}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1.5">Resolution</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['720p', '1080p', '4k'] as const).map((res) => (
                          <button
                            key={res}
                            onClick={() => setSettings({ ...settings, resolution: res })}
                            className={`py-2 rounded-lg font-medium border transition-colors ${
                              settings.resolution === res
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-medium block mb-1.5">Transformation Quality</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['fast', 'balanced', 'high'] as const).map((q) => (
                          <button
                            key={q}
                            onClick={() => setSettings({ ...settings, quality: q })}
                            className={`py-2 rounded-lg font-medium border uppercase transition-colors ${
                              settings.quality === q
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-slate-300">Preserve Original Audio</span>
                      <input
                        type="checkbox"
                        checked={settings.preserveOriginalAudio}
                        onChange={(e) => setSettings({ ...settings, preserveOriginalAudio: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Preserve Original Timing</span>
                      <input
                        type="checkbox"
                        checked={settings.preserveOriginalTiming}
                        onChange={(e) => setSettings({ ...settings, preserveOriginalTiming: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleStartTransformation}
                disabled={isProcessing || !prompt.trim()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? 'Processing AI Transformation...' : 'Generate Transformation (10 Credits)'}</span>
              </button>

              {/* Job Progress View if processing */}
              {jobStatus && (
                <div className="mt-4 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400 capitalize flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
                      <span>Status: {jobStatus.status}</span>
                    </span>
                    <span className="text-xs font-mono text-slate-300">{jobStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500" style={{ width: `${jobStatus.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-400">{jobStatus.currentStep}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
