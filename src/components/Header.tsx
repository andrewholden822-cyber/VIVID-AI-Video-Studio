import React from "react";
import { Video, Film, Sliders, Sparkles, Zap, History, ShieldCheck, Smartphone, ListMusic, Infinity as InfinityIcon, Layers } from "lucide-react";

interface HeaderProps {
  activeTab: "direct" | "shorts" | "playlists" | "storyboard" | "editor" | "presets" | "history";
  setActiveTab: (tab: "direct" | "shorts" | "playlists" | "storyboard" | "editor" | "presets" | "history") => void;
  savedVideosCount: number;
  batchQueueCount?: number;
  onOpenBatchQueue?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedVideosCount,
  batchQueueCount = 0,
  onOpenBatchQueue,
}) => {
  return (
    <header className="bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">
                  VIVID AI <span className="text-indigo-400 font-normal">Video Studio</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" /> FREE
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Unlimited AI Video Generation, Shorts, Playlists & Storyboards
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab("direct")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "direct"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-300" />
              <span>AI Video Generator</span>
            </button>

            <button
              onClick={() => setActiveTab("shorts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "shorts"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-pink-400" />
              <span>Shorts & Reels</span>
            </button>

            <button
              onClick={() => setActiveTab("playlists")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "playlists"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Playlists</span>
            </button>

            <button
              onClick={() => setActiveTab("storyboard")}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "storyboard"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Film className="w-3.5 h-3.5 text-indigo-300" />
              <span>Storyboard</span>
            </button>

            <button
              onClick={() => setActiveTab("editor")}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "editor"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-300" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab("presets")}
              className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "presets"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Presets</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <History className="w-3.5 h-3.5 text-indigo-300" />
              <span>Gallery</span>
              {savedVideosCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-500/30 text-indigo-200 text-[10px] rounded-full font-bold">
                  {savedVideosCount}
                </span>
              )}
            </button>
          </nav>

          {/* Batch Queue & Tier Badge */}
          <div className="flex items-center gap-2">
            {onOpenBatchQueue && (
              <button
                onClick={onOpenBatchQueue}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all shadow-sm"
                title="Open Batch Render Queue"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Batch Queue</span>
                {batchQueueCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-500/40 text-white text-[10px] rounded-full font-bold">
                    {batchQueueCount}
                  </span>
                )}
              </button>
            )}

            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <span className="text-zinc-400">Tier:</span>
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                <InfinityIcon className="w-4 h-4 text-indigo-400" /> Unlimited Free
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
