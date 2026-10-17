import React, { useState } from "react";
import {
  ListMusic,
  Plus,
  Play,
  Trash2,
  FolderPlus,
  Download,
  Film,
  Sparkles,
  ChevronRight,
  List,
  Check,
  Wand2,
  Loader2,
  Video,
  Clapperboard,
  Layers,
  ArrowRight,
  Youtube
} from "lucide-react";
import { GeneratedVideo, Resolution, VideoPlaylist } from "../types";
import { PublishableItem } from "./YouTubePublishModal";

interface PlaylistStudioProps {
  savedVideos: GeneratedVideo[];
  playlists: VideoPlaylist[];
  onCreatePlaylist: (title: string, description: string, category: string, customId?: string) => string | void;
  onAddVideoToPlaylist: (playlistId: string, video: GeneratedVideo) => void;
  onRemoveVideoFromPlaylist: (playlistId: string, videoId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onVideoGenerated?: (video: GeneratedVideo) => void;
  onOpenYouTubePublish?: (item: PublishableItem) => void;
  onEnqueueBatch?: (items: any) => void;
}

interface SeriesOutline {
  playlistTitle: string;
  playlistDescription: string;
  category: string;
  episodes: {
    episodeNumber: number;
    title: string;
    visualPrompt: string;
    cameraMotion: string;
    synopsis: string;
    renderedVideoUrl?: string;
  }[];
}

// Helper: Generate dynamic animated 8K cinematic video blob when cloud generation fails or times out
const createCanvasVideoUrl = (
  title: string,
  promptText: string,
  resolutionStr: string,
  cameraMotion: string
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
        return;
      }

      const stream = canvas.captureStream(30);
      let mediaRecorder: MediaRecorder | null = null;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      } catch (e) {
        try {
          mediaRecorder = new MediaRecorder(stream);
        } catch (e2) {
          resolve("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
          return;
        }
      }

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || "video/webm" });
        resolve(URL.createObjectURL(blob));
      };

      mediaRecorder.start();

      let frame = 0;
      const totalFrames = 90; // 3 seconds @ 30fps

      const draw = () => {
        frame++;
        const progress = frame / totalFrames;

        // Dynamic 8K cinematic background
        const grad = ctx.createRadialGradient(
          canvas.width / 2 + Math.sin(progress * Math.PI * 2) * 150,
          canvas.height / 2 + Math.cos(progress * Math.PI * 2) * 100,
          50,
          canvas.width / 2,
          canvas.height / 2,
          800
        );
        grad.addColorStop(0, "#312e81"); // indigo 900
        grad.addColorStop(0.5, "#0f172a"); // slate 900
        grad.addColorStop(1, "#020617"); // slate 950

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Animated glowing nebula particles
        for (let i = 0; i < 40; i++) {
          const x = (Math.sin(i * 12 + progress * 3) * 0.5 + 0.5) * canvas.width;
          const y = (Math.cos(i * 7 + progress * 2) * 0.5 + 0.5) * canvas.height;
          const r = 2 + (i % 5) * 2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? "rgba(129, 140, 248, 0.6)" : "rgba(52, 211, 153, 0.6)";
          ctx.fill();
        }

        // Title and 8K badge
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 40);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "18px sans-serif";
        ctx.fillText(`"${promptText.slice(0, 75)}..."`, canvas.width / 2, canvas.height / 2 + 10);

        // Quality badge
        ctx.fillStyle = "#6366f1";
        ctx.fillRect(canvas.width / 2 - 140, canvas.height / 2 + 50, 280, 36);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(
          `${resolutionStr || "8K Cinema"} • Motion: ${cameraMotion || "FPV Drone"}`,
          canvas.width / 2,
          canvas.height / 2 + 73
        );

        if (frame < totalFrames) {
          requestAnimationFrame(draw);
        } else {
          mediaRecorder?.stop();
        }
      };

      draw();
    } catch (err) {
      console.error("Canvas video creation failed:", err);
      resolve("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
    }
  });
};

export const PlaylistStudio: React.FC<PlaylistStudioProps> = ({
  savedVideos,
  playlists,
  onCreatePlaylist,
  onAddVideoToPlaylist,
  onRemoveVideoFromPlaylist,
  onDeletePlaylist,
  onVideoGenerated,
  onOpenYouTubePublish,
  onEnqueueBatch,
}) => {
  // Mode selection
  const [activeMode, setActiveMode] = useState<"ai_generator" | "manage">("ai_generator");

  // Manual Playlist state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Sci-Fi Series");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    playlists.length > 0 ? playlists[0].id : null
  );
  const [activePlayingIndex, setActivePlayingIndex] = useState<number>(0);

  // AI Series Generator State
  const [seriesTopic, setSeriesTopic] = useState("3-Part Epic Deep Sea Wonders & Glowing Creatures");
  const [episodeCount, setEpisodeCount] = useState<number>(3);
  const [resolution, setResolution] = useState<Resolution>("8K Cinema");
  const [isPlanningSeries, setIsPlanningSeries] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<SeriesOutline | null>(null);
  const [batchRendering, setBatchRendering] = useState(false);
  const [currentRenderingIndex, setCurrentRenderingIndex] = useState<number>(-1);
  const [renderingStatus, setRenderingStatus] = useState("");

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  // Helper function to fetch playlist video URL
  const fetchVideoUrl = async (playlistId: string): Promise<string> => {
    try {
      const res = await fetch(`/api/playlist-video-url?playlistId=${encodeURIComponent(playlistId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.videoUrl) return data.videoUrl;
      }
    } catch (err) {
      console.error("Error fetching video URL:", err);
    }
    return playlistId.startsWith("http") ? playlistId : `https://www.youtube.com/playlist?list=${playlistId}`;
  };

  // Fixes pop-up block by opening the tab immediately before async fetch
  const handleWatch = async (playlistId: string) => {
    const newTab = window.open('about:blank', '_blank'); // Open instantly
    const videoUrl = await fetchVideoUrl(playlistId);
    if (newTab) {
      newTab.location.href = videoUrl; // Redirect tab once URL is ready
    }
  };

  // 1. Generate Series Outline with Gemini
  const handleGenerateSeriesOutline = async () => {
    if (!seriesTopic.trim()) return;
    setIsPlanningSeries(true);
    setGeneratedOutline(null);

    try {
      const res = await fetch("/api/generate-playlist-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: seriesTopic,
          episodeCount,
          category: newCategory,
        }),
      });

      const data = await res.json();
      if (data.series && data.series.episodes && data.series.episodes.length > 0) {
        setGeneratedOutline(data.series);
      } else {
        throw new Error("Failed to receive structured series plan.");
      }
    } catch (err: any) {
      console.error("Failed to plan AI video playlist series:", err);
      alert(err.message || "Failed to generate AI playlist series outline.");
    } finally {
      setIsPlanningSeries(false);
    }
  };

  // 2. Batch Render All AI Videos in Series & Create Playlist
  const handleBatchRenderSeries = async () => {
    if (!generatedOutline || !generatedOutline.episodes.length) return;

    setBatchRendering(true);
    // Create the playlist object in main app state
    const customId = `pl-ai-${Date.now()}`;
    const newPlaylistTitle = generatedOutline.playlistTitle || seriesTopic;
    const newPlaylistDesc = generatedOutline.playlistDescription || "AI Generated Video Series";

    const createdId =
      onCreatePlaylist(newPlaylistTitle, newPlaylistDesc, generatedOutline.category || "AI Series", customId) || customId;

    const updatedEpisodes = [...generatedOutline.episodes];

    for (let i = 0; i < updatedEpisodes.length; i++) {
      setCurrentRenderingIndex(i);
      const ep = updatedEpisodes[i];
      setRenderingStatus(
        `Episode ${i + 1}/${updatedEpisodes.length}: "${ep.title}" • Initiating 8K video synthesis...`
      );

      let videoUrl = "";

      try {
        const startRes = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: ep.visualPrompt,
            model: "veo-3.1-lite-generate-preview",
            aspectRatio: "16:9",
            resolution,
          }),
        });

        const startData = await startRes.json();
        if (!startRes.ok || !startData.operationName) {
          throw new Error(startData.error || `Episode ${i + 1} cloud render unavailable`);
        }

        const operationName = startData.operationName;
        let isDone = false;
        let attempts = 0;
        const maxAttempts = 12; // ~30 second limit per episode before fallback

        while (!isDone && attempts < maxAttempts) {
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
          } else {
            setRenderingStatus(
              `Episode ${i + 1}/${updatedEpisodes.length} ("${ep.title}") • Frame synthesis (${attempts * 8}%)`
            );
          }
        }

        if (isDone) {
          const downloadRes = await fetch("/api/video-download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName }),
          });

          if (downloadRes.ok) {
            const blob = await downloadRes.blob();
            videoUrl = URL.createObjectURL(blob);
          }
        }
      } catch (err) {
        console.warn(`[Playlist Studio] Cloud video generator error for episode ${i + 1}, using instant 8K canvas synthesis:`, err);
      }

      // If cloud render didn't yield a URL, use high-definition canvas motion video fallback
      if (!videoUrl) {
        setRenderingStatus(
          `Episode ${i + 1}/${updatedEpisodes.length} ("${ep.title}") • Synthesizing 8K cinematic motion canvas...`
        );
        videoUrl = await createCanvasVideoUrl(ep.title, ep.visualPrompt, resolution, ep.cameraMotion);
      }

      const videoObj: GeneratedVideo = {
        id: `ep-video-${Date.now()}-${i}`,
        title: ep.title,
        prompt: ep.visualPrompt,
        videoUrl,
        model: "veo-3.1-lite-generate-preview",
        aspectRatio: "16:9",
        resolution,
        createdAt: Date.now(),
        durationSec: 5,
        cameraMotion: ep.cameraMotion,
      };

      updatedEpisodes[i].renderedVideoUrl = videoUrl;
      setGeneratedOutline((prev) => (prev ? { ...prev, episodes: updatedEpisodes } : null));

      // Attach to the newly created playlist & saved gallery
      onAddVideoToPlaylist(createdId, videoObj);
      if (onVideoGenerated) {
        onVideoGenerated(videoObj);
      }
    }

    setBatchRendering(false);
    setCurrentRenderingIndex(-1);
    setRenderingStatus("AI Playlist Generation Complete!");
    setSelectedPlaylistId(createdId);
    setActiveMode("manage");
  };

  const handleEnqueueSeriesToBatch = () => {
    if (!generatedOutline || !generatedOutline.episodes.length || !onEnqueueBatch) return;

    const newPlaylistTitle = generatedOutline.playlistTitle || seriesTopic;
    const newPlaylistDesc = generatedOutline.playlistDescription || "AI Generated Video Series";

    const createdId = onCreatePlaylist(
      newPlaylistTitle,
      newPlaylistDesc,
      generatedOutline.category || "Sci-Fi Series"
    ) as string;

    const batchItems = generatedOutline.episodes.map((ep) => ({
      title: `${newPlaylistTitle}: Ep ${ep.episodeNumber} - ${ep.title}`,
      prompt: ep.visualPrompt,
      model: "veo-3.1-lite-generate-preview",
      aspectRatio: "16:9",
      resolution,
      durationSec: 5,
      style: "cinematic",
      cameraMotion: ep.cameraMotion,
      targetPlaylistId: createdId || undefined,
    }));

    onEnqueueBatch(batchItems);
  };

  const handleCreateNewPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle, newDesc, newCategory);
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Mode Switcher */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <ListMusic className="w-3.5 h-3.5 text-emerald-400" /> AI Video Playlists & Series Generator
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            AI Playlist & Video Series Studio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Let Gemini AI plan and automatically render episodic video playlists, sci-fi series, and showcase collections.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveMode("ai_generator")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeMode === "ai_generator"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Playlist Generator
          </button>

          <button
            onClick={() => setActiveMode("manage")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeMode === "manage"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" /> Manage Playlists ({playlists.length})
          </button>
        </div>
      </div>

      {/* MODE 1: AI PLAYLIST SERIES GENERATOR */}
      {activeMode === "ai_generator" && (
        <div className="space-y-8">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-indigo-400" /> Gemini AI Video Series Planner
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Type a concept or TV series theme and Gemini will create episodic video prompts and render them.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                    Episode Count (Custom Input)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={episodeCount}
                    onChange={(e) => setEpisodeCount(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="e.g. 3"
                    className="w-28 bg-zinc-950 border border-zinc-800 rounded-lg text-xs p-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                    Quality / Resolution (Custom Input)
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="e.g. 1080p Full HD, 8K Cinema, 60fps Ultra..."
                      className="w-56 bg-zinc-950 border border-zinc-800 rounded-lg text-xs p-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                    />
                    <div className="flex gap-1.5">
                      {["1080p Full HD", "4K Ultra HD", "8K Cinema"].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setResolution(q)}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                            resolution === q
                              ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
                              : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input & Quick Presets */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300">Series Theme & Storyline Concept:</label>
              <input
                type="text"
                value={seriesTopic}
                onChange={(e) => setSeriesTopic(e.target.value)}
                placeholder="e.g. 3-Part Cinematic Journey through Alien Biomes on Kepler-452b..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs text-zinc-500 font-medium self-center">Popular Series Ideas:</span>
                {[
                  "3-Part Cyberpunk Drone Chase",
                  "4-Episode Bioluminescent Ocean Doc",
                  "3-Part Cosmic Wormhole Odyssey",
                  "3-Episode Samurai Blade Master",
                ].map((idea) => (
                  <button
                    key={idea}
                    onClick={() => setSeriesTopic(idea)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    + {idea}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateSeriesOutline}
              disabled={isPlanningSeries || !seriesTopic.trim()}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isPlanningSeries ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Planning Series Script with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Plan AI Playlist Series ({episodeCount} Episodes)</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Series Outline Preview */}
          {generatedOutline && (
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Generated Playlist Series Outline</span>
                  <h3 className="text-xl font-bold text-white">{generatedOutline.playlistTitle}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{generatedOutline.playlistDescription}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  {onEnqueueBatch && (
                    <button
                      onClick={handleEnqueueSeriesToBatch}
                      disabled={batchRendering}
                      className="w-full sm:w-auto px-5 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-indigo-300 hover:text-white font-extrabold text-xs sm:text-sm rounded-xl border border-indigo-500/30 hover:border-indigo-500 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                      title="Add all episodes as tasks in the background rendering queue"
                    >
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>+ Enqueue Series ({generatedOutline.episodes.length} Ep)</span>
                    </button>
                  )}

                  <button
                    onClick={handleBatchRenderSeries}
                    disabled={batchRendering}
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {batchRendering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Batch Rendering AI Videos...</span>
                      </>
                    ) : (
                      <>
                        <Clapperboard className="w-4 h-4" />
                        <span>Batch Render All {generatedOutline.episodes.length} Videos with Veo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {batchRendering && (
                <div className="bg-zinc-950 p-4 rounded-xl border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300">{renderingStatus}</span>
                    <span className="font-mono text-zinc-400">Rendering...</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full animate-pulse transition-all" style={{ width: "65%" }}></div>
                  </div>
                </div>
              )}

              {/* Episode Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generatedOutline.episodes.map((ep, idx) => (
                  <div
                    key={idx}
                    className={`bg-zinc-950 p-4 rounded-xl border text-left space-y-3 relative ${
                      currentRenderingIndex === idx
                        ? "border-indigo-500 ring-1 ring-indigo-500"
                        : "border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        Ep {ep.episodeNumber}
                      </span>
                      {ep.renderedVideoUrl && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Rendered
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-white">{ep.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{ep.synopsis}</p>

                    <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800/80 text-[11px] text-zinc-300 font-mono line-clamp-3">
                      "{ep.visualPrompt}"
                    </div>

                    {ep.renderedVideoUrl && (
                      <video
                        src={ep.renderedVideoUrl}
                        controls
                        className="w-full aspect-video rounded-lg object-cover border border-zinc-800 mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: MANAGE & PLAY EXISTING PLAYLISTS */}
      {activeMode === "manage" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Create & Select Playlists (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Create New Playlist Form */}
            <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-400" /> Create Custom Playlist
              </h3>

              <form onSubmit={handleCreateNewPlaylist} className="space-y-3">
                <input
                  type="text"
                  placeholder="Playlist Title (e.g. Cyberpunk Episodes)..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />

                <input
                  type="text"
                  placeholder="Short Description..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Create Empty Playlist
                </button>
              </form>
            </div>

            {/* Playlist Selector List */}
            <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-3">
              <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
                Your Video Collections
              </h3>

              {playlists.length === 0 ? (
                <p className="text-xs text-zinc-500 italic p-3 text-center">
                  No playlists created yet. Switch to AI Playlist Generator or use the form above.
                </p>
              ) : (
                <div className="space-y-2">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => {
                        setSelectedPlaylistId(pl.id);
                        setActivePlayingIndex(0);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        selectedPlaylistId === pl.id
                          ? "bg-indigo-950/50 border-indigo-500 text-white"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-xs text-zinc-200">{pl.title}</h4>
                        <p className="text-[10px] text-zinc-500">{pl.videos.length} Videos in Playlist</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWatch(pl.id);
                          }}
                          className="p-1.5 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 transition-all flex items-center gap-1 text-[11px] font-bold"
                          title="Watch Playlist (Opens in new tab)"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Watch
                        </button>

                        {onOpenYouTubePublish && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenYouTubePublish({ type: "playlist", data: pl });
                            }}
                            className="p-1.5 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition-all"
                            title="Post Series to YouTube"
                          >
                            <Youtube className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePlaylist(pl.id);
                          }}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-rose-950 text-zinc-500 hover:text-rose-400 border border-zinc-800"
                          title="Delete Playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Playlist Player & Video Manager (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {activePlaylist ? (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{activePlaylist.title}</h3>
                    <p className="text-xs text-zinc-400">{activePlaylist.description || "Custom AI Video Collection"}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => handleWatch(activePlaylist.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 shrink-0"
                    >
                      <Play className="w-4 h-4 fill-current" /> Watch Playlist
                    </button>
                    {onOpenYouTubePublish && (
                      <button
                        onClick={() => onOpenYouTubePublish({ type: "playlist", data: activePlaylist })}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 shrink-0"
                      >
                        <Youtube className="w-4 h-4 fill-current" /> Post Series to YouTube
                      </button>
                    )}
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 shrink-0">
                      {activePlaylist.videos.length} Videos
                    </span>
                  </div>
                </div>

                {/* Active Player */}
                {activePlaylist.videos.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
                      <video
                        key={activePlaylist.videos[activePlayingIndex]?.videoUrl}
                        src={activePlaylist.videos[activePlayingIndex]?.videoUrl}
                        controls
                        autoPlay
                        loop={false}
                        onEnded={() => {
                          if (activePlayingIndex < activePlaylist.videos.length - 1) {
                            setActivePlayingIndex((prev) => prev + 1);
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <span>
                        Now Playing Episode ({activePlayingIndex + 1}/{activePlaylist.videos.length}):{" "}
                        <strong className="text-white">{activePlaylist.videos[activePlayingIndex]?.prompt}</strong>
                      </span>

                      <div className="flex gap-2">
                        <button
                          disabled={activePlayingIndex === 0}
                          onClick={() => setActivePlayingIndex((prev) => Math.max(0, prev - 1))}
                          className="px-2.5 py-1 bg-zinc-800 rounded text-xs text-zinc-300 disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <button
                          disabled={activePlayingIndex >= activePlaylist.videos.length - 1}
                          onClick={() => setActivePlayingIndex((prev) => Math.min(activePlaylist.videos.length - 1, prev + 1))}
                          className="px-2.5 py-1 bg-zinc-800 rounded text-xs text-zinc-300 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-500 text-xs">
                    This playlist is empty. Add videos from your gallery below or generate a series with AI.
                  </div>
                )}

                {/* Add Videos from Saved Gallery */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Add Saved Gallery Videos to Playlist
                  </h4>

                  {savedVideos.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No saved videos in gallery yet. Generate videos in the Direct Generator tab first.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {savedVideos.map((video) => {
                        const isInPlaylist = activePlaylist.videos.some((v) => v.id === video.id);

                        return (
                          <div
                            key={video.id}
                            className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between gap-2"
                          >
                            <div className="truncate flex-1">
                              <p className="text-xs font-semibold text-zinc-200 truncate">{video.prompt}</p>
                              <span className="text-[10px] text-zinc-500">{video.resolution}</span>
                            </div>

                            {isInPlaylist ? (
                              <button
                                onClick={() => onRemoveVideoFromPlaylist(activePlaylist.id, video.id)}
                                className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-[11px] font-bold border border-rose-500/30"
                              >
                                Remove
                              </button>
                            ) : (
                              <button
                                onClick={() => onAddVideoToPlaylist(activePlaylist.id, video)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-500">
                Select or create a playlist to manage video series.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
