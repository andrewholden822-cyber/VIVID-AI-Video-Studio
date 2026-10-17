import React, { useState } from "react";
import {
  Smartphone,
  Sparkles,
  Play,
  Download,
  Flame,
  Wand2,
  Volume2,
  Type,
  Loader2,
  Video,
  CheckCircle2,
  Plus,
  Youtube
} from "lucide-react";
import { GeneratedVideo, Resolution, ShortItem } from "../types";
import { PublishableItem } from "./YouTubePublishModal";

interface ShortsStudioProps {
  onVideoGenerated: (video: GeneratedVideo) => void;
  onOpenYouTubePublish?: (item: PublishableItem) => void;
}

export const ShortsStudio: React.FC<ShortsStudioProps> = ({ onVideoGenerated, onOpenYouTubePublish }) => {
  const [topic, setTopic] = useState("5 Mind-Blowing Facts About AI and Future Robotics");
  const [hook, setHook] = useState("Did you know that future AI robots will communicate faster than human speech?");
  const [script, setScript] = useState("In 2026, neural networks operate at gigahertz frequencies. Watch how humanoid robots learn physical tasks in real time!");
  const [resolution, setResolution] = useState<Resolution>("1080p Full HD");
  const [captionStyle, setCaptionStyle] = useState<"bold_yellow" | "neon_glow" | "clean_white">("bold_yellow");
  
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [createdShort, setCreatedShort] = useState<ShortItem | null>(null);

  // Generate Script and Hook using Gemini AI
  const handleGenerateShortScript = async () => {
    if (!topic.trim()) return;
    setIsGeneratingScript(true);
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create a viral 9:16 short video hook and 15-second narration script for topic: ${topic}`,
          style: "cyberpunk",
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setHook(`"Wait till you see this!" ${topic}`);
        setScript(data.enhancedPrompt);
      }
    } catch (err) {
      console.error("Failed to generate short script:", err);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Generate Vertical Short Video
  const handleGenerateShortVideo = async () => {
    setIsGeneratingVideo(true);
    setProgressPercent(10);
    setStatusText("Formatting 9:16 vertical viewport frame...");

    try {
      const prompt = `[9:16 Vertical Short Reel] ${hook}. Visuals: ${script}. High speed motion, vivid colors, 60fps vertical camera tilt, ${resolution}`;
      
      const startRes = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: "veo-3.1-lite-generate-preview",
          aspectRatio: "9:16",
          resolution,
        }),
      });

      const startData = await startRes.json();
      if (!startRes.ok || !startData.operationName) {
        throw new Error(startData.error || "Failed to initiate vertical short generation.");
      }

      const operationName = startData.operationName;
      let isDone = false;
      let attempts = 0;

      while (!isDone && attempts < 100) {
        attempts++;
        await new Promise((r) => setTimeout(r, 2500));
        
        const statusRes = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName }),
        });
        const statusData = await statusRes.json();

        if (statusData.done) {
          isDone = true;
          setProgressPercent(90);
          setStatusText("Applying dynamic captions overlay & audio sync...");
        } else {
          setProgressPercent(Math.min(85, 20 + attempts * 2));
          setStatusText("Rendering 9:16 mobile vertical frame & temporal motion...");
        }
      }

      const downloadRes = await fetch("/api/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName }),
      });

      const blob = await downloadRes.blob();
      const videoUrl = URL.createObjectURL(blob);

      const generatedVideo: GeneratedVideo = {
        id: `short-${Date.now()}`,
        title: `[SHORT] ${topic}`,
        prompt,
        videoUrl,
        model: "veo-3.1-lite-generate-preview",
        aspectRatio: "9:16",
        resolution,
        createdAt: Date.now(),
        durationSec: 5,
        isShort: true,
      };

      const shortItem: ShortItem = {
        id: `short-item-${Date.now()}`,
        title: topic,
        hook,
        script,
        visualPrompt: prompt,
        captionText: hook,
        aspectRatio: "9:16",
        resolution,
        videoUrl,
        durationSec: 5,
      };

      setCreatedShort(shortItem);
      onVideoGenerated(generatedVideo);
      setProgressPercent(100);
      setStatusText("Vertical Short Video Ready!");
    } catch (err: any) {
      console.error("Short generation error:", err);
      alert(err.message || "Failed to generate short video.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-2">
            <Smartphone className="w-3.5 h-3.5 text-pink-400" /> Vertical Video & Reels Studio
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Shorts & TikTok Video Generator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Produce high-engagement 9:16 vertical short videos complete with catchy viral hooks and crisp HD resolution.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
          <button
            onClick={() => setResolution("1080p Full HD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              resolution === "1080p Full HD"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            1080p HD Vertical
          </button>
          <button
            onClick={() => setResolution("4K Ultra HD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              resolution === "4K Ultra HD"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            4K Ultra Short
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Short Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-pink-400" /> Short Concept & Topic
              </label>

              <button
                onClick={handleGenerateShortScript}
                disabled={isGeneratingScript || !topic.trim()}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {isGeneratingScript ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5 text-pink-400" />
                )}
                <span>Auto-Generate Hook</span>
              </button>
            </div>

            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 3 Cyberpunk Tech Gadgets You Can Buy in 2026..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            />

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Viral Opening Hook (First 3 Sec)
              </label>
              <textarea
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Narration & Visual Scene Script
              </label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleGenerateShortVideo}
              disabled={isGeneratingVideo}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-base text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isGeneratingVideo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Rendering 9:16 Vertical Short...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Generate 9:16 Vertical Short ({resolution})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Short Mobile Preview Mockup (5 cols) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[300px] h-[550px] bg-zinc-950 rounded-[40px] border-4 border-zinc-800 shadow-2xl p-3 flex flex-col justify-between relative overflow-hidden group">
            {/* Top Phone Notch */}
            <div className="w-32 h-4 bg-zinc-800 rounded-full mx-auto mb-2 shrink-0 z-20"></div>

            {/* Video Canvas */}
            <div className="flex-1 bg-zinc-900 rounded-[28px] overflow-hidden relative flex items-center justify-center border border-zinc-800">
              {isGeneratingVideo ? (
                <div className="p-6 text-center space-y-3 z-10">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-white">{progressPercent}% Rendered</p>
                  <p className="text-[10px] text-zinc-400">{statusText}</p>
                </div>
              ) : createdShort?.videoUrl ? (
                <video
                  src={createdShort.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-6 text-center text-zinc-600 space-y-2">
                  <Smartphone className="w-8 h-8 mx-auto text-zinc-700" />
                  <p className="text-xs font-semibold text-zinc-400">9:16 Mobile View</p>
                  <p className="text-[10px] text-zinc-600">Your vertical short preview will render live here.</p>
                </div>
              )}

              {/* On-screen Caption Overlay Simulation */}
              {(hook || createdShort) && (
                <div className="absolute bottom-6 left-3 right-3 bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center z-10">
                  <p className="text-xs font-extrabold text-yellow-300 drop-shadow-md">
                    {hook}
                  </p>
                </div>
              )}
            </div>

            {/* Actions: Download & Post to YouTube Shorts */}
            {createdShort?.videoUrl && (
              <div className="mt-2 space-y-1.5 w-full">
                {onOpenYouTubePublish && (
                  <button
                    onClick={() => onOpenYouTubePublish({ type: "short", data: createdShort })}
                    className="py-2 w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-600/20"
                  >
                    <Youtube className="w-3.5 h-3.5 fill-current" /> Post to YouTube Shorts
                  </button>
                )}

                <a
                  href={createdShort.videoUrl}
                  download={`${createdShort.title.replace(/\s+/g, "_")}_short.mp4`}
                  className="py-2 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-zinc-700"
                >
                  <Download className="w-3.5 h-3.5" /> Download Short MP4
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
