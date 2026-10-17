import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { DirectVideoGenerator } from "./components/DirectVideoGenerator";
import { StoryboardStudio } from "./components/StoryboardStudio";
import { CanvasVideoEditor } from "./components/CanvasVideoEditor";
import { PresetLibrary } from "./components/PresetLibrary";
import { ProjectHistory } from "./components/ProjectHistory";
import { ShortsStudio } from "./components/ShortsStudio";
import { PlaylistStudio } from "./components/PlaylistStudio";
import { YouTubePublishModal, PublishableItem } from "./components/YouTubePublishModal";
import { BatchQueueManager } from "./components/BatchQueueManager";
import { GeneratedVideo, StoryboardScene, PresetTemplate, VideoPlaylist, BatchQueueItem } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "direct" | "shorts" | "playlists" | "storyboard" | "editor" | "presets" | "history"
  >("direct");

  const [publishItem, setPublishItem] = useState<PublishableItem | null>(null);

  const [savedVideos, setSavedVideos] = useState<GeneratedVideo[]>(() => {
    try {
      const stored = localStorage.getItem("veo_ai_saved_videos");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<VideoPlaylist[]>(() => {
    try {
      const stored = localStorage.getItem("veo_ai_playlists");
      return stored
        ? JSON.parse(stored)
        : [
            {
              id: "pl-default-1",
              title: "Futuristic Cyberpunk Series",
              description: "High-octane AI videos rendered in 1080p HD",
              category: "Sci-Fi",
              createdAt: Date.now(),
              videos: [],
            },
          ];
    } catch {
      return [];
    }
  });

  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>(() => {
    try {
      const stored = localStorage.getItem("veo_ai_batch_queue");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isBatchPaused, setIsBatchPaused] = useState(false);
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false);

  const [timelineScenes, setTimelineScenes] = useState<StoryboardScene[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem("veo_ai_saved_videos", JSON.stringify(savedVideos));
    } catch (e) {
      console.error("Failed to persist videos to local storage:", e);
    }
  }, [savedVideos]);

  useEffect(() => {
    try {
      localStorage.setItem("veo_ai_playlists", JSON.stringify(playlists));
    } catch (e) {
      console.error("Failed to persist playlists to local storage:", e);
    }
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem("veo_ai_batch_queue", JSON.stringify(batchQueue));
    } catch (e) {
      console.error("Failed to persist batch queue to local storage:", e);
    }
  }, [batchQueue]);

  // Batch Queue Handlers
  const handleEnqueueBatch = (
    items: Omit<BatchQueueItem, "id" | "status" | "progress" | "createdAt">[] | Omit<BatchQueueItem, "id" | "status" | "progress" | "createdAt">
  ) => {
    const itemArray = Array.isArray(items) ? items : [items];
    const newQueueItems: BatchQueueItem[] = itemArray.map((item, idx) => ({
      ...item,
      id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      status: "queued",
      progress: 0,
      createdAt: Date.now(),
    }));

    setBatchQueue((prev) => [...prev, ...newQueueItems]);
  };

  const handleCancelBatchItem = (id: string) => {
    setBatchQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRetryBatchItem = (id: string) => {
    setBatchQueue((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "queued", progress: 0, error: undefined, statusText: undefined } : i
      )
    );
  };

  const handleClearCompletedBatch = () => {
    setBatchQueue((prev) => prev.filter((i) => i.status !== "completed" && i.status !== "failed"));
  };

  const handleClearAllBatch = () => {
    setBatchQueue([]);
  };

  // Background Batch Processor (Sequential Loop)
  useEffect(() => {
    if (isBatchPaused) return;

    const isRendering = batchQueue.some((i) => i.status === "rendering");
    if (isRendering) return;

    const nextItem = batchQueue.find((i) => i.status === "queued");
    if (!nextItem) return;

    let isCancelled = false;

    const processItem = async () => {
      setBatchQueue((prev) =>
        prev.map((i) =>
          i.id === nextItem.id
            ? {
                ...i,
                status: "rendering",
                progress: 5,
                statusText: "Initializing Veo video generation engine...",
              }
            : i
        )
      );

      try {
        const startRes = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: nextItem.prompt,
            model: nextItem.model,
            aspectRatio: nextItem.aspectRatio,
            resolution: nextItem.resolution,
            startImage: nextItem.startImage,
            lastFrameImage: nextItem.lastFrameImage,
          }),
        });

        const startData = await startRes.json();
        if (!startRes.ok || !startData.operationName) {
          throw new Error(startData.error || "Failed to start batch video generation.");
        }

        const operationName = startData.operationName;

        setBatchQueue((prev) =>
          prev.map((i) =>
            i.id === nextItem.id
              ? {
                  ...i,
                  progress: 20,
                  statusText: "Synthesizing visual keyframes & motion vectors...",
                }
              : i
          )
        );

        let isDone = false;
        let attempts = 0;
        const maxAttempts = 120;

        while (!isDone && attempts < maxAttempts && !isCancelled) {
          attempts++;
          await new Promise((r) => setTimeout(r, 2500));

          const statusRes = await fetch("/api/video-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName }),
          });

          const statusData = await statusRes.json();
          if (statusData.error) {
            throw new Error(statusData.error.message || "Server error during video synthesis.");
          }

          if (statusData.done) {
            isDone = true;
            setBatchQueue((prev) =>
              prev.map((i) =>
                i.id === nextItem.id
                  ? {
                      ...i,
                      progress: 90,
                      statusText: "Finalizing HD MP4 video encoding...",
                    }
                  : i
              )
            );
          } else {
            const progress = Math.min(88, 20 + Math.floor(attempts * 1.5));
            const statusMessages = [
              "Rendering spatial depth & motion lighting...",
              "Calculating camera pan & frame transitions...",
              "Upscaling texture details to HD resolution...",
              "Executing temporal motion synthesis...",
              "Polishing visual lighting and atmosphere...",
            ];
            const statusText = statusMessages[attempts % statusMessages.length];

            setBatchQueue((prev) =>
              prev.map((i) => (i.id === nextItem.id ? { ...i, progress, statusText } : i))
            );
          }
        }

        if (!isDone) {
          throw new Error("Batch item generation timed out.");
        }

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
          title: nextItem.title || nextItem.prompt.slice(0, 32) + "...",
          prompt: nextItem.prompt,
          videoUrl,
          model: nextItem.model,
          aspectRatio: nextItem.aspectRatio,
          resolution: nextItem.resolution,
          createdAt: Date.now(),
          durationSec: nextItem.durationSec || 5,
          cameraMotion: nextItem.cameraMotion,
          style: nextItem.style,
        };

        handleVideoGenerated(newVideo);

        if (nextItem.targetPlaylistId) {
          handleAddVideoToPlaylist(nextItem.targetPlaylistId, newVideo);
        }

        setBatchQueue((prev) =>
          prev.map((i) =>
            i.id === nextItem.id
              ? {
                  ...i,
                  status: "completed",
                  progress: 100,
                  statusText: "Completed successfully!",
                  videoUrl,
                  completedAt: Date.now(),
                }
              : i
          )
        );
      } catch (err: any) {
        setBatchQueue((prev) =>
          prev.map((i) =>
            i.id === nextItem.id
              ? {
                  ...i,
                  status: "failed",
                  progress: 0,
                  error: err?.message || "Generation error",
                }
              : i
          )
        );
      }
    };

    processItem();

    return () => {
      isCancelled = true;
    };
  }, [batchQueue, isBatchPaused]);

  const handleVideoGenerated = (video: GeneratedVideo) => {
    setSavedVideos((prev) => [video, ...prev]);
  };

  const handleDeleteVideo = (id: string) => {
    setSavedVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear all saved video history?")) {
      setSavedVideos([]);
    }
  };

  const handleSendToTimeline = (prompt: string, videoUrl?: string) => {
    const newScene: StoryboardScene = {
      id: `scene-${Date.now()}`,
      sceneNumber: timelineScenes.length + 1,
      duration: 5,
      heading: prompt.slice(0, 20).toUpperCase(),
      visualPrompt: prompt,
      cameraMotion: "fpv_drone",
      narration: prompt.slice(0, 40),
      musicMood: "Cinematic",
      subtitle: prompt.slice(0, 30),
      imageUrl: videoUrl || undefined,
    };
    setTimelineScenes((prev) => [...prev, newScene]);
    setActiveTab("editor");
  };

  const handleSelectPreset = (preset: PresetTemplate) => {
    setActiveTab("direct");
  };

  const handleSendStoryboardToTimeline = (scenes: StoryboardScene[]) => {
    setTimelineScenes(scenes);
    setActiveTab("editor");
  };

  // Playlist Management
  const handleCreatePlaylist = (title: string, description: string, category: string, customId?: string): string => {
    const newId = customId || `pl-${Date.now()}`;
    const newPl: VideoPlaylist = {
      id: newId,
      title,
      description,
      category,
      createdAt: Date.now(),
      videos: [],
    };
    setPlaylists((prev) => [newPl, ...prev]);
    return newId;
  };

  const handleAddVideoToPlaylist = (playlistId: string, video: GeneratedVideo) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          if (pl.videos.some((v) => v.id === video.id)) return pl;
          return { ...pl, videos: [...pl.videos, video] };
        }
        return pl;
      })
    );
  };

  const handleRemoveVideoFromPlaylist = (playlistId: string, videoId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          return { ...pl, videos: pl.videos.filter((v) => v.id !== videoId) };
        }
        return pl;
      })
    );
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedVideosCount={savedVideos.length}
        batchQueueCount={batchQueue.length}
        onOpenBatchQueue={() => setIsBatchDrawerOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === "direct" && (
          <DirectVideoGenerator
            onVideoGenerated={handleVideoGenerated}
            onSendToTimeline={handleSendToTimeline}
            onOpenYouTubePublish={(item) => setPublishItem(item)}
            onEnqueueBatch={handleEnqueueBatch}
          />
        )}

        {activeTab === "shorts" && (
          <ShortsStudio
            onVideoGenerated={handleVideoGenerated}
            onOpenYouTubePublish={(item) => setPublishItem(item)}
          />
        )}

        {activeTab === "playlists" && (
          <PlaylistStudio
            savedVideos={savedVideos}
            playlists={playlists}
            onCreatePlaylist={handleCreatePlaylist}
            onAddVideoToPlaylist={handleAddVideoToPlaylist}
            onRemoveVideoFromPlaylist={handleRemoveVideoFromPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onVideoGenerated={handleVideoGenerated}
            onOpenYouTubePublish={(item) => setPublishItem(item)}
            onEnqueueBatch={handleEnqueueBatch}
          />
        )}

        {activeTab === "storyboard" && (
          <StoryboardStudio onSendToTimelineEditor={handleSendStoryboardToTimeline} />
        )}

        {activeTab === "editor" && (
          <CanvasVideoEditor initialScenes={timelineScenes} />
        )}

        {activeTab === "presets" && (
          <PresetLibrary
            onSelectPreset={handleSelectPreset}
            onEnqueueBatch={handleEnqueueBatch}
          />
        )}

        {activeTab === "history" && (
          <ProjectHistory
            savedVideos={savedVideos}
            onDeleteVideo={handleDeleteVideo}
            onClearAll={handleClearAllHistory}
            onOpenYouTubePublish={(item) => setPublishItem(item)}
          />
        )}
      </main>

      {/* Batch Queue Manager Floating Drawer & Widget */}
      <BatchQueueManager
        queue={batchQueue}
        isPaused={isBatchPaused}
        isOpen={isBatchDrawerOpen}
        onClose={() => setIsBatchDrawerOpen(false)}
        onOpen={() => setIsBatchDrawerOpen(true)}
        onTogglePause={() => setIsBatchPaused((prev) => !prev)}
        onEnqueueBatch={handleEnqueueBatch}
        onCancelItem={handleCancelBatchItem}
        onRetryItem={handleRetryBatchItem}
        onClearCompleted={handleClearCompletedBatch}
        onClearAll={handleClearAllBatch}
        onOpenYouTubePublish={(item) => setPublishItem(item)}
      />

      {/* YouTube Publish Modal */}

      {/* YouTube Publish Modal */}
      {publishItem && (
        <YouTubePublishModal
          item={publishItem}
          onClose={() => setPublishItem(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 VIVID AI Studio • Powered by Google Veo 3.1 & Gemini 2.5 Flash</p>
          <div className="flex items-center gap-4 text-zinc-400">
            <span className="text-indigo-400 font-bold">100% Free & Unlimited</span>
            <span>•</span>
            <span>HD & 4K Ultra HD</span>
            <span>•</span>
            <span>Shorts & Playlists Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
