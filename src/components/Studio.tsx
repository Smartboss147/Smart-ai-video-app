import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Save, 
  Undo, 
  Redo, 
  Download, 
  Share2, 
  Wand2, 
  Settings2, 
  Image as ImageIcon, 
  Layers, 
  Film, 
  User, 
  Type, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit2, 
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Project, VideoVersion, AdvancedSettingsConfig, Scene, EditPlan, VideoJob } from '../types';
import { Timeline } from './Timeline';
import { VideoUploader } from './VideoUploader';
import { VideoPreview } from './VideoPreview';
import { StatusIndicator } from './StatusIndicator';

interface StudioProps {
  projectId?: string | null;
  onClose?: () => void;
  onBackToDashboard?: () => void;
  token: string;
}

export const Studio: React.FC<StudioProps> = ({ 
  projectId: initialProjectId, 
  onClose, 
  onBackToDashboard, 
  token 
}) => {
  const handleExit = onClose || onBackToDashboard || (() => {});

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'characters' | 'scenes' | 'story' | 'versions'>('prompt');
  
  // Selected Version for Preview (null = latest/current)
  const [selectedVersionId, setSelectedVersionId] = useState<string>('latest');

  // Timeline & Video State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video Segment Trimming State
  const [segmentStartTime, setSegmentStartTime] = useState<number>(0);
  const [segmentEndTime, setSegmentEndTime] = useState<number>(10);

  // Active Video Job Tracking for Status Indicator
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [lastJobNotification, setLastJobNotification] = useState<string | null>(null);

  // AI State
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [editPlan, setEditPlan] = useState<EditPlan | null>(null);
  
  const [settings, setSettings] = useState<AdvancedSettingsConfig>({
    resolution: '1080p',
    aspectRatio: 'original',
    quality: 'balanced',
    strength: 'moderate',
    characterConsistency: 'high',
    preserveOriginalAudio: true,
    preserveOriginalTiming: true,
    preserveOriginalComposition: true,
  });

  useEffect(() => {
    if (initialProjectId) {
      fetchProject(initialProjectId);
    }
  }, [initialProjectId]);

  const fetchProject = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.project) {
        setProject(data.project);
        if (data.project.metadata?.duration) {
          setDuration(data.project.metadata.duration);
          setSegmentEndTime(data.project.metadata.duration);
        }
      }
    } catch (e) {
      console.error("Failed to fetch project:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newProject: Project) => {
    setProject(newProject);
    if (newProject.metadata?.duration) {
      setDuration(newProject.metadata.duration);
      setSegmentEndTime(newProject.metadata.duration);
    }
  };

  const handleGeneratePlan = async () => {
    if (!project || !prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects/${project.id}/plan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          prompt,
          segment: {
            startTime: segmentStartTime,
            endTime: segmentEndTime,
            duration: Math.max(0, segmentEndTime - segmentStartTime)
          }
        })
      });
      
      const data = await res.json();
      if (res.ok && data.editPlan) {
        setEditPlan(data.editPlan);
      } else {
        alert(data.error || 'Failed to generate edit plan');
      }
    } catch (e) {
      console.error(e);
      alert('Error generating plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyGeneration = async () => {
    if (!project) return;
    setIsGenerating(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/video/jobs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          projectId: project.id,
          prompt,
          settings,
          segment: {
            startTime: segmentStartTime,
            endTime: segmentEndTime,
            duration: Math.max(0, segmentEndTime - segmentStartTime)
          }
        })
      });
      
      const data = await res.json();
      if (res.ok && data.jobId) {
        setActiveJobId(data.jobId);
        setLastJobNotification('AI video transformation started! Real-time status indicator is monitoring the progress.');
      } else {
        alert(data.error || 'Failed to trigger video generation job');
      }
    } catch (e) {
      console.error("Error applying generation:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJobCompleted = (job: VideoJob) => {
    setLastJobNotification('Transformation completed! New video version is ready and loaded in preview.');
    // Auto-select latest version
    setSelectedVersionId('latest');
    if (project?.id) {
      fetchProject(project.id);
    }
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
    if (updatedProject.metadata?.duration) {
      setDuration(updatedProject.metadata.duration);
    }
  };

  // Video Playback Controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch((err) => console.warn(err));
    }
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Determine active video source URL
  const getActiveVideoUrl = () => {
    if (!project) return '';
    if (selectedVersionId === 'original') {
      return project.normalizedVideoUrl || project.originalVideoUrl;
    }
    if (selectedVersionId !== 'latest') {
      const found = project.versions.find(v => v.id === selectedVersionId);
      if (found) return found.normalizedVideoUrl || found.videoUrl;
    }
    // Default to newest version or original
    if (project.versions && project.versions.length > 0) {
      const newest = project.versions[project.versions.length - 1];
      return newest.normalizedVideoUrl || newest.videoUrl;
    }
    return project.normalizedVideoUrl || project.originalVideoUrl;
  };

  if (!project) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col">
        <div className="h-14 border-b border-slate-800 flex items-center px-6 bg-slate-900">
          <button onClick={handleExit} className="text-slate-400 hover:text-white mr-4 flex items-center space-x-1.5 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-700 mx-2"></div>
          <h1 className="text-lg font-bold text-white tracking-tight">Create New Video Project</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <VideoUploader token={token} onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>
    );
  }

  const activeVideoUrl = getActiveVideoUrl();
  const effectiveFps = project.metadata?.fps || 30;
  const effectiveResolution = project.metadata?.resolution || '1080p';

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-slate-950 flex flex-col text-slate-200 overflow-hidden font-sans">
      
      {/* Top Workspace Toolbar */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleExit} 
            className="text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors text-xs font-medium flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center space-x-2">
            <Film className="w-4 h-4 text-indigo-400" />
            <h1 className="text-sm font-semibold text-white truncate max-w-xs">{project.title || project.originalFilename || 'Untitled Project'}</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950/60 border border-indigo-700/40 text-indigo-300 rounded">
              {project.versions?.length ? `${project.versions.length} versions` : 'Original file'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => fetchProject(project.id)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" 
            title="Refresh Project State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Undo"><Undo className="w-4 h-4" /></button>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Redo"><Redo className="w-4 h-4" /></button>
          <div className="h-4 w-px bg-slate-700 mx-1"></div>
          <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-white rounded-lg transition-colors flex items-center space-x-1.5 border border-slate-700">
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save</span>
          </button>
          <a 
            href={activeVideoUrl} 
            download={`${project.title || 'video'}.mp4`}
            target="_blank" 
            rel="noreferrer"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition-colors flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Video</span>
          </a>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (Navigation Tabs) */}
        <div className="w-16 md:w-60 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <button 
              onClick={() => setActiveTab('prompt')} 
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                activeTab === 'prompt' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Wand2 className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">AI Transform</span>
            </button>
            <button 
              onClick={() => setActiveTab('versions')} 
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                activeTab === 'versions' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Versions ({project.versions?.length || 1})</span>
            </button>
            <button 
              onClick={() => setActiveTab('scenes')} 
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                activeTab === 'scenes' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Storyboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('characters')} 
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                activeTab === 'characters' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Characters</span>
            </button>
            <button 
              onClick={() => setActiveTab('story')} 
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                activeTab === 'story' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Type className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Story & Script</span>
            </button>
          </div>
        </div>

        {/* Center Main Stage (Video Preview Monitor + Status Indicator + Timeline) */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
          
          <div className="p-4 space-y-4 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-start">
            
            {/* Real-time Project Processing Status Indicator */}
            <StatusIndicator
              projectId={project.id}
              token={token}
              activeJobId={activeJobId}
              onJobCompleted={handleJobCompleted}
              onProjectUpdated={handleProjectUpdated}
            />

            {/* Video Preview Component with Frame-by-Frame Scrubbing */}
            <div className="flex-1 min-h-[420px] flex flex-col">
              <VideoPreview
                videoUrl={activeVideoUrl}
                originalVideoUrl={project.originalVideoUrl}
                versions={project.versions}
                currentVersionId={selectedVersionId}
                onSelectVersion={(vId) => setSelectedVersionId(vId)}
                fps={effectiveFps}
                resolution={effectiveResolution}
                aspectRatio={project.metadata?.aspectRatio || '16:9'}
                title={project.title}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onTimeUpdate={(time) => setCurrentTime(time)}
                onDurationChange={(dur) => {
                  setDuration(dur);
                  if (segmentEndTime === 10 || segmentEndTime > dur) {
                    setSegmentEndTime(dur);
                  }
                }}
                onPlayPause={togglePlay}
                onSeek={handleSeek}
                videoRef={videoRef}
                startTime={segmentStartTime}
                endTime={segmentEndTime}
                onSegmentChange={(start, end) => {
                  setSegmentStartTime(start);
                  setSegmentEndTime(end);
                }}
                className="flex-1 shadow-2xl"
              />
            </div>
          </div>

          {/* Timeline & Audio Track Multi-segment Bar */}
          <div className="shrink-0">
            <Timeline 
              project={project}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onPlayPause={togglePlay}
              onSeek={handleSeek}
            />
          </div>
        </div>

        {/* Right Sidebar (Properties, AI Settings & Version History) */}
        <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-y-auto">
           
           {activeTab === 'prompt' && (
             <div className="p-5 flex flex-col h-full">
               <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center">
                 <Wand2 className="w-4 h-4 mr-2 text-indigo-400" /> AI Transform
               </h3>
               
               <div className="space-y-4">
                 {/* Active Edit Segment Badge */}
                 <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between text-xs">
                   <div className="flex items-center space-x-2 min-w-0">
                     <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                     <span className="text-slate-300 font-medium truncate">Edit Range Cut:</span>
                   </div>
                   <div className="font-mono text-amber-300 font-semibold text-[11px] shrink-0">
                     {segmentStartTime.toFixed(2)}s → {segmentEndTime.toFixed(2)}s ({(segmentEndTime - segmentStartTime).toFixed(2)}s)
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-medium text-slate-400 mb-2">Natural Language Prompt</label>
                   <textarea
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     className="w-full h-28 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed"
                     placeholder="e.g., Change lighting to cinematic golden hour, replace background with futuristic neon skyline, and enhance facial detail..."
                   />
                 </div>

                 {/* Settings Quick Config */}
                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                   <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                     <Sliders className="w-3 h-3 mr-1 text-indigo-400" /> Transform Config
                   </div>
                   <div className="grid grid-cols-2 gap-2 text-xs">
                     <div>
                       <span className="text-[10px] text-slate-500 block">Quality</span>
                       <select 
                         value={settings.quality}
                         onChange={(e) => setSettings({ ...settings, quality: e.target.value as any })}
                         className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs"
                       >
                         <option value="fast">Fast (Quick Preview)</option>
                         <option value="balanced">Balanced</option>
                         <option value="high">High Fidelity</option>
                       </select>
                     </div>
                     <div>
                       <span className="text-[10px] text-slate-500 block">Strength</span>
                       <select 
                         value={settings.strength}
                         onChange={(e) => setSettings({ ...settings, strength: e.target.value as any })}
                         className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs"
                       >
                         <option value="subtle">Subtle</option>
                         <option value="moderate">Moderate</option>
                         <option value="strong">Strong</option>
                       </select>
                     </div>
                   </div>
                 </div>
                 
                 <button
                   onClick={handleGeneratePlan}
                   disabled={!prompt.trim() || isGenerating}
                   className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20"
                 >
                   {isGenerating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Layers className="w-4 h-4" />}
                   <span>Analyze & Plan Edits</span>
                 </button>

                 {editPlan && (
                   <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                     <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Review Change Matrix</h4>
                     
                     <div>
                       <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block mb-1">Preserve Unchanged</span>
                       <div className="flex flex-wrap gap-1.5">
                         {editPlan.preserve.map(p => (
                           <span key={p} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-300">✓ {p}</span>
                         ))}
                       </div>
                     </div>
                     
                     <div>
                       <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block mb-1">Target Modifications</span>
                       <div className="space-y-1.5">
                         {editPlan.modify.map((m, i) => (
                           <div key={i} className="px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300 flex items-start">
                             <span className="mr-2">⚡</span>
                             <span>{m.target}: {m.value}</span>
                           </div>
                         ))}
                       </div>
                     </div>

                     <button 
                       onClick={handleApplyGeneration} 
                       disabled={isGenerating}
                       className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20"
                     >
                       <Sparkles className="w-4 h-4" />
                       <span>Approve & Start Render Job</span>
                     </button>
                   </div>
                 )}
               </div>
             </div>
           )}

           {activeTab === 'versions' && (
             <div className="p-5 space-y-4">
               <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center">
                 <Sparkles className="w-4 h-4 mr-2 text-indigo-400" /> Video Version History
               </h3>
               
               {/* Original Version */}
               <div 
                 onClick={() => setSelectedVersionId('original')}
                 className={`p-3 rounded-lg border transition-all cursor-pointer ${
                   selectedVersionId === 'original' 
                     ? 'bg-indigo-950/40 border-indigo-500 text-white' 
                     : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                 }`}
               >
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-semibold text-slate-300">Original Upload</span>
                   <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">v0</span>
                 </div>
                 <p className="text-xs text-slate-500 mt-1 truncate">{project.originalFilename}</p>
               </div>

               {/* Generated Versions */}
               {project.versions?.map((ver, idx) => (
                 <div 
                   key={ver.id}
                   onClick={() => setSelectedVersionId(ver.id)}
                   className={`p-3 rounded-lg border transition-all cursor-pointer ${
                     selectedVersionId === ver.id 
                       ? 'bg-indigo-950/40 border-indigo-500 text-white' 
                       : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                   }`}
                 >
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-semibold text-white flex items-center">
                       <Sparkles className="w-3 h-3 mr-1 text-indigo-400" />
                       v{ver.versionNumber || idx + 1}: {ver.title || 'AI Transform'}
                     </span>
                     <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                       Ready
                     </span>
                   </div>
                   <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic">"{ver.prompt}"</p>
                   <div className="mt-2 text-[10px] font-mono text-slate-500 flex justify-between">
                     <span>{new Date(ver.createdAt).toLocaleTimeString()}</span>
                     <span>{ver.settings?.quality || 'balanced'}</span>
                   </div>
                 </div>
               ))}
             </div>
           )}

           {activeTab === 'characters' && (
             <div className="p-5">
               <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                 <div className="flex items-center"><User className="w-4 h-4 mr-2 text-indigo-400" /> Characters</div>
                 <button className="text-indigo-400 hover:text-indigo-300"><Plus className="w-4 h-4" /></button>
               </h3>
               {project.characters?.length > 0 ? (
                 <div className="space-y-3">
                   {project.characters.map((c, i) => (
                     <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-start space-x-3">
                       <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center shrink-0">
                         {c.referenceImages?.[0] ? <img src={c.referenceImages[0]} alt="" className="w-full h-full object-cover rounded" /> : <User className="w-5 h-5 text-slate-500" />}
                       </div>
                       <div>
                         <div className="text-sm font-medium text-white">{c.name}</div>
                         <div className="text-xs text-slate-400 line-clamp-2 mt-0.5">{c.description}</div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-slate-500">
                   <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                   <p className="text-sm">No characters detected yet.</p>
                   <button className="mt-3 text-xs text-indigo-400 font-medium">Run Character Extraction</button>
                 </div>
               )}
             </div>
           )}
           
           {activeTab === 'scenes' && (
             <div className="p-5">
               <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                 <div className="flex items-center"><Film className="w-4 h-4 mr-2 text-indigo-400" /> Storyboard</div>
               </h3>
               {project.metadata?.scenes?.length > 0 ? (
                 <div className="space-y-3">
                   {project.metadata.scenes.map((s, i) => (
                     <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-3 group cursor-pointer hover:border-indigo-500/50 transition-colors">
                       <div className="text-xs font-mono text-slate-500 mb-1">SCENE {s.sceneNumber || i + 1}</div>
                       <div className="text-sm font-medium text-white mb-2">{s.title || 'Untitled Scene'}</div>
                       <div className="text-xs text-slate-400">{s.location || 'Unknown Location'}</div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-slate-500">
                   <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                   <p className="text-sm">No scene markers created yet.</p>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'story' && (
             <div className="p-5 space-y-4">
               <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center">
                 <Type className="w-4 h-4 mr-2 text-indigo-400" /> Story & Script
               </h3>
               <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                 <span className="text-xs font-medium text-slate-300">Logline</span>
                 <p className="text-xs text-slate-400 leading-relaxed italic">
                   {project.story?.logline || 'A video composition dynamically analyzed and ready for generative neural transformation.'}
                 </p>
               </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};
