import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Ban,
  Layers,
  Film,
  Zap
} from 'lucide-react';
import { VideoJob, Project } from '../types';

interface StatusIndicatorProps {
  projectId: string;
  token: string;
  activeJobId?: string | null;
  onJobCompleted?: (job: VideoJob) => void;
  onProjectUpdated?: (project: Project) => void;
  onJobFailed?: (error: string) => void;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  projectId,
  token,
  activeJobId: propActiveJobId,
  onJobCompleted,
  onProjectUpdated,
  onJobFailed,
  className = ''
}) => {
  const [currentJob, setCurrentJob] = useState<VideoJob | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completedJobIdRef = useRef<string | null>(null);

  // Poll project jobs or specific job
  const pollStatus = async () => {
    try {
      let jobToInspect: VideoJob | null = null;

      if (propActiveJobId) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/video/jobs/${propActiveJobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.job) jobToInspect = data.job;
        }
      } else if (projectId) {
        // Query project jobs
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects/${projectId}/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.jobs && data.jobs.length > 0) {
            // Find most recent active or recently completed job
            const sorted = [...data.jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            jobToInspect = sorted[0];
          }
        }
      }

      if (jobToInspect) {
        setCurrentJob(jobToInspect);
        setLastUpdated(new Date());

        // Check if job completed
        if (jobToInspect.status === 'completed' && completedJobIdRef.current !== jobToInspect.id) {
          completedJobIdRef.current = jobToInspect.id;
          if (onJobCompleted) {
            onJobCompleted(jobToInspect);
          }
          // Fetch updated project
          if (projectId && onProjectUpdated) {
            try {
              const pRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (pRes.ok) {
                const pData = await pRes.json();
                if (pData.project) onProjectUpdated(pData.project);
              }
            } catch (e) {
              console.error("Failed to refresh project:", e);
            }
          }
        } else if (jobToInspect.status === 'failed' && onJobFailed) {
          onJobFailed(jobToInspect.error || 'Video processing job failed');
        }
      }
    } catch (err) {
      console.warn("Polling status error:", err);
    }
  };

  // Setup periodic polling
  useEffect(() => {
    if (!projectId && !propActiveJobId) return;

    // Initial poll
    pollStatus();

    // Setup 1.5s interval polling while job is running
    pollingRef.current = setInterval(() => {
      pollStatus();
    }, 1500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [projectId, propActiveJobId, token]);

  // Elapsed timer when active
  useEffect(() => {
    const isJobActive = currentJob && (
      currentJob.status === 'queued' ||
      currentJob.status === 'analyzing' ||
      currentJob.status === 'processing' ||
      currentJob.status === 'rendering'
    );

    if (isJobActive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentJob?.status]);

  // Reset timer when a new job starts
  useEffect(() => {
    if (propActiveJobId) {
      setElapsedSeconds(0);
      completedJobIdRef.current = null;
    }
  }, [propActiveJobId]);

  const handleCancelJob = async () => {
    if (!currentJob) return;
    try {
      setIsCancelling(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/video/jobs/${currentJob.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        pollStatus();
      }
    } catch (e) {
      console.error("Error cancelling job:", e);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!currentJob) {
    return null;
  }

  // Format elapsed time MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isProcessing = ['queued', 'analyzing', 'processing', 'rendering'].includes(currentJob.status);
  const isCompleted = currentJob.status === 'completed';
  const isFailed = currentJob.status === 'failed';
  const isCancelled = currentJob.status === 'cancelled';

  // Pipeline milestone steps
  const steps = [
    { key: 'queued', label: 'Queued', minProgress: 0 },
    { key: 'analyzing', label: 'Analysis', minProgress: 20 },
    { key: 'processing', label: 'AI Transform', minProgress: 50 },
    { key: 'rendering', label: 'Render & Sync', minProgress: 80 },
    { key: 'completed', label: 'Ready', minProgress: 100 },
  ];

  const getStepStatus = (stepIndex: number, currentProgress: number) => {
    const step = steps[stepIndex];
    if (isCompleted || currentProgress >= step.minProgress) return 'complete';
    if (isProcessing && (stepIndex === 0 || currentProgress >= steps[stepIndex - 1].minProgress)) return 'current';
    return 'upcoming';
  };

  return (
    <div 
      id="studio-status-indicator"
      className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all ${className}`}
    >
      {/* Header bar */}
      <div className="px-4 py-3 bg-slate-900/90 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          {/* Status Badge Icon */}
          <div className="relative">
            {isProcessing && (
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              </div>
            )}
            {isCompleted && (
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            {isFailed && (
              <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
            )}
            {isCancelled && (
              <div className="p-1.5 bg-slate-700/40 text-slate-400 rounded-lg">
                <Ban className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                {isProcessing ? 'Processing Video Job' : isCompleted ? 'Transformation Ready' : isFailed ? 'Processing Failed' : 'Job Cancelled'}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {currentJob.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">
              {currentJob.currentStep || 'Processing video stream...'}
            </p>
          </div>
        </div>

        {/* Right Header Stats & Controls */}
        <div className="flex items-center space-x-3">
          {isProcessing && (
            <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
          )}

          {/* Progress Percentage Badge */}
          <div className="text-right">
            <span className={`text-sm font-bold font-mono ${isCompleted ? 'text-emerald-400' : 'text-indigo-400'}`}>
              {currentJob.progress || (isCompleted ? 100 : 0)}%
            </span>
          </div>

          {/* Toggle Expand / Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Expandable Body */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-slate-950/40">
          
          {/* Animated Glowing Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center text-slate-300">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                Pipeline Progress
              </span>
              <span>{currentJob.progress || (isCompleted ? 100 : 0)}% Complete</span>
            </div>

            <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isCompleted 
                    ? 'bg-linear-to-r from-emerald-500 to-teal-400'
                    : isFailed
                    ? 'bg-rose-500'
                    : 'bg-linear-to-r from-indigo-600 via-indigo-400 to-purple-500 animate-pulse'
                }`}
                style={{ width: `${Math.max(5, currentJob.progress || (isCompleted ? 100 : 0))}%` }}
              />
            </div>
          </div>

          {/* Step Pipeline Checkpoints */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {steps.map((step, idx) => {
              const state = getStepStatus(idx, currentJob.progress || (isCompleted ? 100 : 0));
              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold mb-1 border transition-all ${
                      state === 'complete'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : state === 'current'
                        ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse shadow-md shadow-indigo-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {state === 'complete' ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight ${state === 'complete' ? 'text-slate-300' : state === 'current' ? 'text-indigo-300 font-semibold' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Job Details & Actions */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-400 truncate max-w-xs">
              <span className="font-mono text-[11px] text-slate-500">ID: {currentJob.id.slice(-8)}</span>
              {currentJob.prompt && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="truncate italic text-slate-300">"{currentJob.prompt}"</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {isProcessing && (
                <button
                  onClick={handleCancelJob}
                  disabled={isCancelling}
                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                >
                  <Ban className="w-3 h-3" />
                  <span>{isCancelling ? 'Cancelling...' : 'Cancel Job'}</span>
                </button>
              )}

              <button
                onClick={pollStatus}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title={`Refresh status (Last updated ${lastUpdated.toLocaleTimeString()})`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
