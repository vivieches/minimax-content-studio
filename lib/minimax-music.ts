export async function generateMusic(prompt: string) {
  const { generateMusic: generateMiniMaxMusic } = await import("@/lib/minimax/music");
  const result = await generateMiniMaxMusic({ prompt });

  return {
    music_audio_url: result.audioUrl,
    music_audio_raw: result.rawData,
    music_error: result.error,
  };
}
