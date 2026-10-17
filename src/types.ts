export type VideoModel = "veo-3.1-lite-generate-preview" | "veo-3.1-generate-preview";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "21:9";

export type Resolution = "720p HD" | "1080p Full HD" | "4K Ultra HD" | string;

export type QueueItemStatus = "queued" | "rendering" | "completed" | "failed";

export interface BatchQueueItem {
  id: string;
  title: string;
  prompt: string;
  model: VideoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  durationSec: number;
  style?: VideoStyle;
  cameraMotion?: CameraMotion;
  startImage?: string;
  lastFrameImage?: string;
  status: QueueItemStatus;
  progress: number;
  statusText?: string;
  error?: string;
  videoUrl?: string;
  createdAt: number;
  completedAt?: number;
  targetPlaylistId?: string;
}

export type CameraMotion =
  | "static"
  | "pan_left"
  | "pan_right"
  | "zoom_in"
  | "zoom_out"
  | "crane_up"
  | "orbit"
  | "dolly_forward"
  | "fpv_drone";

export type VideoStyle =
  | "cinematic"
  | "photorealistic"
  | "cyberpunk"
  | "anime"
  | "unreal_engine"
  | "vintage_8mm"
  | "documentary"
  | "synthwave";

export interface GeneratedVideo {
  id: string;
  title: string;
  prompt: string;
  enhancedPrompt?: string;
  videoUrl: string;
  model: VideoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  createdAt: number;
  durationSec: number;
  thumbnailUrl?: string;
  style?: VideoStyle;
  cameraMotion?: CameraMotion;
  isShort?: boolean;
}

export interface ShortItem {
  id: string;
  title: string;
  hook: string;
  script: string;
  visualPrompt: string;
  captionText: string;
  aspectRatio: "9:16";
  resolution: Resolution;
  videoUrl?: string;
  audioUrl?: string;
  imageUrl?: string;
  isGenerating?: boolean;
  durationSec: number;
}

export interface VideoPlaylist {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: number;
  videos: GeneratedVideo[];
}

export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  duration: number; // in seconds
  heading: string;
  visualPrompt: string;
  cameraMotion: CameraMotion;
  narration: string;
  musicMood: string;
  subtitle: string;
  imageUrl?: string;
  audioUrl?: string;
  isGeneratingImage?: boolean;
  isGeneratingAudio?: boolean;
}

export interface StoryboardScript {
  title: string;
  logline: string;
  scenes: StoryboardScene[];
}

export interface PresetTemplate {
  id: string;
  name: string;
  category: "Sci-Fi" | "Nature" | "Anime" | "Cinematic" | "Abstract" | "Commercial" | "Shorts";
  prompt: string;
  style: VideoStyle;
  cameraMotion: CameraMotion;
  aspectRatio: AspectRatio;
  previewColor: string;
  description: string;
}
