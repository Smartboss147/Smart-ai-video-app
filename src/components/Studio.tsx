import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Save, Undo, Redo, Download, Share2, Wand2, Settings2, Image as ImageIcon, Layers, Film, User, Type, MessageSquare, Plus, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { Project, VideoVersion, AdvancedSettingsConfig, Scene, EditPlan } from '../types';
import { Timeline } from './Timeline';
import { VideoUploader } from './VideoUploader';

interface StudioProps {
  projectId?: string | null;
  onClose: () => void;
  token: string;
}

export const Studio: React.FC<StudioProps> = ({ projectId: initialProjectId, onClose, token }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'characters' | 'scenes' | 'story'>('prompt');
  
  // Timeline State
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // AI State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newProject: Project) => {
    setProject(newProject);
  };

  const handleGeneratePlan = async () => {
    if (!project || !prompt) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects/${project.id}/plan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
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
          settings 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('Generation job started. (Stub implementation for Phase 13)');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Video Control Hooks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [project]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (!project) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col">
        <div className="h-14 border-b border-slate-800 flex items-center px-6">
          <button onClick={onClose} className="text-slate-400 hover:text-white mr-4">← Back</button>
          <h1 className="text-xl font-bold text-white tracking-tight">Create New Project</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <VideoUploader token={token} onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>
    );
  }

  const activeVideoUrl = project.versions[project.versions.length - 1]?.videoUrl || project.originalVideoUrl;

  return (
    <div className="h-screen bg-slate-950 flex flex-col text-slate-200 overflow-hidden font-sans">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="text-slate-400 hover:text-white px-2 py-1 rounded transition-colors text-sm font-medium">
            ← Dashboard
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <h1 className="text-sm font-medium text-white truncate max-w-xs">{project.title || 'Untitled Project'}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors" title="Undo"><Undo className="w-4 h-4" /></button>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors" title="Redo"><Redo className="w-4 h-4" /></button>
          <div className="h-4 w-px bg-slate-700 mx-2"></div>
          <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white rounded transition-colors flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white rounded transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Assets / Navigation) */}
        <div className="w-16 md:w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto">
             <div className="p-4 space-y-2">
                <button onClick={() => setActiveTab('prompt')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'prompt' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <Wand2 className="w-5 h-5 shrink-0" />
                  <span className="hidden md:inline font-medium text-sm">AI Transform</span>
                </button>
                <button onClick={() => setActiveTab('scenes')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'scenes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <Film className="w-5 h-5 shrink-0" />
                  <span className="hidden md:inline font-medium text-sm">Storyboard</span>
                </button>
                <button onClick={() => setActiveTab('characters')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'characters' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <User className="w-5 h-5 shrink-0" />
                  <span className="hidden md:inline font-medium text-sm">Characters</span>
                </button>
                <button onClick={() => setActiveTab('story')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'story' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <Type className="w-5 h-5 shrink-0" />
                  <span className="hidden md:inline font-medium text-sm">Story</span>
                </button>
             </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
          <div className="flex-1 relative flex items-center justify-center p-4">
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
              <span className="px-2 py-1 bg-black/60 backdrop-blur text-xs font-mono rounded text-slate-300">
                {project.metadata?.resolution || '1080p'} • {project.metadata?.fps || 30} FPS
              </span>
            </div>
            
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 group">
              <video 
                ref={videoRef}
                src={activeVideoUrl}
                className="w-full h-full object-contain"
                onClick={togglePlay}
                playsInline
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-indigo-600/90 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <Timeline 
            project={project}
            currentTime={currentTime}
            duration={project.metadata?.duration || 10}
            isPlaying={isPlaying}
            onPlayPause={togglePlay}
            onSeek={handleSeek}
          />
        </div>

        {/* Right Sidebar (Properties & AI) */}
        <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-y-auto">
           {activeTab === 'prompt' && (
             <div className="p-5 flex flex-col h-full">
               <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center"><Wand2 className="w-4 h-4 mr-2 text-indigo-400" /> AI Transform</h3>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-medium text-slate-400 mb-2">Natural Language Prompt</label>
                   <textarea
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                     placeholder="e.g., Change the main character's shirt from red to blue, and make the background a futuristic city..."
                   />
                 </div>
                 
                 <button
                   onClick={handleGeneratePlan}
                   disabled={!prompt || isGenerating}
                   className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                 >
                   {isGenerating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Layers className="w-4 h-4" />}
                   <span>Generate Edit Plan</span>
                 </button>

                 {editPlan && (
                   <div className="mt-6 bg-slate-950 rounded-lg border border-slate-800 p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                     <h4 className="text-xs font-semibold text-slate-300 uppercase">Review Changes</h4>
                     
                     <div>
                       <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block mb-1">Preserve</span>
                       <div className="flex flex-wrap gap-1.5">
                         {editPlan.preserve.map(p => (
                           <span key={p} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-300">✓ {p}</span>
                         ))}
                       </div>
                     </div>
                     
                     <div>
                       <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block mb-1">Modify</span>
                       <div className="space-y-1.5">
                         {editPlan.modify.map((m, i) => (
                           <div key={i} className="px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300 flex items-start">
                             <span className="mr-2">⚡</span>
                             <span>{m.target} → {m.value}</span>
                           </div>
                         ))}
                       </div>
                     </div>

                     <button onClick={handleApplyGeneration} className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors">
                       Approve & Generate
                     </button>
                   </div>
                 )}
               </div>
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
                   <button className="mt-3 text-xs text-indigo-400 font-medium">Run AI Analysis</button>
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
                   <p className="text-sm">No scenes generated yet.</p>
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
