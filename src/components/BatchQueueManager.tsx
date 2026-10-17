import React, { useState } from "react";
import {
  Layers,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  X,
  Video,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Film,
  Sliders,
} from "lucide-react";
import {
  BatchQueueItem,
  VideoModel,
  AspectRatio,
  Resolution,
  VideoStyle,
  CameraMotion,
} from "../types";

interface BatchQueueManagerProps {
  queue: BatchQueueItem[];
  isPaused: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onTogglePause: () => void;
  onEnqueueBatch: (
    items: Omit<BatchQueueItem, "id" | "status" | "progress" | "createdAt">[]
  ) => void;
  onCancelItem: (id: string) => void;
  onRetryItem: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onOpenYouTubePublish?: (item: { type: "video"; data: any }) => void;
}

export const BatchQueueManager: React.FC<BatchQueueManagerProps> = ({
  queue,
  isPaused,
  isOpen,
  onClose,
  onOpen,
  onTogglePause,
  onEnqueueBatch,
  onCancelItem,
  onRetryItem,
  onClearCompleted,
  onClearAll,
  onOpenYouTubePublish,
}) => {
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchPromptsText, setBatchPromptsText] = useState("");
  const [batchModel, setBatchModel] = useState<VideoModel>("veo-3.1-generate-preview");
  const [batchAspectRatio, setBatchAspectRatio] = useState<AspectRatio>("16:9");
  const [batchResolution, setBatchResolution] = useState<Resolution>("1080p Full HD");
  const [batchStyle, setBatchStyle] = useState<VideoStyle>("cinematic");
  const [batchCameraMotion, setBatchCameraMotion] = useState<CameraMotion>("dolly_forward");

  const queuedCount = queue.filter((i) => i.status === "queued").length;
  const renderingItem = queue.find((i) => i.status === "rendering");
  const completedCount = queue.filter((i) => i.status === "completed").length;
  const failedCount = queue.filter((i) => i.status === "failed").length;

  const handleAddBatchPrompts = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = batchPromptsText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newItems = lines.map((promptText, idx) => ({
      title: promptText.slice(0, 36) + (promptText.length > 36 ? "..." : ""),
      prompt: promptText,
      model: batchModel,
      aspectRatio: batchAspectRatio,
      resolution: batchResolution,
      durationSec: 5,
      style: batchStyle,
      cameraMotion: batchCameraMotion,
    }));

    onEnqueueBatch(newItems);
    setBatchPromptsText("");
    setShowBatchModal(false);
  };

  return (
    <>
      {/* Floating Bottom-Right Active Queue Widget */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3">
        {renderingItem && (
          <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md animate-pulse">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <div className="text-xs">
              <p className="font-bold text-white truncate max-w-[180px]">
                {renderingItem.title}
              </p>
              <p className="text-[10px] text-indigo-300 font-mono">
                Rendering {renderingItem.progress}%
              </p>
            </div>
            <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-zinc-700">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${renderingItem.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={onOpen}
          className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2.5 shadow-xl shadow-indigo-600/30 border border-indigo-400/30 transition-all hover:scale-105 active:scale-95 group"
        >
          <Layers className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
          <span>Batch Queue</span>
          {queue.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-zinc-950/80 text-indigo-300 text-[11px] font-extrabold border border-indigo-400/30">
              {renderingItem ? "Rendering" : `${queuedCount} queued`}
            </span>
          )}
        </button>
      </div>

      {/* Main Slide-over Drawer / Modal Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Background Batch Render Queue
                    {isPaused && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold rounded">
                        Paused
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Process multiple AI video generation requests sequentially in the background.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats & Controls Bar */}
            <div className="p-4 bg-zinc-900/30 border-b border-zinc-800/60 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Queued</span>
                  <span className="text-sm font-extrabold text-amber-400">{queuedCount}</span>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Active</span>
                  <span className="text-sm font-extrabold text-indigo-400">
                    {renderingItem ? "1" : "0"}
                  </span>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Completed</span>
                  <span className="text-sm font-extrabold text-emerald-400">{completedCount}</span>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Failed</span>
                  <span className="text-sm font-extrabold text-red-400">{failedCount}</span>
                </div>
              </div>

              {/* Toolbar Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onTogglePause}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isPaused
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? "Resume Processing" : "Pause Queue"}</span>
                  </button>

                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Batch Prompts</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {completedCount > 0 && (
                    <button
                      onClick={onClearCompleted}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-all"
                    >
                      Clear Done
                    </button>
                  )}
                  {queue.length > 0 && (
                    <button
                      onClick={onClearAll}
                      className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-medium border border-red-800/40 transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Queue Item List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {queue.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-300">The batch queue is empty</h4>
                    <p className="text-xs text-zinc-500 max-w-sm">
                      Enqueue video requests from the AI Video Generator, Preset Library, or paste multiple prompts at once to process in the background.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" /> Add Batch Prompts
                  </button>
                </div>
              ) : (
                queue.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      item.status === "rendering"
                        ? "bg-indigo-950/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                        : item.status === "completed"
                        ? "bg-zinc-900/80 border-emerald-500/30"
                        : item.status === "failed"
                        ? "bg-red-950/20 border-red-800/40"
                        : "bg-zinc-900/50 border-zinc-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status Pill */}
                          {item.status === "queued" && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Queued
                            </span>
                          )}
                          {item.status === "rendering" && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold uppercase flex items-center gap-1 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Rendering {item.progress}%
                            </span>
                          )}
                          {item.status === "completed" && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          )}
                          {item.status === "failed" && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          )}

                          <span className="text-[10px] text-zinc-500 font-mono">
                            {item.aspectRatio} • {item.resolution}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                          {item.prompt}
                        </h4>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {item.status === "failed" && (
                          <button
                            onClick={() => onRetryItem(item.id)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1"
                            title="Retry Item"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onCancelItem(item.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          title="Remove from Queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Status Text for Rendering Item */}
                    {item.status === "rendering" && (
                      <div className="space-y-1.5 pt-1">
                        <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-indigo-300 font-mono italic truncate">
                          {item.statusText || "Processing video synthesis..."}
                        </p>
                      </div>
                    )}

                    {/* Error Message if Failed */}
                    {item.status === "failed" && item.error && (
                      <p className="text-[11px] text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-900/50">
                        Error: {item.error}
                      </p>
                    )}

                    {/* Completed Video Preview / Action */}
                    {item.status === "completed" && item.videoUrl && (
                      <div className="pt-2 flex items-center justify-between gap-3 border-t border-zinc-800/60">
                        <video
                          src={item.videoUrl}
                          className="w-20 h-12 object-cover rounded-lg bg-black border border-zinc-800"
                          muted
                          playsInline
                        />
                        <div className="flex items-center gap-2">
                          {onOpenYouTubePublish && (
                            <button
                              onClick={() =>
                                onOpenYouTubePublish({
                                  type: "video",
                                  data: {
                                    title: item.title,
                                    prompt: item.prompt,
                                    videoUrl: item.videoUrl,
                                  },
                                })
                              }
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                            >
                              Publish <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <a
                            href={item.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                          >
                            Play HD <Video className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Batch Prompts Modal Dialog */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Enqueue Batch Video Requests</h3>
                  <p className="text-xs text-zinc-400">
                    Paste multiple video prompts (one prompt per line) to process in sequence.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBatchPrompts} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Video Prompts (1 per line)</span>
                  <span className="text-[10px] text-indigo-400">
                    {batchPromptsText.split("\n").filter((l) => l.trim()).length} prompt(s)
                  </span>
                </label>
                <textarea
                  value={batchPromptsText}
                  onChange={(e) => setBatchPromptsText(e.target.value)}
                  placeholder={`A futuristic neon cyberpunk street with flying cars at night
A majestic golden retriever running through a field of sunflowers in 4K
Hyper-realistic slow motion rain falling over a tranquil Tokyo courtyard
An astronaut floating gracefully inside a holographic space station`}
                  rows={5}
                  required
                  className="w-full p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>

              {/* Batch Configuration Settings */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">Veo Model</label>
                  <select
                    value={batchModel}
                    onChange={(e) => setBatchModel(e.target.value as VideoModel)}
                    className="w-full p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                  >
                    <option value="veo-3.1-generate-preview">Veo 3.1 Studio (1080p)</option>
                    <option value="veo-3.1-lite-generate-preview">Veo 3.1 Lite (Fast)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">Aspect Ratio</label>
                  <select
                    value={batchAspectRatio}
                    onChange={(e) => setBatchAspectRatio(e.target.value as AspectRatio)}
                    className="w-full p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                  >
                    <option value="16:9">16:9 Widescreen</option>
                    <option value="9:16">9:16 Vertical Shorts</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="21:9">21:9 Ultra Cinematic</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">Resolution</label>
                  <select
                    value={batchResolution}
                    onChange={(e) => setBatchResolution(e.target.value as Resolution)}
                    className="w-full p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                  >
                    <option value="1080p Full HD">1080p Full HD</option>
                    <option value="4K Ultra HD">4K Ultra HD</option>
                    <option value="720p HD">720p HD</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!batchPromptsText.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Enqueue Batch (
                    {batchPromptsText.split("\n").filter((l) => l.trim()).length} Videos)
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
