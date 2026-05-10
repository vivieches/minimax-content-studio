function buildImagePrompt(thumbnailPrompt: string, thumbnailText: string): string {
  return `YouTube thumbnail, 16:9, high CTR, modern technology channel style.
Main visual: realistic AI dashboard interface with cards, charts, content pipeline elements.
Clear composition, professional lighting, dark background with blue and purple accents.
Large readable Spanish text: "${thumbnailText}".
Do not generate random words.
Do not generate fake logos.
Do not generate "NO CODE".
Do not generate small unreadable text.
Do not generate brand names.
Do not create a generic wallpaper.
Original visual direction:
${thumbnailPrompt}`;
}

export async function generateThumbnailImage(thumbnailPrompt: string, thumbnailText: string) {
  const { generateImage } = await import("@/lib/minimax/image");
  const finalPrompt = buildImagePrompt(thumbnailPrompt, thumbnailText);
  const result = await generateImage({ prompt: finalPrompt, aspectRatio: "16:9", n: 1 });
  const url = result.urls[0] ?? null;
  const base64 = result.base64s[0] ?? null;

  if (!url && !base64) {
    throw new Error("MiniMax Image API returned an unexpected format.");
  }

  return { url, base64, finalPrompt };
}
