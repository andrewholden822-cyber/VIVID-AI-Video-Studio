import React from "react";
import { History, Download, Trash2, Video, Film, Calendar, AlertCircle, Youtube } from "lucide-react";
import { GeneratedVideo } from "../types";
import { PublishableItem } from "./YouTubePublishModal";

interface ProjectHistoryProps {
  savedVideos: GeneratedVideo[];
  onDeleteVideo: (id: string) => void;
  onClearAll: () => void;
  onOpenYouTubePublish?: (item: PublishableItem) => void;
}

export const ProjectHistory: React.FC<ProjectHistoryProps> = ({
  savedVideos,
  onDeleteVideo,
  onClearAll,
  onOpenYouTubePublish,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5 text-emerald-400" /> Saved AI Video Gallery
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Generated AI Videos ({savedVideos.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your previously generated MP4 videos, re-download high-resolution files, or clear gallery.
          </p>
        </div>

        {savedVideos.length > 0 && (
          <button
            onClick={onClearAll}
            className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-center"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        )}
      </div>

      {/* Gallery Grid */}
      {savedVideos.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl p-12 border border-slate-800 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Video className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Generated Videos Saved Yet</h3>
          <p className="text-xs text-slate-400">
            Generate your first AI video using the AI Video Generator tab. All completed MP4 videos will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedVideos.map((video) => (
            <div
              key={video.id}
              className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-3 p-4 flex flex-col justify-between"
            >
              {/* Video Player */}
              <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
                <video
                  src={video.videoUrl}
                  controls
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Video Info */}
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200 line-clamp-2">{video.prompt}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {video.model}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {video.aspectRatio}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {video.resolution}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(video.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>

                  <div className="flex items-center gap-2">
                    {onOpenYouTubePublish && (
                      <button
                        onClick={() => onOpenYouTubePublish({ type: "video", data: video })}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md shadow-red-600/20"
                        title="Post to YouTube"
                      >
                        <Youtube className="w-3.5 h-3.5 fill-current" /> YouTube
                      </button>
                    )}

                    <a
                      href={video.videoUrl}
                      download={`${video.title.replace(/\s+/g, "_")}.mp4`}
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>

                    <button
                      onClick={() => onDeleteVideo(video.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
