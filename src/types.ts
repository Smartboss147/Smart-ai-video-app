export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface CharacterInfo {
  id: string;
  description: string;
  clothing: string;
  hair: string;
}

export interface VideoMetadata {
  duration: number; // seconds
  resolution: string; // e.g., "1920x1080"
  fps: number;
  aspectRatio: string;
  audioPresent: boolean;
  videoStyle: string;
  mainCharacters: CharacterInfo[];
  scenes: { startTime: number; endTime: number; description: string }[];
}

export interface PromptOperation {
  target: string;
  property: string;
  operation: 'replace' | 'modify' | 'remove' | 'style';
  value: string;
}

export interface StructuredPrompt {
  summary: string;
  operations: PromptOperation[];
}

export interface AdvancedSettingsConfig {
  resolution: '720p' | '1080p' | '4k';
  aspectRatio: 'original' | '16:9' | '9:16' | '1:1' | '4:5';
  quality: 'fast' | 'balanced' | 'high';
  strength: 'subtle' | 'moderate' | 'strong';
  characterConsistency: 'low' | 'medium' | 'high';
  preserveOriginalAudio: boolean;
  preserveOriginalTiming: boolean;
  preserveOriginalComposition: boolean;
}

export interface VideoVersion {
  id: string;
  versionNumber: number;
  title: string;
  videoUrl: string;
  normalizedVideoUrl?: string; // Standardized version for browser preview/AI
  thumbnailUrl: string;
  prompt: string;
  enhancedPrompt?: string;
  createdAt: string;
  fileSize: number;
  settings: AdvancedSettingsConfig;
  status: 'completed' | 'processing' | 'failed';
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  thumbnailUrl: string;
  originalVideoUrl: string;
  normalizedVideoUrl?: string; // Normalized version of the original source
  originalFilename: string;
  metadata: VideoMetadata;
  versions: VideoVersion[];
  currentVersionId: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface VideoJob {
  id: string;
  projectId: string;
  userId: string;
  status: 'queued' | 'analyzing' | 'processing' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0 - 100
  currentStep: string;
  prompt: string;
  settings: AdvancedSettingsConfig;
  error?: string;
  resultVideoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  userId: string;
  action: string;
  creditsCost: number;
  timestamp: string;
}
