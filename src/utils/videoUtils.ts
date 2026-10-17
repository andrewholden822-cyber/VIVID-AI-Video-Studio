export const fetchVideoUrl = async (playlistId: string): Promise<string> => {
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

export const handleWatch = async (playlistId: string) => {
  const newTab = window.open('about:blank', '_blank'); // Open instantly
  const videoUrl = await fetchVideoUrl(playlistId);
  if (newTab) {
    newTab.location.href = videoUrl; // Redirect tab once URL is ready
  }
};
