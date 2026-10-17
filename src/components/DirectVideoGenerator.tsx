import React, { useState, useRef } from "react";
import {
  Wand2,
  Play,
  Upload,
  Download,
  Video,
  Sparkles,
  Camera,
  Layers,
  Loader2,
  AlertCircle,
  Film,
  Infinity as InfinityIcon,
  Sliders,
  Youtube
} from "lucide-react";
import { AspectRatio, CameraMotion, GeneratedVideo, Resolution, VideoModel, VideoStyle } from "../types";
import { PublishableItem } from "./YouTubePublishModal";

interface DirectVideoGeneratorProps {
  onVideoGenerated: (video: GeneratedVideo) => void;
  onSendToTimeline?: (prompt: string, videoUrl?: string) => void;
  onOpenYouTubePublish?: (item: PublishableItem) => void;
  onEnqueueBatch?: (item: any) => void;
}

export const DirectVideoGenerator: React.FC<DirectVideoGeneratorProps> = ({
  onVideoGenerated,
  onSendToTimeline,
  onOpenYouTubePublish,
  onEnqueueBatch,
}) => {
  const [prompt, setPrompt] = useState(
    "Cinematic drone shot of a futuristic cyberpunk city at night during heavy rain, neon reflections on wet pavement, hyper-realistic, 8k resolution, volumetric lighting"
  );
  const [model, setModel] = useState<VideoModel>("veo-3.1-lite-generate-preview");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<Resolution>("1080p Full HD");
  const [cameraMotion, setCameraMotion] = useState<CameraMotion>("fpv_drone");
  const [style, setStyle] = useState<VideoStyle>("cinematic");

  const [startImage, setStartImage] = useState<string | null>(null);
  const [lastFrameImage, setLastFrameImage] = useState<string | null>(null);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startFileInputRef = useRef<HTMLInputElement>(null);
  const lastFileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Helper
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enhance Prompt using Gemini 3.6 Flash
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, resolution }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (err: any) {
      console.error("Failed to enhance prompt:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Generate Video
  const handleGenerateVideo = async () => {
    if (!prompt.trim() && !startImage) {
      setErrorMessage("Please enter a video prompt or upload an image.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setProgressPercent(5);
    setStatusText("Initializing Veo video generation engine...");

    try {
      // 1. Submit Request
      const startRes = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model,
          aspectRatio,
          resolution,
          startImage,
          lastFrameImage,
        }),
      });

      const startData = await startRes.json();

      if (!startRes.ok || !startData.operationName) {
        throw new Error(startData.error || "Failed to start video generation.");
      }

      const operationName = startData.operationName;
      setStatusText("Veo diffusion model synthesizing motion vectors...");
      setProgressPercent(20);

      // 2. Poll Status
      let isDone = false;
      let attempts = 0;
      const maxAttempts = 120; // up to ~4 minutes polling

      while (!isDone && attempts < maxAttempts) {
        attempts++;
        await new Promise((r) => setTimeout(r, 2500));

        const statusRes = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName }),
        });

        const statusData = await statusRes.json();

        if (statusData.error) {
          throw new Error(statusData.error.message || "Video generation failed on server.");
        }

        if (statusData.done) {
          isDone = true;
          setProgressPercent(90);
          setStatusText("Finalizing high-definition MP4 encoding...");
        } else {
          const simulatedProgress = Math.min(85, 20 + Math.floor(attempts * 1.5));
          setProgressPercent(simulatedProgress);

          const messages = [
            "Rendering spatial depth & camera parallax...",
            "Applying motion lighting & atmospheric effects...",
            "Smoothing keyframe transitions at 60 FPS...",
            "Executing temporal motion synthesis...",
            "Polishing visual details and HD resolution upscale...",
          ];
          setStatusText(messages[attempts % messages.length]);
        }
      }

      if (!isDone) {
        throw new Error("Video generation timed out. Please try again.");
      }

      // 3. Download Video Buffer
      setStatusText("Downloading generated MP4 video...");
      const downloadRes = await fetch("/api/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName }),
      });

      if (!downloadRes.ok) {
        const errJson = await downloadRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to retrieve generated video stream.");
      }

      const blob = await downloadRes.blob();
      const videoUrl = URL.createObjectURL(blob);

      const newVideo: GeneratedVideo = {
        id: `video-${Date.now()}`,
        title: prompt.slice(0, 32) + "...",
        prompt,
        videoUrl,
        model,
        aspectRatio,
        resolution,
        createdAt: Date.now(),
        durationSec: 5,
        cameraMotion,
        style,
      };

      setCurrentVideo(newVideo);
      onVideoGenerated(newVideo);
      setProgressPercent(100);
      setStatusText("HD Video Generation Complete!");
    } catch (err: any) {
      console.error("Video generation error:", err);
      setErrorMessage(
        err.message || "An error occurred during video generation. Please check network or prompt."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnqueueToBatch = () => {
    if (!prompt.trim() && !startImage) {
      setErrorMessage("Please enter a video prompt or upload an image.");
      return;
    }

    if (onEnqueueBatch) {
      onEnqueueBatch({
        title: prompt.slice(0, 36) + (prompt.length > 36 ? "..." : ""),
        prompt,
        model,
        aspectRatio,
        resolution,
        durationSec: 5,
        style,
        cameraMotion,
        startImage: startImage || undefined,
        lastFrameImage: lastFrameImage || undefined,
      });
      setStatusText("Enqueued to background batch render queue!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Sleek Banner Header */}
      <div className="relative rounded-2xl bg-zinc-900 p-6 md:p-8 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Google Veo 3.1 High Precision Studio
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Text-to-Video & Image-to-Video Engine
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Generate photorealistic HD & 4K cinematic videos from text prompts or images. Unlimited generations, zero restrictions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 border border-indigo-500/30 text-indigo-300 font-bold text-xs shadow-inner">
              <InfinityIcon className="w-4 h-4 text-indigo-400" />
              <span>Unlimited HD Video Tier</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-medium">
              <Video className="w-4 h-4 text-indigo-400" /> 720p / 1080p / 4K
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form & Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prompt Section */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" /> Text-to-Video Prompt
              </label>

              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isEnhancing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>Enhance Detail</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the scene you want to bring to life..."
                rows={4}
                className="w-full h-36 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-base focus:outline-none focus:border-indigo-500 placeholder-zinc-600 resize-none text-white"
              />
              <span className="absolute bottom-3 right-4 text-[10px] text-zinc-500 font-mono">
                {prompt.length} chars
              </span>
            </div>

            {/* Quick Prompt Ideas */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Quick Video Presets:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Futuristic Cyberpunk Rainy City",
                  "Deep Sea Bioluminescent Creatures",
                  "Epic Cosmic Black Hole",
                  "Anime Swordsman Battle FX",
                  "4K Nature Waterfall Drone Shot",
                ].map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() =>
                      setPrompt(
                        `Cinematic 1080p full HD video of ${idea}, high detail, 60fps fluid motion, dramatic lighting`
                      )
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    + {idea}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model & Aspect Ratio Settings */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 border-b border-zinc-800/80 pb-3">
              <Sliders className="w-4 h-4 text-indigo-400" /> HD Specs & Camera Specs
            </h3>

            {/* AI Model Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">AI Model Engine</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModel("veo-3.1-lite-generate-preview")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    model === "veo-3.1-lite-generate-preview"
                      ? "bg-indigo-950/40 border-indigo-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Veo 3.1 Lite</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Fast Render</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Balanced speed and fluid camera motion.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setModel("veo-3.1-generate-preview")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    model === "veo-3.1-generate-preview"
                      ? "bg-indigo-950/40 border-indigo-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Veo 3.1 Pro</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Ultra Quality</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">High resolution fidelity and motion coherence.</p>
                </button>
              </div>
            </div>

            {/* Resolution Options (HD Feature) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Output Resolution</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setResolution("720p HD")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    resolution === "720p HD"
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="block text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Resolution</span>
                  <span className="text-sm font-semibold">720p HD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResolution("1080p Full HD")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    resolution === "1080p Full HD"
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="block text-[10px] uppercase text-zinc-500 font-bold tracking-widest flex items-center justify-between">
                    <span>Resolution</span>
                    <span className="text-[9px] text-indigo-400 font-bold">POPULAR</span>
                  </span>
                  <span className="text-sm font-semibold">1080p Full HD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResolution("4K Ultra HD")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    resolution === "4K Ultra HD"
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="block text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Resolution</span>
                  <span className="text-sm font-semibold">4K Ultra HD</span>
                </button>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("16:9")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                      aspectRatio === "16:9"
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <span>16:9</span> <span className="text-[10px] text-zinc-500">(Landscape)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("9:16")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                      aspectRatio === "9:16"
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <span>9:16</span> <span className="text-[10px] text-zinc-500">(Shorts)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Camera Motion</label>
                <select
                  value={cameraMotion}
                  onChange={(e) => setCameraMotion(e.target.value as CameraMotion)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="fpv_drone">FPV Drone Flight</option>
                  <option value="dolly_forward">Dolly Zoom Forward</option>
                  <option value="pan_left">Slow Pan Left</option>
                  <option value="pan_right">Slow Pan Right</option>
                  <option value="zoom_in">Zoom In Close-Up</option>
                  <option value="crane_up">Vertical Crane Up</option>
                  <option value="orbit">360° Character Orbit</option>
                  <option value="static">Static Tripod Cinema</option>
                </select>
              </div>
            </div>
          </div>

          {/* Optional Image-to-Video Upload */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" /> Image-to-Video Animation (Optional)
              </span>
              <span className="text-[10px] text-zinc-500">Animate static pictures</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Image */}
              <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Start Frame Image:</span>
                <input
                  type="file"
                  accept="image/*"
                  ref={startFileInputRef}
                  onChange={(e) => handleImageUpload(e, setStartImage)}
                  className="hidden"
                />
                {startImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-indigo-500/40 aspect-video group">
                    <img src={startImage} alt="Start frame" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setStartImage(null)}
                      className="absolute top-2 right-2 p-1 bg-zinc-900/80 rounded-full text-zinc-300 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startFileInputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-400 hover:text-zinc-200 transition-all"
                  >
                    <Upload className="w-5 h-5 text-zinc-500 mb-1" />
                    <span className="text-xs font-semibold">Upload Start Image</span>
                    <span className="text-[10px] text-zinc-500">First frame of video</span>
                  </button>
                )}
              </div>

              {/* End Image */}
              <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">End Frame Image:</span>
                <input
                  type="file"
                  accept="image/*"
                  ref={lastFileInputRef}
                  onChange={(e) => handleImageUpload(e, setLastFrameImage)}
                  className="hidden"
                />
                {lastFrameImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-indigo-500/40 aspect-video group">
                    <img src={lastFrameImage} alt="End frame" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setLastFrameImage(null)}
                      className="absolute top-2 right-2 p-1 bg-zinc-900/80 rounded-full text-zinc-300 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => lastFileInputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-400 hover:text-zinc-200 transition-all"
                  >
                    <Upload className="w-5 h-5 text-zinc-500 mb-1" />
                    <span className="text-xs font-semibold">Upload End Image</span>
                    <span className="text-[10px] text-zinc-500">Keyframe transition</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Generation Message:</p>
                <p className="mt-0.5 text-rose-200/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleGenerateVideo}
              disabled={isGenerating}
              className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-base shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Generating {resolution}...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Generate Now ({resolution})</span>
                </>
              )}
            </button>

            {onEnqueueBatch && (
              <button
                type="button"
                onClick={handleEnqueueToBatch}
                className="px-5 py-4 bg-zinc-900 hover:bg-zinc-800 text-indigo-300 hover:text-white font-bold text-sm rounded-xl border border-indigo-500/30 hover:border-indigo-500 transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
                title="Enqueue to background batch rendering queue"
              >
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>+ Enqueue to Batch</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Video Preview & Player (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-5 sticky top-24">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" /> Video Monitor Output
              </span>
              {currentVideo && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {currentVideo.resolution}
                </span>
              )}
            </h3>

            {/* Video Display Container */}
            <div className="relative w-full aspect-video rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shadow-inner group">
              {isGenerating ? (
                /* Polling Progress Overlay */
                <div className="p-6 text-center space-y-4 max-w-xs">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                    <Video className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{progressPercent}% Rendered</p>
                    <p className="text-xs text-indigo-300 mt-1 font-medium">{statusText}</p>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              ) : currentVideo ? (
                /* Active Generated MP4 Player */
                <video
                  src={currentVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                /* Placeholder State */
                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">No Video Rendered Yet</p>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto">
                      Click "Generate Unlimited Video" to synthesize high-definition 60fps MP4 video with Google Veo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Details & Quick Actions */}
            {currentVideo && (
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-200 line-clamp-2">{currentVideo.prompt}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 pt-1">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                      {currentVideo.model}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                      {currentVideo.aspectRatio}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-indigo-300 font-bold">
                      {currentVideo.resolution}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={currentVideo.videoUrl}
                    download={`veo-ai-video-${Date.now()}.mp4`}
                    className="py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                  >
                    <Download className="w-4 h-4" /> Export MP4
                  </a>

                  {onOpenYouTubePublish && (
                    <button
                      type="button"
                      onClick={() => onOpenYouTubePublish({ type: "video", data: currentVideo })}
                      className="py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20"
                    >
                      <Youtube className="w-4 h-4 fill-current" /> Post to YouTube
                    </button>
                  )}

                  {onSendToTimeline && (
                    <button
                      type="button"
                      onClick={() => onSendToTimeline(currentVideo.prompt, currentVideo.videoUrl)}
                      className="py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-zinc-700 sm:col-span-2"
                    >
                      <Film className="w-4 h-4 text-purple-400" /> Send to Timeline
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
