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

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  appearance: {
    hair: string;
    face: string;
    clothing: string;
    colors: string[];
    accessories: string[];
  };
  ageCategory: string;
  personality: string;
  voiceId?: string;
  referenceImages: string[];
  referenceFrames: string[];
  consistencySettings: 'low' | 'medium' | 'high';
}

export interface VideoMetadata {
  duration: number; // seconds
  resolution: string; // e.g., "1920x1080"
  fps: number;
  aspectRatio: string;
  audioPresent: boolean;
  videoCodec: string;
  container: string;
  videoStyle: string;
  mainCharacters: CharacterProfile[];
  scenes: Scene[];
}

export interface PromptOperation {
  target: string;
  property: string;
  operation: 'replace' | 'modify' | 'remove' | 'style_transform';
  value: string;
}

export interface StructuredPrompt {
  summary: string;
  operations: PromptOperation[];
}

export interface EditPlan {
  preserve: string[];
  modify: PromptOperation[];
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

export interface AudioTrack {
  id: string;
  type: 'original' | 'music' | 'voice' | 'sfx';
  url: string;
  volume: number;
  startTime: number; // seconds
  duration: number;
  fade?: { in: number; out: number };
}

export interface SubtitleTrack {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style: any;
}

export interface Shot {
  id: string;
  sceneId: string;
  duration: number;
  characters: string[]; // character IDs
  location: string;
  action: string;
  dialogue?: string;
  camera: 'Wide' | 'Medium' | 'Close-up' | 'Extreme close-up' | 'Over-the-shoulder' | 'Low angle' | 'High angle';
  cameraMovement: 'Static' | 'Tracking' | 'Pan' | 'Tilt' | 'Zoom';
  lighting: string;
  visualStyle: string;
  imageReference?: string;
  videoReference?: string;
  generationStatus: 'idle' | 'generating' | 'completed' | 'failed';
  generatedMediaUrl?: string;
  prompt: string;
  version: number;
}

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  time: string;
  characters: string[]; // Character IDs
  environment: string;
  storyAction: string;
  dialogue?: string;
  narration?: string;
  visualStyle: string;
  shots: Shot[];
  startTime: number; // For timeline sync
  endTime: number;
}

export interface Story {
  title: string;
  logline: string;
  characters: CharacterProfile[];
  locations: string[];
  storyBeats: {
    beginning: string;
    middle: string;
    ending: string;
  };
  scenes: Scene[];
}

export interface VideoVersion {
  id: string;
  versionNumber: number;
  title: string;
  videoUrl: string;
  normalizedVideoUrl?: string; // Standardized version for browser preview/AI
  thumbnailUrl: string;
  prompt: string;
  editPlan?: EditPlan;
  enhancedPrompt?: string;
  createdAt: string;
  fileSize: number;
  settings: AdvancedSettingsConfig;
  status: 'completed' | 'processing' | 'failed';
  storyboard?: Scene[]; // Contains shots
  audioTracks?: AudioTrack[];
  subtitles?: SubtitleTrack[];
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  originalVideoUrl: string;
  normalizedVideoUrl?: string;
  originalFilename: string;
  metadata: VideoMetadata;
  characters: CharacterProfile[];
  story?: Story;
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
  sceneId?: string;
  shotId?: string;
  provider: 'ffmpeg' | 'runway' | 'luma' | 'gemini' | 'openai' | 'elevenlabs';
  model: string;
  prompt: string;
  status: 'queued' | 'analyzing' | 'processing' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0 - 100
  currentStep: string;
  settings: AdvancedSettingsConfig;
  inputUrl?: string;
  outputUrl?: string;
  error?: string;
  resultVideoUrl?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  userId: string;
  projectId: string;
  provider: string;
  model: string;
  operation: string;
  usage: number; // e.g., credits, seconds, frames
  action: string;
  creditsCost: number;
  timestamp: string;
}
