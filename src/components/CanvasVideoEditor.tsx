import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Video,
  Layers,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Camera,
  Film,
  Music,
  Maximize2
} from "lucide-react";
import { StoryboardScene } from "../types";

interface CanvasVideoEditorProps {
  initialScenes?: StoryboardScene[];
}

export const CanvasVideoEditor: React.FC<CanvasVideoEditorProps> = ({
  initialScenes,
}) => {
  const [scenes, setScenes] = useState<StoryboardScene[]>(
    initialScenes || [
      {
        id: "s1",
        sceneNumber: 1,
        duration: 5,
        heading: "CYBERPUNK HIGHWAY",
        visualPrompt: "Neon city skyline with glowing futuristic cars",
        cameraMotion: "fpv_drone",
        narration: "Welcome to the future of AI video generation.",
        musicMood: "Synthesizer",
        subtitle: "Veo AI Studio • 60 FPS Engine",
        imageUrl:
          "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1000&auto=format&fit=crop",
      },
      {
        id: "s2",
        sceneNumber: 2,
        duration: 5,
        heading: "COSMIC WORMHOLE",
        visualPrompt: "Warp speed space flight through glowing nebulae",
        cameraMotion: "zoom_in",
        narration: "Unlimited creativity with zero credit restrictions.",
        musicMood: "Cosmic Orchestral",
        subtitle: "100% Free • High Definition Export",
        imageUrl:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
      },
    ]
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  // Loaded HTML Image elements
  const imageElementsRef = useRef<{ [key: string]: HTMLImageElement }>({});

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  // Preload images
  useEffect(() => {
    scenes.forEach((scene) => {
      if (scene.imageUrl && !imageElementsRef.current[scene.imageUrl]) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = scene.imageUrl;
        imageElementsRef.current[scene.imageUrl] = img;
      }
    });
  }, [scenes]);

  // Update scenes if initialScenes change
  useEffect(() => {
    if (initialScenes && initialScenes.length > 0) {
      setScenes(initialScenes);
      setCurrentTime(0);
    }
  }, [initialScenes]);

  // Animation Loop for 60FPS Canvas Render
  useEffect(() => {
    let animFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // Find current active scene based on currentTime
      let accumulatedTime = 0;
      let activeScene: StoryboardScene | null = null;
      let sceneProgress = 0; // 0.0 to 1.0 within current scene

      for (const scene of scenes) {
        if (
          currentTime >= accumulatedTime &&
          currentTime < accumulatedTime + scene.duration
        ) {
          activeScene = scene;
          sceneProgress = (currentTime - accumulatedTime) / scene.duration;
          break;
        }
        accumulatedTime += scene.duration;
      }

      // Default to last scene if time exceeds
      if (!activeScene && scenes.length > 0) {
        activeScene = scenes[scenes.length - 1];
        sceneProgress = 1.0;
      }

      if (activeScene) {
        const img = activeScene.imageUrl
          ? imageElementsRef.current[activeScene.imageUrl]
          : null;

        if (img && img.complete) {
          ctx.save();

          // Camera Motion Calculations (Ken Burns Effect / Pan / Zoom / Drone)
          let scale = 1.0;
          let offsetX = 0;
          let offsetY = 0;

          switch (activeScene.cameraMotion) {
            case "zoom_in":
              scale = 1.0 + sceneProgress * 0.25;
              break;
            case "zoom_out":
              scale = 1.25 - sceneProgress * 0.25;
              break;
            case "pan_left":
              offsetX = sceneProgress * width * 0.1;
              break;
            case "pan_right":
              offsetX = -sceneProgress * width * 0.1;
              break;
            case "crane_up":
              offsetY = sceneProgress * height * 0.1;
              break;
            case "fpv_drone":
              scale = 1.0 + Math.sin(sceneProgress * Math.PI) * 0.15;
              offsetX = Math.sin(sceneProgress * Math.PI * 2) * (width * 0.04);
              break;
            default:
              scale = 1.05;
              break;
          }

          // Center & Apply Transform
          ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.restore();
        } else {
          // Placeholder gradient background if image loading
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, "#0f172a");
          grad.addColorStop(0.5, "#1e1b4b");
          grad.addColorStop(1, "#020617");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = "#94a3b8";
          ctx.font = "24px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(activeScene.heading, width / 2, height / 2);
        }

        // Atmospheric Particle Effect overlay
        const timeFactor = Date.now() * 0.001;
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for (let i = 0; i < 30; i++) {
          const px = ((Math.sin(i * 99 + timeFactor) + 1) / 2) * width;
          const py = ((Math.cos(i * 33 + timeFactor * 0.5) + 1) / 2) * height;
          ctx.beginPath();
          ctx.arc(px, py, (i % 3) + 1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Vignette Overlay
        const vignette = ctx.createRadialGradient(
          width / 2,
          height / 2,
          width * 0.3,
          width / 2,
          height / 2,
          width * 0.75
        );
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, "rgba(0,0,0,0.6)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        // Subtitle Overlay
        if (activeScene.subtitle || activeScene.narration) {
          const text = activeScene.subtitle || activeScene.narration;
          ctx.save();
          ctx.font = "bold 26px sans-serif";
          ctx.textAlign = "center";

          const textWidth = ctx.measureText(text).width;
          const padX = 24;
          const padY = 12;
          const boxY = height - 80;

          // Subtitle pill background
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.beginPath();
          ctx.roundRect(
            width / 2 - textWidth / 2 - padX,
            boxY - padY - 18,
            textWidth + padX * 2,
            44,
            12
          );
          ctx.fill();
          ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Subtitle text
          ctx.fillStyle = "#ffffff";
          ctx.fillText(text, width / 2, boxY);
          ctx.restore();
        }

        // Top Scene Badge
        ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
        ctx.fillRect(16, 16, 180, 36);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`SCENE ${activeScene.sceneNumber}: ${activeScene.heading.slice(0, 14)}`, 28, 38);
      }

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + 0.033; // 30-60fps frame delta
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, currentTime, scenes, totalDuration]);

  // Record Canvas to WebM / MP4 video file
  const handleRecordVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setRecordingProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);

    const stream = canvas.captureStream(60); // 60 FPS stream
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `veo-timeline-export-${Date.now()}.webm`;
      a.click();
      setIsRecording(false);
      setIsPlaying(false);
    };

    mediaRecorder.start();

    // Auto stop when full sequence ends
    const checkInterval = setInterval(() => {
      setCurrentTime((t) => {
        const pct = Math.min(100, Math.floor((t / totalDuration) * 100));
        setRecordingProgress(pct);
        if (t >= totalDuration) {
          clearInterval(checkInterval);
          mediaRecorder.stop();
        }
        return t;
      });
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-semibold mb-2">
            <Sliders className="w-3.5 h-3.5 text-fuchsia-400" /> Interactive Timeline & Canvas Exporter
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Multi-Scene Timeline Canvas Editor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate 60FPS camera motion FX, preview subtitles, and export 100% free high-bitrate WebM/MP4 videos directly from browser memory.
          </p>
        </div>

        <button
          onClick={handleRecordVideo}
          disabled={isRecording}
          className="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isRecording ? `Exporting Video (${recordingProgress}%)...` : "Record & Export 60FPS Video"}</span>
        </button>
      </div>

      {/* Main Canvas Player & Scrubber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Canvas Display Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Player Scrubber Controls */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  onClick={() => setCurrentTime(0)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span>
                  {currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  60 FPS Smooth
                </span>
              </div>
            </div>

            {/* Timeline Progress Bar */}
            <input
              type="range"
              min={0}
              max={totalDuration || 1}
              step={0.05}
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Timeline Tracks & Scene Manager (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-cyan-400" /> Timeline Scenes ({scenes.length})
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  onClick={() => {
                    let startTime = 0;
                    for (let i = 0; i < index; i++) startTime += scenes[i].duration;
                    setCurrentTime(startTime);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    currentTime >=
                      scenes.slice(0, index).reduce((a, b) => a + b.duration, 0) &&
                    currentTime <
                      scenes.slice(0, index + 1).reduce((a, b) => a + b.duration, 0)
                      ? "bg-cyan-950/50 border-cyan-500 text-slate-100 shadow-md ring-1 ring-cyan-500"
                      : "bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-cyan-300">
                      SCENE {scene.sceneNumber}: {scene.heading}
                    </span>
                    <span className="text-[10px] text-slate-500">{scene.duration}s</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{scene.visualPrompt}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                    <span>Camera: {scene.cameraMotion}</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
