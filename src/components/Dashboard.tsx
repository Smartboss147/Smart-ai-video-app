import React, { useState, useEffect } from 'react';
import { PlusCircle, Film, Trash2, Download, ExternalLink, Sparkles, Clock, FolderOpen, AlertCircle, Play } from 'lucide-react';
import { Project, User } from '../types';

interface DashboardProps {
  user: User;
  onOpenStudio: (projectId?: string) => void;
  token: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenStudio, token }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      } else {
        alert('Failed to delete project');
      }
    } catch (e) {
      alert('Error deleting project');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center space-x-3">
              <span>Your Projects</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {projects.length} Total
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your AI video transformation projects and version history.
            </p>
          </div>
          <button
            onClick={() => onOpenStudio()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Video Project</span>
          </button>
        </div>

        {/* Storage and Credits quick status bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Available Credits</p>
              <p className="text-2xl font-bold text-white mt-1">{user.credits} Credits</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Storage Used</p>
              <p className="text-2xl font-bold text-white mt-1">
                {(user.storageUsedBytes / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Account Tier</p>
              <p className="text-2xl font-bold text-white mt-1 uppercase">{user.tier}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Film className="w-5 h-5" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-900 text-rose-300 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">No projects yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Upload your first video to start transforming scenes with AI prompts.
            </p>
            <button
              onClick={() => onOpenStudio()}
              className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow"
            >
              Upload Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const currentVersion = project.versions.find((v) => v.id === project.currentVersionId) || project.versions[0];
              return (
                <div
                  key={project.id}
                  onClick={() => onOpenStudio(project.id)}
                  className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all overflow-hidden cursor-pointer shadow-lg flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-950">
                    {(currentVersion?.videoUrl || project.originalVideoUrl) ? (
                      <video
                        src={currentVersion?.normalizedVideoUrl || currentVersion?.videoUrl || project.normalizedVideoUrl || project.originalVideoUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                        onMouseLeave={(e) => {
                          const v = e.target as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-slate-800" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs font-medium text-slate-300">
                      v{currentVersion?.versionNumber || 1} ({project.versions.length} versions)
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{project.metadata?.resolution || '1080p'}</span>
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-indigo-400 font-medium group-hover:underline">
                        Open in Studio →
                      </span>
                      <div className="flex items-center space-x-2">
                        <a
                          href={currentVersion?.videoUrl || project.originalVideoUrl}
                          download
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Download Video"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="p-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
