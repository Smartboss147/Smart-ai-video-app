import React from 'react';
import { Sparkles, Film, Wand2, ShieldCheck, Zap, Sliders, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreTemplates: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onExploreTemplates }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950/80 to-slate-950 -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-8 animate-pulse">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Next-Gen Hybrid AI Video Editing Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Transform Any Video With <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Natural Language</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Upload a video, describe the changes you want in plain English, and let AI transform it while preserving exact timing, motion, and visual continuity.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-0.5"
            >
              <span>Start Creating</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onExploreTemplates}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-base border border-slate-800 hover:border-slate-700 flex items-center justify-center space-x-2 transition-all"
            >
              <Play className="w-4 h-4 text-purple-400" />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Interactive Preview Mockup Card */}
          <div className="mt-16 relative max-w-5xl mx-auto rounded-2xl p-2 bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/60 shadow-2xl shadow-indigo-950/50">
            <div className="rounded-xl overflow-hidden bg-slate-950 aspect-video relative flex items-center justify-center group">
              <img
                src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80"
                alt="Studio preview mockup"
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500 animate-ping" />
                  <span className="text-sm font-medium text-slate-200">
                    Prompt: "Change the main character's jacket from red to emerald green and enhance neon lighting"
                  </span>
                </div>
                <button
                  onClick={onGetStarted}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
                >
                  Try This in Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Everything you need for professional AI video editing
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Powered by advanced hybrid video processing and multimodal AI understanding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
              <Wand2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Natural Language Editing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Describe character clothing, background environments, art styles, or color palettes in plain English. No complex keyframing required.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Hybrid Processing Engine</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Uses lightning-fast deterministic FFmpeg pipelines for cropping, trimming, and color adjustments, saving AI generation power for complex transformations.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-6">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Character & Style Consistency</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Preserves facial identities, motion paths, scene timing, and audio dialogue while transforming the requested visual elements.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} AetherCut AI Studio. All rights reserved.</p>
      </footer>
    </div>
  );
};
