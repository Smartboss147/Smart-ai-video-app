import React from 'react';
import { Layers, Sparkles, ArrowRight } from 'lucide-react';

interface TemplatesViewProps {
  onSelectTemplate: (prompt: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onSelectTemplate }) => {
  const templates = [
    {
      title: "Cyberpunk Neon Glow",
      category: "Style Transformation",
      description: "Transform the video into a vibrant cyberpunk aesthetic with neon purple and cyan lighting.",
      prompt: "Transform this video into a futuristic cyberpunk style with vibrant neon lighting and chromatic glow.",
      image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: "Watercolor Animation",
      category: "Art Style",
      description: "Convert video frames into flowing watercolor paintings while preserving character movement.",
      prompt: "Convert the visual style into a soft watercolor animation with gentle brush stroke textures.",
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: "Cinematic 3D Render",
      category: "Rendering",
      description: "Upgrade flat 2D cartoons or videos into high-end cinematic 3D animated movies.",
      prompt: "Transform this video into a cinematic 3D animated feature with raytraced lighting and rich texture detail.",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: "Nighttime Sci-Fi City",
      category: "Background Edit",
      description: "Replace daytime outdoor backgrounds with a futuristic nighttime sci-fi metropolis.",
      prompt: "Turn the daytime scene into nighttime and change the background environment to a futuristic sci-fi city with flying vehicles.",
      image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center space-x-3">
            <Layers className="w-8 h-8 text-purple-400" />
            <span>Transformation Templates</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Choose a professional preset template to instantly populate your prompt in the studio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {templates.map((t) => (
            <div
              key={t.title}
              className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all overflow-hidden flex flex-col sm:flex-row shadow-xl cursor-pointer"
              onClick={() => onSelectTemplate(t.prompt)}
            >
              <div className="sm:w-1/2 aspect-video sm:aspect-auto relative overflow-hidden bg-slate-950">
                <img
                  src={t.image}
                  alt={t.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="sm:w-1/2 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
                    {t.category}
                  </span>
                  <h3 className="text-lg font-semibold text-white mt-3 group-hover:text-indigo-400 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center space-x-2 text-xs font-semibold text-indigo-400 group-hover:underline">
                  <span>Use Template</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
