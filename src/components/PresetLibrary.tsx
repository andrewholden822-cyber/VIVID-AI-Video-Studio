import React, { useState } from "react";
import { Sparkles, Play, ArrowRight, Tag, Video, Layers } from "lucide-react";
import { PRESET_TEMPLATES } from "../data/presets";
import { PresetTemplate } from "../types";

interface PresetLibraryProps {
  onSelectPreset: (preset: PresetTemplate) => void;
  onEnqueueBatch?: (item: any) => void;
}

export const PresetLibrary: React.FC<PresetLibraryProps> = ({ onSelectPreset, onEnqueueBatch }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Sci-Fi", "Nature", "Anime", "Cinematic", "Abstract"];

  const filteredPresets =
    selectedCategory === "All"
      ? PRESET_TEMPLATES
      : PRESET_TEMPLATES.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Inspired Video Templates & Prompts
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cinematic Preset Prompt Showcase
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select any pre-configured template to immediately generate high-definition AI videos.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between group"
          >
            {/* Visual Header Gradient */}
            <div className={`h-28 bg-gradient-to-r ${preset.previewColor} p-4 flex flex-col justify-between relative`}>
              <span className="self-start px-2.5 py-0.5 rounded-full bg-zinc-950/80 text-white font-extrabold text-[10px] uppercase tracking-wider backdrop-blur-md border border-white/10">
                {preset.category}
              </span>
              <h3 className="text-base font-extrabold text-white drop-shadow-md">{preset.name}</h3>
            </div>

            {/* Prompt Body */}
            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                "{preset.prompt}"
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800 pt-2">
                  <span>Style: <strong className="text-zinc-200 capitalize">{preset.style}</strong></span>
                  <span>Motion: <strong className="text-indigo-400 capitalize">{preset.cameraMotion}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectPreset(preset)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-indigo-600 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-zinc-700 hover:border-indigo-500 shadow-md"
                  >
                    <Video className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
                    <span>Use Prompt</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </button>

                  {onEnqueueBatch && (
                    <button
                      onClick={() =>
                        onEnqueueBatch({
                          title: preset.name,
                          prompt: preset.prompt,
                          model: "veo-3.1-generate-preview",
                          aspectRatio: preset.aspectRatio || "16:9",
                          resolution: "1080p Full HD",
                          durationSec: 5,
                          style: preset.style,
                          cameraMotion: preset.cameraMotion,
                        })
                      }
                      className="py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs border border-indigo-500/30 hover:border-indigo-500 transition-all flex items-center gap-1 shadow-md shrink-0"
                      title="Enqueue to Background Render Queue"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Enqueue</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
