export type AIProvider = 'runway' | 'luma' | 'gemini' | 'openai' | 'elevenlabs' | 'ffmpeg';

export interface GenerationOptions {
  prompt: string;
  imageReference?: string;
  videoReference?: string;
  aspectRatio?: string;
  duration?: number;
}

export class AIModelRouter {
  static async generateVideo(provider: AIProvider, options: GenerationOptions): Promise<{ jobId: string }> {
    if (!process.env[`${provider.toUpperCase()}_API_KEY`] && provider !== 'ffmpeg' && provider !== 'gemini') {
      throw new Error(`Video generation provider '${provider}' is not configured. Missing API Key.`);
    }
    
    // Stub implementation for real providers
    return { jobId: `job_${provider}_${Date.now()}` };
  }
  
  static async getJobStatus(provider: AIProvider, jobId: string): Promise<{ status: string, progress: number, resultUrl?: string, error?: string }> {
    // Stub for polling real provider status
    return { status: 'completed', progress: 100, resultUrl: 'https://example.com/generated.mp4' };
  }
}
