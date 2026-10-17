import React, { useState } from "react";
import {
  Film,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Mic,
  Play,
  Volume2,
  Camera,
  Plus,
  Trash2,
  Sliders,
  Send
} from "lucide-react";
import { StoryboardScene, StoryboardScript } from "../types";

interface StoryboardStudioProps {
  onSendToTimelineEditor?: (scenes: StoryboardScene[]) => void;
}

export const StoryboardStudio: React.FC<StoryboardStudioProps> = ({
  onSendToTimelineEditor,
}) => {
  const [concept, setConcept] = useState(
    "A 3-scene cinematic trailer about an astronaut finding an ancient glowing alien monolith in the ice caverns of Europa"
  );
  const [sceneCount, setSceneCount] = useState<number>(3);
  const [style, setStyle] = useState<string>("Cinematic Sci-Fi");

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [script, setScript] = useState<StoryboardScript | null>({
    title: "Echoes of Europa",
    logline: "A lone astronaut uncovers humanity's oldest secret beneath Europa's frozen crust.",
    scenes: [
      {
        id: "scene-1",
        sceneNumber: 1,
        duration: 5,
        heading: "EXT. EUROPA ICE DESERT - NIGHT",
        visualPrompt: "Solitary astronaut in sleek illuminated suit standing on jagged blue ice plains of Europa under massive glowing Jupiter horizon, volumetric blizzard particles, 8k cinematic render.",
        cameraMotion: "crane_up",
        narration: "For thousands of years, signals echoed through the void of deep space...",
        musicMood: "Atmospheric Ambient Synthesizer",
        subtitle: "Deep Space • Jupiter Moon Europa",
      },
      {
        id: "scene-2",
        sceneNumber: 2,
        duration: 5,
        heading: "INT. ICE CAVERN MONOLITH - CONTINUOUS",
        visualPrompt: "Interior icy subterranean cavern with a tall crystalline ancient alien monolith pulsating with golden bioluminescent runes, camera panning slowly around astronaut looking up in awe.",
        cameraMotion: "orbit",
        narration: "Buried beneath miles of glacial ice, a relic waited to be awakened.",
        musicMood: "Pulsing Bass & Celestial Choir",
        subtitle: "The Discovery",
      },
      {
        id: "scene-3",
        sceneNumber: 3,
        duration: 5,
        heading: "EXT. EUROPA CAVERN EXPLOSION OF LIGHT",
        visualPrompt: "Huge beam of blinding golden energy erupting from alien monolith shooting into the dark Europa sky, astronaut shielding face, cosmic dust particles glowing, epic cinematic finale.",
        cameraMotion: "zoom_out",
        narration: "The universe is no longer silent.",
        musicMood: "Triumphant Orchestral Crescendo",
        subtitle: "Coming Soon",
      },
    ],
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate Script
  const handleGenerateScript = async () => {
    if (!concept.trim()) return;
    setIsGeneratingScript(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, sceneCount, style }),
      });

      const data = await res.json();
      if (!res.ok || !data.script) {
        throw new Error(data.error || "Failed to generate script.");
      }

      setScript(data.script);
    } catch (err: any) {
      console.error("Script generation error:", err);
      setErrorMessage(err.message || "Failed to create script.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Generate Keyframe Image for a single scene
  const handleGenerateSceneImage = async (index: number) => {
    if (!script) return;
    const scene = script.scenes[index];

    const updatedScenes = [...script.scenes];
    updatedScenes[index] = { ...scene, isGeneratingImage: true };
    setScript({ ...script, scenes: updatedScenes });

    try {
      const res = await fetch("/api/generate-scene-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: scene.visualPrompt, aspectRatio: "16:9" }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        updatedScenes[index] = {
          ...updatedScenes[index],
          imageUrl: data.imageUrl,
          isGeneratingImage: false,
        };
        setScript({ ...script, scenes: updatedScenes });
      }
    } catch (err: any) {
      console.error("Image generation error:", err);
      updatedScenes[index] = { ...updatedScenes[index], isGeneratingImage: false };
      setScript({ ...script, scenes: updatedScenes });
    }
  };

  // Generate Gemini TTS Voiceover for a scene
  const handleGenerateTTS = async (index: number) => {
    if (!script) return;
    const scene = script.scenes[index];
    if (!scene.narration) return;

    const updatedScenes = [...script.scenes];
    updatedScenes[index] = { ...scene, isGeneratingAudio: true };
    setScript({ ...script, scenes: updatedScenes });

    try {
      const res = await fetch("/api/generate-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scene.narration, voiceName: "Kore" }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
        updatedScenes[index] = {
          ...updatedScenes[index],
          audioUrl,
          isGeneratingAudio: false,
        };
        setScript({ ...script, scenes: updatedScenes });
      }
    } catch (err: any) {
      console.error("TTS error:", err);
      updatedScenes[index] = { ...updatedScenes[index], isGeneratingAudio: false };
      setScript({ ...script, scenes: updatedScenes });
    }
  };

  // Generate images & TTS for ALL scenes simultaneously
  const handleBatchGenerateAll = async () => {
    if (!script) return;
    for (let i = 0; i < script.scenes.length; i++) {
      handleGenerateSceneImage(i);
      if (script.scenes[i].narration) {
        handleGenerateTTS(i);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Film className="w-3.5 h-3.5 text-indigo-400" /> AI Storyboard & Multi-Scene Director
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Concept Script to Multi-Scene Sequence
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Describe your video concept to automatically generate camera directions, keyframe artwork, and AI narrator voiceovers.
            </p>
          </div>

          {script && onSendToTimelineEditor && (
            <button
              onClick={() => onSendToTimelineEditor(script.scenes)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all shrink-0"
            >
              <Send className="w-4 h-4" /> Send Sequence to Timeline Canvas
            </button>
          )}
        </div>

        {/* Input Controls */}
        <div className="space-y-4 pt-2">
          <div className="relative">
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Enter your video concept or storyline idea..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold shrink-0">Scenes:</label>
              <select
                value={sceneCount}
                onChange={(e) => setSceneCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200"
              >
                <option value={2}>2 Scenes</option>
                <option value={3}>3 Scenes</option>
                <option value={4}>4 Scenes</option>
                <option value={5}>5 Scenes</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold shrink-0">Genre/Style:</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200"
              >
                <option value="Cinematic Sci-Fi">Cinematic Sci-Fi</option>
                <option value="Action Trailer">Action Trailer</option>
                <option value="Nature Documentary">Nature Documentary</option>
                <option value="Anime Fantasy">Anime Fantasy</option>
                <option value="Cyberpunk Noir">Cyberpunk Noir</option>
              </select>
            </div>

            <button
              onClick={handleGenerateScript}
              disabled={isGeneratingScript || !concept.trim()}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isGeneratingScript ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>Generate Script Breakdown</span>
            </button>
          </div>
        </div>
      </div>

      {/* Script Display & Scene Cards */}
      {script && (
        <div className="space-y-6">
          {/* Script Title & Logline Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-lg font-extrabold text-white">{script.title}</h3>
              <p className="text-xs text-slate-400 italic mt-0.5">{script.logline}</p>
            </div>

            <button
              onClick={handleBatchGenerateAll}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Generate All Images & TTS
            </button>
          </div>

          {/* Scenes Grid */}
          <div className="grid grid-cols-1 gap-6">
            {script.scenes.map((scene, idx) => (
              <div
                key={scene.id || idx}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-0"
              >
                {/* Scene Visual Preview Column (5 cols) */}
                <div className="lg:col-span-5 bg-slate-950 p-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {scene.imageUrl ? (
                      <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />
                    ) : scene.isGeneratingImage ? (
                      <div className="p-4 text-center space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                        <p className="text-[11px] text-slate-400">Rendering Scene Keyframe...</p>
                      </div>
                    ) : (
                      <div className="p-4 text-center space-y-2">
                        <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-[11px] text-slate-500">No Image Generated</p>
                      </div>
                    )}

                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-md text-white font-extrabold text-[10px] border border-slate-700">
                      SCENE {scene.sceneNumber} • {scene.duration}s
                    </span>
                  </div>

                  <button
                    onClick={() => handleGenerateSceneImage(idx)}
                    disabled={scene.isGeneratingImage}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {scene.isGeneratingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{scene.imageUrl ? "Regenerate Image" : "Generate Keyframe Image"}</span>
                  </button>
                </div>

                {/* Scene Details & Narration Column (7 cols) */}
                <div className="lg:col-span-7 p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-extrabold text-xs text-indigo-400 uppercase tracking-wider">
                        {scene.heading}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        Camera: {scene.cameraMotion}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visual Prompt:</span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        {scene.visualPrompt}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Narrator Line (TTS):</span>
                      <p className="text-xs text-slate-200 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        "{scene.narration}"
                      </p>
                    </div>
                  </div>

                  {/* Audio Voiceover Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      {scene.audioUrl ? (
                        <audio src={scene.audioUrl} controls className="h-8 w-48" />
                      ) : (
                        <span className="text-[11px] text-slate-500">No TTS Audio Generated</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleGenerateTTS(idx)}
                      disabled={scene.isGeneratingAudio || !scene.narration}
                      className="py-1.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {scene.isGeneratingAudio ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-indigo-300" />
                      )}
                      <span>{scene.audioUrl ? "Re-record TTS" : "Generate TTS Audio"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
